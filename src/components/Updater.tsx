/**
 * ============================================================
 *  Updater — 更新の確認と適用
 * ------------------------------------------------------------
 *  起動から少し経つと自動で確認します。
 *  「今すぐ確認」ボタンで、いつでも手動で調べられます。
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import type { UpdateStatus } from '../types';

/** 大きさを読みやすい形にします */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Updater() {
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const bridge = window.dd;

  /* 今のバージョンを取得します */
  useEffect(() => {
    bridge?.update.getVersion().then(setVersion);
  }, [bridge]);

  /* 更新の進み具合を受け取ります */
  useEffect(() => {
    if (!bridge) return;
    const stop = bridge.update.onStatus((data) => {
      setStatus(data);
      if (data.status !== 'checking') setChecking(false);
    });
    return stop;
  }, [bridge]);

  const check = useCallback(async () => {
    if (!bridge) return;
    setChecking(true);
    setStatus({ status: 'checking' });

    const r = await bridge.update.check();
    if (r.status === 'dev') {
      setStatus({ status: 'dev', message: r.message });
      setChecking(false);
    }
  }, [bridge]);

  const download = () => bridge?.update.download();
  const install = () => bridge?.update.install();

  /* ---------- 表示の中身 ---------- */

  const body = () => {
    if (!bridge) {
      return (
        <p className="text-[11.5px] leading-relaxed text-dd-muted">
          ブラウザで開いているため、更新の確認は行えません。
        </p>
      );
    }

    if (checking || status?.status === 'checking') {
      return (
        <p className="animate-pulse text-[11.5px] text-dd-muted">確認しています…</p>
      );
    }

    switch (status?.status) {
      case 'dev':
        return (
          <p className="text-[11.5px] leading-relaxed text-dd-muted">
            {status.message ?? '開発モードでは更新の確認を行いません。'}
            <br />
            インストール版でのみ動作します。
          </p>
        );

      case 'latest':
        return (
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-dd-ok/20 text-[11px] text-dd-ok">
              ✓
            </span>
            <p className="text-[12px]">最新の状態です。</p>
          </div>
        );

      case 'available':
        return (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-dd-accent/20 text-[11px] text-dd-accent">
                ↓
              </span>
              <p className="text-[12.5px] font-semibold">
                新しいバージョン {status.version} が公開されています
              </p>
            </div>

            {status.notes && (
              <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-relaxed text-dd-muted">
                {status.notes.replace(/<[^>]+>/g, '')}
              </div>
            )}

            <button
              onClick={download}
              className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
            >
              ダウンロードする
            </button>
          </div>
        );

      case 'downloading': {
        const pct = status.percent ?? 0;
        return (
          <div>
            <div className="mb-2 flex items-baseline gap-2">
              <p className="flex-1 text-[12px]">ダウンロードしています…</p>
              <span className="font-mono text-[11px] text-dd-muted">{pct}%</span>
            </div>

            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-dd-accent to-dd-accent2 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            {status.transferred !== undefined && status.total !== undefined && (
              <p className="text-[10.5px] text-dd-muted">
                {formatSize(status.transferred)} / {formatSize(status.total)}
                {status.bytesPerSecond ? ` ／ ${formatSize(status.bytesPerSecond)}/秒` : ''}
              </p>
            )}
          </div>
        );
      }

      case 'downloaded':
        return (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-dd-ok/20 text-[11px] text-dd-ok">
                ✓
              </span>
              <p className="text-[12.5px] font-semibold">
                バージョン {status.version} の準備ができました
              </p>
            </div>

            <p className="mb-3 text-[11px] leading-relaxed text-dd-muted">
              再起動すると更新が適用されます。
              あとで適用する場合は、次にアプリを終了したときに自動で行われます。
            </p>

            <button
              onClick={install}
              className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
            >
              再起動して適用する
            </button>
          </div>
        );

      case 'error':
        return (
          <div>
            <div className="mb-2 flex items-start gap-2">
              <span className="mt-[1px] grid h-5 w-5 flex-none place-items-center rounded-full bg-dd-ng/20 text-[11px] text-dd-ng">
                !
              </span>
              <p className="text-[12px] leading-relaxed">{status.message}</p>
            </div>
            {status.detail && (
              <p className="pl-7 font-mono text-[10px] leading-relaxed text-dd-muted/70">
                {status.detail.slice(0, 200)}
              </p>
            )}
          </div>
        );

      default:
        return (
          <p className="text-[11.5px] leading-relaxed text-dd-muted">
            起動から少し経つと、自動で確認します。
            <br />
            すぐ調べたい場合は、下のボタンを押してください。
          </p>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="flex-1 text-[13px] font-bold">アプリの更新</h2>
        {version && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] text-dd-muted">
            v{version}
          </span>
        )}
      </div>

      <div className="mb-4">{body()}</div>

      <button
        onClick={check}
        disabled={checking || !bridge}
        className="rounded-lg border border-white/10 px-4 py-2 text-[11.5px] transition hover:bg-white/10 disabled:opacity-40"
      >
        今すぐ確認する
      </button>
    </div>
  );
}
