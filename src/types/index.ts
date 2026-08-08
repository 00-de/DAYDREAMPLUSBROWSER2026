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
  update: {
    check: () => Promise<{ status: string; version?: string | null; message?: string }>;
    download: () => Promise<boolean>;
    install: () => Promise<boolean>;
    getVersion: () => Promise<string>;
    /** 進み具合を受け取ります。戻り値を呼ぶと受け取りをやめます。 */
    onStatus: (callback: (data: UpdateStatus) => void) => () => void;
  };
  isElectron: true;
}

/** 更新の進み具合 */
export interface UpdateStatus {
  status:
    | 'checking'
    | 'available'
    | 'latest'
    | 'downloading'
    | 'downloaded'
    | 'error'
    | 'dev';
  version?: string;
  notes?: string;
  date?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  bytesPerSecond?: number;
  message?: string;
  detail?: string;
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
export type ViewName =
  | 'home'
  | 'browser'
  | 'workspace'
  | 'dashboard'
  | 'mail'
  | 'appearance'
  | 'account'
  | 'check';

/* ============================================================
   Workspace 関連
   ============================================================ */

/** アプリ内に浮かぶウィンドウ1枚 */
export interface Pane {
  id: string;
  /** 起動元のツールID（tools.ts の id） */
  toolId: string;
  title: string;
  url: string;
  /** このウィンドウの中のタブ */
  tabs?: Tab[];
  /** 選択中のタブ */
  activeTabId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 重なり順 */
  z: number;
  minimized: boolean;
  maximized: boolean;
}

/** 保存できるレイアウト1件 */
export interface Layout {
  id: string;
  name: string;
  panes: Pane[];
  updatedAt: number;
}

/** スナップの配置位置 */
export type SnapZone =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'full';

/* ============================================================
   Browser（タブ）関連
   ============================================================ */

/** ブラウザのタブ1枚 */
export interface Tab {
  id: string;
  toolId: string;
  title: string;
  url: string;
  loading: boolean;
}

/* ============================================================
   DayDream Dashboard 関連
   ============================================================ */

/** メンバー */
export interface Member {
  id: string;
  name: string;
  reading: string;
  role: string;
  height: number;
  birthday: string;
  color: string;
  note: string;
  /** 顔写真の URL（Firebase Storage）。未登録なら空。 */
  photo?: string;
}

/** ライブ・イベント予定 */
export interface LiveEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  status: 'planned' | 'confirmed' | 'done' | 'canceled';
  note: string;
}

/** 楽曲 */
export interface Song {
  id: string;
  title: string;
  status: 'idea' | 'writing' | 'recording' | 'mixing' | 'released';
  vocal: string;
  releaseDate: string;
  url: string;
  note: string;
}

/** MV・映像 */
export interface Video {
  id: string;
  title: string;
  songId: string;
  status: 'idea' | 'shooting' | 'editing' | 'released';
  releaseDate: string;
  url: string;
  note: string;
}

/** SNSアカウント */
export interface SnsAccount {
  id: string;
  platform: string;
  handle: string;
  url: string;
  followers: number;
  updatedAt: string;
}

/** 目標 */
export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  done: boolean;
}

/* ============================================================
   DayDream Mail 関連
   ============================================================ */

/** 連絡先 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  group: 'fan' | 'staff' | 'friend';
  memberNo: string;
  note: string;
}

/** メールのひな形 */
export interface MailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

/** 送信済み・下書きのメール */
export interface MailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  /** 一斉配信の場合の宛先数 */
  count?: number;
}

/** 配信の記録 */
export interface MailLog {
  id: string;
  date: string;
  subject: string;
  count: number;
  status: string;
  ok: boolean;
}

/** メール送信の設定 */
export interface MailSettings {
  fromName: string;
  fromEmail: string;
  apiEndpoint: string;
  unsubUrl: string;
  ngWords: string;
}

/* ============================================================
   グループ（共有）関連
   ============================================================ */

/** 参加している人 */
export interface GroupMember {
  uid: string;
  email: string;
  /** 表示名 */
  name: string;
  /** グループを作った人かどうか */
  owner: boolean;
  /** 参加した日時（ミリ秒） */
  joinedAt: number;
}

/** グループ */
export interface Group {
  id: string;
  name: string;
  /** 参加用の合言葉（6文字） */
  inviteCode: string;
  /** 作った人の uid */
  ownerUid: string;
  /** 参加者の uid 一覧。Firestore の検索に使います。 */
  memberUids: string[];
  /** 参加者の詳細 */
  members: GroupMember[];
  createdAt: number;
}

/** いま使っている保存先 */
export type DataScope = 'personal' | 'group';
