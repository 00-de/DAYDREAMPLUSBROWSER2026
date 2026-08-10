/**
 * ============================================================
 *  DayDream Browser Ultimate — Electron メインプロセス
 * ------------------------------------------------------------
 *  アプリのウィンドウを作り、OSとのやりとりを担当します。
 *  ここは Node.js の世界なので、React のコードは書きません。
 * ============================================================
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { setupUpdater } = require('./updater.cjs');

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

  // 自動更新のしくみを組み立てます
  setupUpdater(mainWindow, isDev);

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

/* ============================================================
   パソコンのアプリを開く
   ============================================================ */

/** ファイルを選ぶ画面を出します */
ipcMain.handle('app:pickExe', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: '起動したいアプリを選んでください',
    properties: ['openFile'],
    filters: [
      { name: 'アプリ', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
      { name: 'すべて', extensions: ['*'] },
    ],
  });

  if (r.canceled || r.filePaths.length === 0) return null;

  const filePath = r.filePaths[0];
  const name = path.basename(filePath).replace(/\.(exe|lnk|bat|cmd)$/i, '');

  return { path: filePath, name };
});

/** 指定したアプリを起動します */
ipcMain.handle('app:launch', async (_event, filePath) => {
  if (typeof filePath !== 'string' || !filePath) {
    return { ok: false, error: '場所が指定されていません。' };
  }

  try {
    // shell.openPath は、実行ファイルもショートカットも開けます
    const err = await shell.openPath(filePath);
    if (err) return { ok: false, error: err };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e?.message ?? e) };
  }
});

/** そのアプリが今もあるか確かめます */
ipcMain.handle('app:exists', async (_event, filePath) => {
  if (typeof filePath !== 'string' || !filePath) return false;
  try {
    const fs = require('fs');
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
});

/** よくある場所からアプリを探します */
ipcMain.handle('app:findKnown', async () => {
  const fs = require('fs');
  const os = require('os');
  const home = os.homedir();

  /** 探す先の候補 */
  const bases = [
    process.env['ProgramFiles'],
    process.env['ProgramFiles(x86)'],
    process.env['LOCALAPPDATA'],
    process.env['APPDATA'],
    path.join(home, 'AppData', 'Local', 'Programs'),
  ].filter(Boolean);

  /** 探すアプリの一覧 */
  const targets = [
    { id: 'capcut',    name: 'CapCut',            dirs: ['CapCut'],                exe: 'CapCut.exe' },
    { id: 'davinci',   name: 'DaVinci Resolve',   dirs: ['Blackmagic Design/DaVinci Resolve'], exe: 'Resolve.exe' },
    { id: 'blender',   name: 'Blender',           dirs: ['Blender Foundation/Blender 4.2', 'Blender Foundation/Blender 4.1', 'Blender Foundation/Blender 4.0', 'Blender Foundation/Blender 3.6'], exe: 'blender.exe' },
    { id: 'obs',       name: 'OBS Studio',        dirs: ['obs-studio/bin/64bit'],   exe: 'obs64.exe' },
    { id: 'audacity',  name: 'Audacity',          dirs: ['Audacity'],               exe: 'Audacity.exe' },
    { id: 'vscode',    name: 'VS Code',           dirs: ['Microsoft VS Code'],      exe: 'Code.exe' },
    { id: 'ghdesktop', name: 'GitHub Desktop',    dirs: ['GitHubDesktop'],          exe: 'GitHubDesktop.exe' },
    { id: 'vlc',       name: 'VLC',               dirs: ['VideoLAN/VLC'],           exe: 'vlc.exe' },
    { id: 'voicevox',  name: 'VOICEVOX',          dirs: ['VOICEVOX'],               exe: 'VOICEVOX.exe' },
    { id: 'discord',   name: 'Discord',           dirs: ['Discord'],                exe: 'Update.exe' },
    { id: 'bandicam',  name: 'Bandicam',          dirs: ['Bandicam'],               exe: 'bdcam.exe' },
  ];

  const found = [];

  for (const t of targets) {
    for (const base of bases) {
      let hit = null;

      for (const d of t.dirs) {
        const p = path.join(base, ...d.split('/'), t.exe);
        try {
          if (fs.existsSync(p)) { hit = p; break; }
        } catch { /* 読めない場所は飛ばします */ }
      }

      if (hit) {
        found.push({ id: t.id, name: t.name, path: hit });
        break;
      }
    }
  }

  return found;
});

ipcMain.handle('shell:openExternal', (_event, url) => {
  if (typeof url === 'string' && /^https?:\/\//.test(url)) {
    shell.openExternal(url);
    return true;
  }
  return false;
});
