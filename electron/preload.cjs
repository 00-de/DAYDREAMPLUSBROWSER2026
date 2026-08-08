/**
 * ============================================================
 *  preload — メインプロセスと React の橋渡し
 * ------------------------------------------------------------
 *  React 側からは window.dd.〜 の形で呼び出せます。
 *  ここに書いた機能だけが公開されるため、安全です。
 * ============================================================
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dd', {
  /** ウィンドウ操作 */
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  /** アプリ情報の取得 */
  app: {
    getInfo: () => ipcRenderer.invoke('app:getInfo'),
  },

  /** 既定のブラウザで URL を開く */
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  /** 自動更新 */
  update: {
    /** 更新があるか確認します */
    check: () => ipcRenderer.invoke('update:check'),
    /** 更新をダウンロードします */
    download: () => ipcRenderer.invoke('update:download'),
    /** 再起動して更新を適用します */
    install: () => ipcRenderer.invoke('update:install'),
    /** 今のバージョンを取得します */
    getVersion: () => ipcRenderer.invoke('update:getVersion'),
    /**
     * 進み具合を受け取ります。
     * 戻り値の関数を呼ぶと、受け取りをやめます。
     */
    onStatus: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on('update:status', handler);
      return () => ipcRenderer.removeListener('update:status', handler);
    },
  },

  /** Electron 上で動いているかの判定に使う目印 */
  isElectron: true,
});
