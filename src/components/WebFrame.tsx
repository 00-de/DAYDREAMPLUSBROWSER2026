/**
 * ============================================================
 *  WebFrame — アプリ内にサイトを表示する枠
 * ------------------------------------------------------------
 *  Electron の <webview> を React から扱えるようにしたものです。
 *
 *  ▼ 重要な制約
 *  Google・YouTube・X などは、埋め込みをサイト側が拒否します。
 *  その場合は自動で検知し、「ブラウザで開く」案内に切り替えます。
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';

/** 埋め込みを拒否することがわかっているサイト */
const BLOCKED_HOSTS = [
  'google.com',
  'www.google.com',
  'drive.google.com',
  'docs.google.com',
  'accounts.google.com',
  'youtube.com',
  'www.youtube.com',
  'studio.youtube.com',
  'x.com',
  'twitter.com',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
];

function isBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return BLOCKED_HOSTS.some((b) => host === b.replace(/^www\./, '') || host.endsWith('.' + b));
  } catch {
    return false;
  }
}

interface Props {
  url: string;
  /** 読み込み状況を親へ伝える */
  onTitle?: (title: string) => void;
  onLoading?: (loading: boolean) => void;
  onUrlChange?: (url: string) => void;
  /** 親から操作するための命令 */
  command?: { type: 'back' | 'forward' | 'reload'; nonce: number } | null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type WebviewEl = any;

/** React の型定義に <webview> が無いため、独自要素として扱います */
const Webview = 'webview' as unknown as React.FC<any>;

export default function WebFrame({ url, onTitle, onLoading, onUrlChange, command }: Props) {
  const ref = useRef<WebviewEl>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const blocked = isBlocked(url);

  /* ---------- webview のイベントを受け取る ---------- */
  useEffect(() => {
    if (blocked) return;
    const el = ref.current;
    if (!el) return;

    const startLoad = () => {
      setLoading(true);
      onLoading?.(true);
    };
    const stopLoad = () => {
      setLoading(false);
      onLoading?.(false);
    };
    const onTitleSet = (e: any) => onTitle?.(e.title);
    const onNavigate = (e: any) => onUrlChange?.(e.url);
    const onFail = (e: any) => {
      // -3 は利用者による中断なので無視する
      if (e.errorCode === -3) return;
      setFailed(`読み込めませんでした（${e.errorDescription || e.errorCode}）`);
      stopLoad();
    };

    el.addEventListener('did-start-loading', startLoad);
    el.addEventListener('did-stop-loading', stopLoad);
    el.addEventListener('page-title-updated', onTitleSet);
    el.addEventListener('did-navigate', onNavigate);
    el.addEventListener('did-navigate-in-page', onNavigate);
    el.addEventListener('did-fail-load', onFail);

    return () => {
      el.removeEventListener('did-start-loading', startLoad);
      el.removeEventListener('did-stop-loading', stopLoad);
      el.removeEventListener('page-title-updated', onTitleSet);
      el.removeEventListener('did-navigate', onNavigate);
      el.removeEventListener('did-navigate-in-page', onNavigate);
      el.removeEventListener('did-fail-load', onFail);
    };
  }, [blocked, onTitle, onLoading, onUrlChange]);

  /* ---------- 親からの命令（戻る・進む・再読込） ---------- */
  useEffect(() => {
    if (!command || blocked) return;
    const el = ref.current;
    if (!el) return;

    try {
      if (command.type === 'back' && el.canGoBack()) el.goBack();
      if (command.type === 'forward' && el.canGoForward()) el.goForward();
      if (command.type === 'reload') {
        setFailed(null);
        el.reload();
      }
    } catch {
      /* まだ準備できていない場合は無視 */
    }
  }, [command, blocked]);

  /* ---------- 埋め込みできないサイトの案内 ---------- */
  if (blocked || failed) {
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="max-w-[360px] text-center">
          <div className="mb-4 text-3xl opacity-30">⊘</div>

          <h3 className="mb-2 text-[14px] font-bold">
            {blocked ? 'このサイトはアプリ内で表示できません' : '読み込みに失敗しました'}
          </h3>

          <p className="mb-5 text-[11.5px] leading-relaxed text-dd-muted">
            {blocked
              ? 'Google・YouTube・X などは、安全のためサイト側が埋め込みを禁止しています。設定を変えても回避できません。'
              : failed}
          </p>

          <button
            onClick={() => window.dd?.shell.openExternal(url)}
            className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-5 py-2.5 text-[12px] font-semibold text-white transition hover:brightness-110"
          >
            ブラウザで開く
          </button>

          <p className="mt-4 break-all text-[10px] text-dd-muted/70">{url}</p>
        </div>
      </div>
    );
  }

  /* ---------- 通常表示 ---------- */
  return (
    <div className="relative h-full w-full bg-white">
      {loading && (
        <div className="absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden bg-white/10">
          <div className="h-full w-1/3 animate-[slide_1.1s_ease-in-out_infinite] bg-gradient-to-r from-dd-accent to-dd-accent2" />
        </div>
      )}

      {/* webview は Electron 専用の要素で、React の型に無いため any 経由で作ります */}
      <Webview
        ref={ref}
        src={url}
        allowpopups="true"
        style={{ width: '100%', height: '100%', display: 'flex' }}
      />
    </div>
  );
}
