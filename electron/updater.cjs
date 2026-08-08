/**
 * ============================================================
 *  自動更新
 * ------------------------------------------------------------
 *  GitHub Releases に置いた新しいインストーラーを見つけて、
 *  ダウンロードと差し替えを行います。
 *
 *  【使い方】
 *   1. package.json の version を上げる（例 1.0.0 → 1.0.1）
 *   2. 3_インストーラー作成.bat でインストーラーを作る
 *   3. GitHub の Releases に、できた .exe と latest.yml を上げる
 *   4. 利用者のアプリが起動時に気づき、更新を促します
 *
 *  ※ 開発モードでは動きません（本番ビルドでのみ有効）
 * ============================================================
 */

const { app, ipcMain, dialog } = require('electron');

let autoUpdater = null;
let mainWindow = null;

/** 状態を React 側へ知らせます */
function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

/**
 * 自動更新のしくみを組み立てます。
 * @param {BrowserWindow} win メインウィンドウ
 * @param {boolean} isDev 開発モードかどうか
 */
function setupUpdater(win, isDev) {
  mainWindow = win;

  /* 開発モードでは、更新の確認は行いません */
  if (isDev) {
    ipcMain.handle('update:check', () => ({
      status: 'dev',
      message: '開発モードでは更新の確認を行いません。',
    }));
    ipcMain.handle('update:install', () => false);
    ipcMain.handle('update:getVersion', () => app.getVersion());
    return;
  }

  try {
    autoUpdater = require('electron-updater').autoUpdater;
  } catch (e) {
    console.error('electron-updater を読み込めませんでした:', e.message);
    ipcMain.handle('update:check', () => ({
      status: 'error',
      message: '更新機能を利用できません。',
    }));
    ipcMain.handle('update:install', () => false);
    ipcMain.handle('update:getVersion', () => app.getVersion());
    return;
  }

  /* ダウンロードは利用者の確認後に行います */
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  /* ---------- 更新の各段階を React へ伝えます ---------- */

  autoUpdater.on('checking-for-update', () => {
    send('update:status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    send('update:status', {
      status: 'available',
      version: info.version,
      notes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
      date: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    send('update:status', { status: 'latest', version: app.getVersion() });
  });

  autoUpdater.on('download-progress', (p) => {
    send('update:status', {
      status: 'downloading',
      percent: Math.round(p.percent),
      transferred: p.transferred,
      total: p.total,
      bytesPerSecond: p.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    send('update:status', { status: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (err) => {
    const raw = String(err?.message ?? err);
    let message = '更新の確認に失敗しました。';

    if (raw.includes('ENOTFOUND') || raw.includes('ETIMEDOUT') || raw.includes('ENETUNREACH')) {
      message = 'インターネットに接続できませんでした。';
    } else if (raw.includes('404')) {
      message = '更新情報が見つかりませんでした。まだ公開されていない可能性があります。';
    } else if (raw.includes('403') || raw.includes('401')) {
      message = '更新情報を取得する権限がありません。リポジトリの公開設定をご確認ください。';
    }

    send('update:status', { status: 'error', message, detail: raw });
  });

  /* ---------- React からの呼び出し ---------- */

  /** 更新があるか確認します */
  ipcMain.handle('update:check', async () => {
    try {
      const r = await autoUpdater.checkForUpdates();
      return { status: 'ok', version: r?.updateInfo?.version ?? null };
    } catch (e) {
      return { status: 'error', message: String(e?.message ?? e) };
    }
  });

  /** 更新をダウンロードします */
  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return true;
    } catch (e) {
      send('update:status', {
        status: 'error',
        message: 'ダウンロードに失敗しました。',
        detail: String(e?.message ?? e),
      });
      return false;
    }
  });

  /** アプリを終了して、更新を適用します */
  ipcMain.handle('update:install', async () => {
    const r = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['今すぐ再起動', 'あとで'],
      defaultId: 0,
      cancelId: 1,
      title: '更新の適用',
      message: 'アプリを再起動して、更新を適用します。',
      detail: '保存していない作業があれば、先に保存してください。',
    });

    if (r.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall(false, true));
      return true;
    }
    return false;
  });

  /** 今のバージョンを返します */
  ipcMain.handle('update:getVersion', () => app.getVersion());

  /* ---------- 起動から少し経ってから、自動で確認します ---------- */
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      /* 失敗しても、起動の妨げにはしません */
    });
  }, 8000);
}

module.exports = { setupUpdater };
