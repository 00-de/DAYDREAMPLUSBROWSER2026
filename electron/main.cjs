/**
 * ============================================================
 *  DayDream Browser Ultimate — Electron メインプロセス
 * ------------------------------------------------------------
 *  アプリのウィンドウを作り、OSとのやりとりを担当します。
 *  ここは Node.js の世界なので、React のコードは書きません。
 * ============================================================
 */

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5180';

/** メインウィンドウの参照（GC対策で変数に保持） */
let mainWindow = null;

/* ============================================================
   ウィンドウ生成
   ============================================================ */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,

    // ガラスUIのため、OS標準の枠を消して自前のタイトルバーを使う
    frame: false,
    backgroundColor: '#0b0f1a',
    show: false, // 描画完了まで隠す（白い画面のちらつき防止）

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,   // セキュリティ：必ず true
      nodeIntegration: false,   // セキュリティ：必ず false
      sandbox: false,
      webviewTag: true,         // アプリ内にサイトを埋め込むため
    },
  });

  // 準備ができてから表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // 外部リンクは既定のブラウザで開く（アプリ内で開かせない）
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/* ============================================================
   アプリのライフサイクル
   ============================================================ */

// 多重起動を防ぐ
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  // Windows / Linux は全ウィンドウを閉じたら終了
  if (process.platform !== 'darwin') app.quit();
});

/* ============================================================
   IPC（React 側からの呼び出し窓口）
   ============================================================ */

/* ============================================================
   webview（アプリ内ブラウザ）の安全設定
   ============================================================ */

app.on('web-contents-created', (_event, contents) => {
  // webview が作られるとき、危険な設定を強制的に無効化する
  contents.on('will-attach-webview', (_e, webPreferences) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
  });

  // webview の中から新しいウィンドウを開こうとしたら、既定のブラウザへ回す
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });
  }
});

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  }
  mainWindow.maximize();
  return true;
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle('app:getInfo', () => {
  return {
    appVersion: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
  };
});

ipcMain.handle('shell:openExternal', (_event, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) {
    shell.openExternal(url);
    return true;
  }
  return false;
});
