/**
 * ============================================================
 *  StartupCheck — 起動チェック画面
 * ------------------------------------------------------------
 *  7月31日に作った自己診断画面です。
 *  タイトルバーの「起動チェック」からいつでも確認できます。
 * ============================================================
 */

import { useEffect, useState } from 'react';
import { firebaseConfig, isFirebaseReady } from '../lib/firebase';
import type { AppInfo, CheckItem } from '../types';

export default function StartupCheck() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [checks, setChecks] = useState<CheckItem[]>([]);

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

      setChecks([
        { id: 'react', label: 'React 18', status: 'ok', detail: 'この画面が見えている時点で正常です' },
        { id: 'ts', label: 'TypeScript', status: 'ok', detail: '型チェックを通過してビルドされています' },
        { id: 'vite', label: 'Vite', status: 'ok', detail: import.meta.env.DEV ? '開発サーバー稼働中' : '本番ビルド' },
        { id: 'tailwind', label: 'Tailwind CSS', status: 'ok', detail: '配色とレイアウトが適用されています' },
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
          detail: bridge && appInfo ? 'メインプロセスとの通信に成功しました' : 'Electron 上でのみ確認できます',
        },
        {
          id: 'firebase',
          label: 'Firebase',
          status: isFirebaseReady ? 'ok' : 'wait',
          detail: isFirebaseReady
            ? `プロジェクト: ${firebaseConfig.projectId}`
            : 'src/lib/firebase.ts に設定を入力してください（8/5の作業）',
        },
      ]);
    };

    run();
  }, []);

  const okCount = checks.filter((c) => c.status === 'ok').length;
  const ngCount = checks.filter((c) => c.status === 'ng').length;

  return (
    <div className="mx-auto w-full max-w-3xl animate-rise px-8 pb-28 pt-10">
      <h1 className="mb-1 text-[19px] font-extrabold">起動チェック</h1>
      <p className="mb-7 text-[12px] text-dd-muted">開発環境が正しく動いているかを確認します。</p>

      <div
        className={`mb-6 rounded-2xl border px-5 py-4 text-center text-[13px] ${
          ngCount === 0
            ? 'border-dd-ok/30 bg-dd-ok/10 text-dd-ok'
            : 'border-dd-warn/30 bg-dd-warn/10 text-dd-warn'
        }`}
      >
        {ngCount === 0 ? (
          <b>すべて正常に動作しています</b>
        ) : (
          <b>あと {ngCount} 項目 確認が必要です</b>
        )}
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-[18px]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-[13px] font-bold">診断結果</h2>
          <span className="text-[11px] text-dd-muted">
            {okCount} / {checks.length} 項目 正常
          </span>
        </div>

        {checks.map((c) => (
          <div key={c.id} className="flex items-start gap-3 border-b border-white/5 px-5 py-3 last:border-0">
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

      {info && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-[18px]">
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
    </div>
  );
}
