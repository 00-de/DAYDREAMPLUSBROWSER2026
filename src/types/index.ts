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

/** ホーム画面・Dock に並ぶツール */
export interface Tool {
  id: string;
  name: string;
  category: 'ai' | 'dev' | 'daydream' | 'media' | 'sns';
  /** 表示する記号（絵文字または1文字） */
  icon: string;
  /** Tailwind のグラデーション指定 */
  color: string;
  /** 空文字の場合は「準備中」として扱います */
  url: string;
}

/** 通知エリアに出す1件 */
export interface Notice {
  id: string;
  type: 'info' | 'warn' | 'task';
  title: string;
  detail: string;
}

/** 画面の切り替え */
export type ViewName = 'home' | 'check';
