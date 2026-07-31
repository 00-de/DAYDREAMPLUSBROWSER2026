/**
 * ============================================================
 *  DayDream Browser Ultimate — 共通の型定義
 * ============================================================
 */

/** Electron から受け取るアプリ情報 */
export interface AppInfo {
  appVersion: string;
  electron: string;
  chrome: string;
  node: string;
  platform: string;
  arch: string;
}

/** preload.cjs で公開した API の型 */
export interface DDBridge {
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<boolean>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };
  app: {
    getInfo: () => Promise<AppInfo>;
  };
  shell: {
    openExternal: (url: string) => Promise<boolean>;
  };
  isElectron: true;
}

declare global {
  interface Window {
    /** Electron 上でのみ存在します。ブラウザで開いた場合は undefined。 */
    dd?: DDBridge;
  }
}

/** 起動時の自己診断の結果 */
export interface CheckItem {
  id: string;
  label: string;
  status: 'ok' | 'ng' | 'wait';
  detail: string;
}
