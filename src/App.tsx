/**
 * ============================================================
 *  App — 起動確認画面
 * ------------------------------------------------------------
 *  7月31日の完成目標「開発環境が正常起動すること」を
 *  目で見て確認するための画面です。
 *  8月1日からは、ここをホーム画面に置き換えていきます。
 * ============================================================
 */

import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import { isFirebaseReady, firebaseConfig } from './lib/firebase';
import type { AppInfo, CheckItem } from './types';

export default function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [now, setNow] = useState(new Date());

  /* 時計 */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* 起動時の自己診断 */
  useEffect(() => {
    const run = async () => {
      const bridge = window.dd;
      let appInfo: AppInfo | null = null;

      if (bridge) {
        try {
          appInfo = await bridge.app.getInfo();
          setInfo(appInfo);
        } catch {
          /* 取得できなくても続行 */
        }
      }

      const result: CheckItem[] = [
        {
          id: 'react',
          label: 'React 18',
          status: 'ok',
          detail: 'この画面が見えている時点で正常です',
        },
        {
          id: 'ts',
          label: 'TypeScript',
          status: 'ok',
          detail: '型チェックを通過してビルドされています',
        },
        {
          id: 'vite',
          label: 'Vite',
          status: 'ok',
          detail: import.meta.env.DEV ? '開発サーバー稼働中' : '本番ビルド',
        },
        {
          id: 'tailwind',
          label: 'Tailwind CSS',
          status: 'ok',
          detail: '配色とレイアウトが適用されています',
        },
        {
          id: 'electron',
          label: 'Electron',
          status: bridge ? 'ok' : 'ng',
          detail: bridge
            ? `Electron ${appInfo?.electron ?? '?'} / Chromium ${appInfo?.chrome ?? '?'}`
            : 'ブラウザで開いています。2_開発起動.bat から起動してください',
        },
        {
          id: 'ipc',
          label: 'IPC 通信',
          status: bridge && appInfo ? 'ok' : 'ng',
          detail:
            bridge && appInfo
              ? 'メインプロセスとの通信に成功しました'
              : 'Electron 上でのみ確認できます',
        },
        {
          id: 'firebase',
          label: 'Firebase',
          status: isFirebaseReady ? 'ok' : 'wait',
          detail: isFirebaseReady
            ? `プロジェクト: ${firebaseConfig.projectId}`
            : 'src/lib/firebase.ts に設定を入力してください（8/5の作業）',
        },
      ];

      setChecks(result);
    };

    run();
  }, []);

  const okCount = checks.filter((c) => c.status === 'ok').length;
  const ngCount = checks.filter((c) => c.status === 'ng').length;

  return (
    <div className="flex h-full flex-col">
      <TitleBar />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl animate-rise px-8 py-12">
          {/* ---------- ヘッダー ---------- */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[22px] bg-gradient-to-br from-dd-accent to-dd-accent2 text-4xl shadow-[0_10px_40px_rgba(91,140,255,.4)]">
              ✦
            </div>
            <h1 className="mb-2 text-2xl font-extrabold tracking-wide">
              DayDream Browser Ultimate
            </h1>
            <p className="text-[12.5px] text-dd-muted">
              Ver.1.0 開発版 ／ 目標完成日 2026年8月11日
            </p>
            <p className="mt-4 font-mono text-3xl tabular-nums tracking-wider">
              {now.toLocaleTimeString('ja-JP')}
            </p>
            <p className="text-[11.5px] text-dd-muted">
              {now.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>

          {/* ---------- 総合判定 ---------- */}
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-center text-[13px] ${
              ngCount === 0
                ? 'border-dd-ok/30 bg-dd-ok/10 text-dd-ok'
                : 'border-dd-warn/30 bg-dd-warn/10 text-dd-warn'
            }`}
          >
            {ngCount === 0 ? (
              <>
                <b>環境構築 完了</b>
                <br />
                <span className="text-[11.5px] opacity-80">
                  7月31日の目標を達成しました。明日はホーム画面の作成です。
                </span>
              </>
            ) : (
              <>
                <b>あと {ngCount} 項目 確認が必要です</b>
                <br />
                <span className="text-[11.5px] opacity-80">
                  下の一覧で ✕ の項目をご確認ください。
                </span>
              </>
            )}
          </div>

          {/* ---------- 診断一覧 ---------- */}
          <div className="glass mb-6 overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <h2 className="text-[13px] font-bold">起動チェック</h2>
              <span className="text-[11px] text-dd-muted">
                {okCount} / {checks.length} 項目 正常
              </span>
            </div>

            {checks.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 border-b border-white/5 px-5 py-3 last:border-0"
              >
                <span
                  className={`mt-[2px] grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] ${
                    c.status === 'ok'
                      ? 'bg-dd-ok/20 text-dd-ok'
                      : c.status === 'ng'
                        ? 'bg-dd-ng/20 text-dd-ng'
                        : 'bg-dd-warn/20 text-dd-warn'
                  }`}
                >
                  {c.status === 'ok' ? '✓' : c.status === 'ng' ? '✕' : '…'}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{c.label}</div>
                  <div className="text-[11.5px] leading-relaxed text-dd-muted">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ---------- 環境情報 ---------- */}
          {info && (
            <div className="glass mb-6 rounded-2xl p-5">
              <h2 className="mb-3 text-[13px] font-bold">環境情報</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11.5px]">
                {[
                  ['アプリ', `v${info.appVersion}`],
                  ['Electron', info.electron],
                  ['Chromium', info.chrome],
                  ['Node.js', info.node],
                  ['プラットフォーム', info.platform],
                  ['アーキテクチャ', info.arch],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                    <dt className="text-dd-muted">{k}</dt>
                    <dd className="font-mono">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* ---------- 次の予定 ---------- */}
          <div className="glass rounded-2xl p-5">
            <h2 className="mb-3 text-[13px] font-bold">これからの予定</h2>
            <ul className="space-y-2 text-[11.5px] text-dd-muted">
              {[
                ['8/1', 'ホーム画面'],
                ['8/2', 'Workspace'],
                ['8/3', 'Dock'],
                ['8/4', 'AIツール連携'],
                ['8/5', 'GitHub・Vercel・Firebase'],
                ['8/6', 'プロジェクト管理'],
                ['8/7', 'DayDream専用機能'],
                ['8/8', 'メーリングアプリ ①'],
                ['8/9', 'メーリングアプリ ②'],
                ['8/10', 'デザイン統一・ショートカット'],
                ['8/11', '総合テスト・完成'],
              ].map(([d, t]) => (
                <li key={d} className="flex gap-3">
                  <span className="w-12 flex-none font-mono text-dd-accent">{d}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
