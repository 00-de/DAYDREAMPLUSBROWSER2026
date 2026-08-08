/**
 * ============================================================
 *  Account — ログインと同期の画面
 * ------------------------------------------------------------
 *  8月5日の作業内容：
 *    Firebase Authentication ／ Firestore 同期
 * ============================================================
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSync } from '../hooks/useSync';
import { firebaseConfig, isFirebaseReady } from '../lib/firebase';
import Updater from './Updater';

export default function Account() {
  const { user, ready, busy, error, login, register, logout, setError } = useAuth();
  const sync = useSync(user);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    if (mode === 'login') await login(email, password);
    else await register(email, password);
  };

  /* ---------- Firebase 未設定 ---------- */
  if (!isFirebaseReady) {
    return (
      <div className="mx-auto w-full max-w-2xl animate-rise px-8 pb-28 pt-10">
        <h1 className="mb-1 text-[19px] font-extrabold">アカウント</h1>
        <p className="mb-7 text-[12px] text-dd-muted">クラウド同期の設定です。</p>

        <div className="mb-5 rounded-2xl border border-dd-warn/30 bg-dd-warn/10 p-6">
          <h2 className="mb-2 text-[14px] font-bold text-dd-warn">Firebase が未設定です</h2>
          <p className="text-[12px] leading-relaxed text-dd-muted">
            <code className="rounded bg-black/30 px-1.5 py-0.5">src/lib/firebase.ts</code> に、
            Firebase コンソールで取得した設定を入力してください。
          </p>
        </div>

        <Updater />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <p className="text-[12px] text-dd-muted">確認しています…</p>
      </div>
    );
  }

  /* ---------- 未ログイン ---------- */
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md animate-rise px-8 pb-28 pt-14">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[18px] bg-gradient-to-br from-dd-accent to-dd-accent2 text-2xl shadow-[0_10px_40px_rgba(91,140,255,.4)]">
            ✦
          </div>
          <h1 className="text-[17px] font-extrabold">
            {mode === 'login' ? 'ログイン' : 'アカウント作成'}
          </h1>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-dd-muted">
            お気に入り・Dock・レイアウトを
            <br />
            別の PC でも使えるようになります。
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] text-dd-muted">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[13px] outline-none transition focus:border-dd-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] text-dd-muted">
              パスワード（6文字以上）
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[13px] outline-none transition focus:border-dd-accent"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-dd-ng/30 bg-dd-ng/10 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-dd-ng">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 py-2.5 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {busy ? '処理中…' : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
          </button>

          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="w-full py-1.5 text-[11.5px] text-dd-muted transition hover:text-dd-text"
          >
            {mode === 'login'
              ? 'アカウントをお持ちでない方はこちら'
              : 'すでにアカウントをお持ちの方はこちら'}
          </button>
        </div>

        <p className="mt-8 text-center text-[10.5px] leading-relaxed text-dd-muted/70">
          ログインしなくても、この PC の中では
          <br />
          これまでどおりお使いいただけます。
        </p>

        <div className="mt-8">
          <Updater />
        </div>
      </div>
    );
  }

  /* ---------- ログイン済み ---------- */
  return (
    <div className="mx-auto w-full max-w-2xl animate-rise px-8 pb-28 pt-10">
      <h1 className="mb-1 text-[19px] font-extrabold">アカウント</h1>
      <p className="mb-7 text-[12px] text-dd-muted">クラウド同期の設定です。</p>

      {/* 利用者情報 */}
      <div className="mb-5 flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-gradient-to-br from-dd-accent to-dd-accent2 text-[16px] font-bold text-white">
          {(user.email ?? '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{user.email}</div>
          <div className="text-[10.5px] text-dd-muted">ログイン中</div>
        </div>
        <button
          onClick={logout}
          className="flex-none rounded-lg border border-white/10 px-3.5 py-2 text-[11.5px] transition hover:bg-white/10"
        >
          ログアウト
        </button>
      </div>

      {/* 同期 */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[13px] font-bold">クラウド同期</h2>
          <span
            className={`rounded-full px-2 py-0.5 text-[9.5px] ${
              sync.state === 'error'
                ? 'bg-dd-ng/20 text-dd-ng'
                : sync.state === 'saving'
                  ? 'bg-dd-warn/20 text-dd-warn'
                  : 'bg-dd-ok/20 text-dd-ok'
            }`}
          >
            {sync.state === 'error' ? 'エラー' : sync.state === 'saving' ? '処理中' : '接続済み'}
          </span>
        </div>

        <p className="mb-4 text-[11.5px] leading-relaxed text-dd-muted">
          お気に入り・Dock の並び・保存したレイアウトを、クラウドに保存します。
          別の PC でログインして「取り込む」を押すと、同じ設定になります。
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={sync.push}
            disabled={sync.state === 'saving'}
            className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
          >
            ↑ この PC の設定を保存
          </button>
          <button
            onClick={sync.pull}
            disabled={sync.state === 'saving'}
            className="rounded-lg border border-white/10 px-4 py-2 text-[12px] transition hover:bg-white/10 disabled:opacity-40"
          >
            ↓ クラウドから取り込む
          </button>
        </div>

        {sync.message && (
          <div className="mt-3.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-dd-muted">
            {sync.message}
          </div>
        )}

        {sync.lastSaved && (
          <p className="mt-3 text-[10.5px] text-dd-muted/70">
            最終更新：{sync.lastSaved.toLocaleString('ja-JP')}
          </p>
        )}
      </div>

      {/* 接続情報 */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <h2 className="mb-3 text-[13px] font-bold">接続情報</h2>
        <dl className="space-y-2 text-[11.5px]">
          {[
            ['プロジェクト', firebaseConfig.projectId],
            ['保存先', `users/${user.uid.slice(0, 8)}…/settings/workspace`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-white/5 pb-1.5">
              <dt className="flex-none text-dd-muted">{k}</dt>
              <dd className="truncate font-mono text-[10.5px]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5">
        <Updater />
      </div>
    </div>
  );
}
