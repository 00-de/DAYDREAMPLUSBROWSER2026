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
    minimize:    () => ipcRenderer.invoke('window:minimize'),
    maximize:    () => ipcRenderer.invoke('window:maximize'),
    close:       () => ipcRenderer.invoke('window:close'),
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

  /** Electron 上で動いているかの判定に使う目印 */
  isElectron: true,
});
