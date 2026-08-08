/**
 * ============================================================
 *  GroupPanel — グループ（データ共有）の設定
 * ------------------------------------------------------------
 *  グループを作るか、合言葉で参加すると、
 *  メンバー・ライブ・曲・連絡先などを全員で共有できます。
 * ============================================================
 */

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { useGroup } from '../hooks/useGroup';
import { inputClass } from '../lib/status';

interface Props {
  user: User | null;
  /** 親から渡された useGroup の結果を使う場合 */
  ctrl?: ReturnType<typeof useGroup>;
}

export default function GroupPanel({ user, ctrl }: Props) {
  const own = useGroup(user);
  const g = ctrl ?? own;

  const [mode, setMode] = useState<'none' | 'create' | 'join'>('none');
  const [groupName, setGroupName] = useState('DayDream➕ チーム');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  /* ---------- 未ログイン ---------- */
  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <h2 className="mb-2 text-[13px] font-bold">グループで共有</h2>
        <p className="text-[11.5px] leading-relaxed text-dd-muted">
          仲間とデータを共有するには、ログインが必要です。
        </p>
      </div>
    );
  }

  if (g.loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <p className="animate-pulse text-[11.5px] text-dd-muted">確認しています…</p>
      </div>
    );
  }

  const copyCode = async () => {
    if (!g.group) return;
    try {
      await navigator.clipboard.writeText(g.group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 使えない環境では何もしません */
    }
  };

  /* ============ グループに参加している ============ */
  if (g.group) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="flex-1 text-[13px] font-bold">{g.group.name}</h2>
          <span className="rounded-full bg-dd-ok/20 px-2.5 py-0.5 text-[9.5px] text-[#7ee5b6]">
            {g.group.members.length} 人
          </span>
        </div>

        {/* 共有の切り替え */}
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex-1 text-[12px] font-semibold">
              {g.useGroupData ? 'グループの内容を表示中' : '自分だけの内容を表示中'}
            </span>
            <button
              onClick={() => g.toggleScope(!g.useGroupData)}
              className={`relative h-6 w-11 flex-none rounded-full transition ${
                g.useGroupData ? 'bg-dd-accent' : 'bg-white/15'
              }`}
              title="切り替える"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  g.useGroupData ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-[10.5px] leading-relaxed text-dd-muted">
            {g.useGroupData
              ? 'メンバー・ライブ・曲・連絡先などを、参加者全員で見て編集できます。'
              : '自分だけの内容に切り替えています。グループの内容は変わりません。'}
          </p>
        </div>

        {/* 合言葉 */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[10.5px] text-dd-muted">
            参加用の合言葉（仲間に伝えてください）
          </label>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-4 py-2.5 text-center font-mono text-[18px] tracking-[0.3em]">
              {g.group.inviteCode}
            </div>
            <button
              onClick={copyCode}
              className="flex-none rounded-lg border border-white/10 px-4 text-[11.5px] transition hover:bg-white/10"
            >
              {copied ? '写しました' : '写す'}
            </button>
          </div>
        </div>

        {/* 参加者 */}
        <div className="mb-4">
          <h3 className="mb-2 text-[11.5px] font-semibold text-dd-muted">参加している人</h3>
          <div className="space-y-1.5">
            {g.group.members.map((m) => (
              <div
                key={m.uid}
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-gradient-to-br from-dd-accent to-dd-accent2 text-[11px] font-bold text-white">
                  {m.name.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[12px] font-semibold">{m.name}</span>
                    {m.owner && (
                      <span className="flex-none rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-dd-muted">
                        作成者
                      </span>
                    )}
                    {m.uid === user.uid && (
                      <span className="flex-none rounded-full bg-dd-accent/20 px-1.5 py-0.5 text-[9px] text-[#9db8ff]">
                        自分
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-dd-muted">{m.email}</div>
                </div>

                {g.isOwner && m.uid !== user.uid && (
                  <button
                    onClick={() => {
                      if (window.confirm(`${m.name} さんをグループから外しますか。`)) {
                        g.removeMember(m);
                      }
                    }}
                    title="グループから外す"
                    className="grid h-6 w-6 flex-none place-items-center rounded text-[11px] text-dd-muted transition hover:bg-dd-ng/20 hover:text-dd-ng"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {g.message && (
          <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-dd-muted">
            {g.message}
          </div>
        )}

        {/* 操作 */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            onClick={() => {
              if (
                window.confirm(
                  '自分だけの内容を、グループへ移します。\nグループ側に同じ種類の内容があれば、上書きされます。',
                )
              ) {
                g.copyToGroup();
              }
            }}
            disabled={g.busy}
            className="rounded-lg border border-white/10 px-3.5 py-2 text-[11.5px] transition hover:bg-white/10 disabled:opacity-40"
          >
            自分の内容をグループへ移す
          </button>

          {g.isOwner && (
            <button
              onClick={() => {
                if (window.confirm('新しい合言葉を作ります。\n以前のものは使えなくなります。')) {
                  g.regenerateCode();
                }
              }}
              disabled={g.busy}
              className="rounded-lg border border-white/10 px-3.5 py-2 text-[11.5px] transition hover:bg-white/10 disabled:opacity-40"
            >
              合言葉を作り直す
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('グループから抜けます。\nグループの内容は見られなくなります。')) {
                g.leaveGroup();
              }
            }}
            disabled={g.busy}
            className="rounded-lg border border-dd-ng/30 px-3.5 py-2 text-[11.5px] text-dd-ng transition hover:bg-dd-ng/15 disabled:opacity-40"
          >
            グループから抜ける
          </button>
        </div>
      </div>
    );
  }

  /* ============ まだグループに入っていない ============ */
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
      <h2 className="mb-2 text-[13px] font-bold">グループで共有</h2>
      <p className="mb-4 text-[11.5px] leading-relaxed text-dd-muted">
        グループを作ると、メンバー・ライブ予定・曲・MV・SNS・目標・
        メールの連絡先などを、仲間と共有して一緒に編集できます。
      </p>

      {mode === 'none' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode('create')}
            className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:brightness-110"
          >
            グループを作る
          </button>
          <button
            onClick={() => setMode('join')}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-[12px] transition hover:bg-white/10"
          >
            合言葉で参加する
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">グループの名前</label>
            <input
              className={inputClass}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">
              あなたの表示名（仲間に見えます）
            </label>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="トシ"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                const ok = await g.createGroup(groupName, displayName);
                if (ok) setMode('none');
              }}
              disabled={g.busy}
              className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {g.busy ? '作成中…' : '作成する'}
            </button>
            <button
              onClick={() => setMode('none')}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-[12px] transition hover:bg-white/10"
            >
              やめる
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">合言葉（6文字）</label>
            <input
              className={`${inputClass} text-center font-mono text-[18px] tracking-[0.3em]`}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
            />
          </div>
          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">
              あなたの表示名（仲間に見えます）
            </label>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="結衣"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                const ok = await g.joinGroup(code, displayName);
                if (ok) setMode('none');
              }}
              disabled={g.busy || code.length !== 6}
              className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {g.busy ? '確認中…' : '参加する'}
            </button>
            <button
              onClick={() => setMode('none')}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-[12px] transition hover:bg-white/10"
            >
              やめる
            </button>
          </div>
        </div>
      )}

      {g.message && (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[11.5px] leading-relaxed text-dd-muted">
          {g.message}
        </div>
      )}
    </div>
  );
}
