/**
 * ============================================================
 *  LocalAppSection — パソコンのアプリ
 * ------------------------------------------------------------
 *  CapCut や DaVinci Resolve など、この PC に入っているアプリを
 *  ホーム画面から起動できるようにします。
 * ============================================================
 */

import { useState } from 'react';
import { useLocalApps } from '../hooks/useLocalApps';
import { Section } from './DashboardParts';
import { inputClass } from '../lib/status';

export default function LocalAppSection() {
  const la = useLocalApps();
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /* ブラウザで開いている場合は使えません */
  if (!la.available) return null;

  const startRename = (id: string, current: string) => {
    setEditing(id);
    setDraftName(current);
  };

  const commitRename = () => {
    if (editing && draftName.trim()) la.rename(editing, draftName.trim());
    setEditing(null);
  };

  return (
    <Section
      title="パソコンのアプリ"
      count={la.apps.length > 0 ? la.apps.length : undefined}
      action={
        <div className="flex gap-1.5">
          <button
            onClick={la.autoFind}
            disabled={la.searching}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] transition hover:bg-white/10 disabled:opacity-40"
          >
            {la.searching ? '探しています…' : '自動で探す'}
          </button>
          <button
            onClick={la.addByPicker}
            className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
          >
            ＋ 自分で選ぶ
          </button>
        </div>
      }
    >
      {la.message && (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[11.5px] leading-relaxed text-dd-muted">
          {la.message}
        </div>
      )}

      {la.apps.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-7 text-center text-[11.5px] leading-relaxed text-dd-muted">
          「自動で探す」を押すと、CapCut や DaVinci Resolve などを
          <br />
          自動で見つけて登録します。
          <br />
          見つからないものは「自分で選ぶ」からご登録ください。
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {la.apps.map((a, i) => (
            <div
              key={a.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) la.reorder(dragIndex, i);
                setDragIndex(null);
              }}
              className={`group relative ${dragIndex === i ? 'opacity-40' : ''}`}
            >
              <button
                onClick={() => la.launch(a)}
                title={a.path}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-4 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.1]"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br text-[17px] font-bold text-white shadow-lg ${a.color}`}
                >
                  {a.icon}
                </span>
                <span className="w-full truncate text-center text-[11.5px] text-dd-text/90">
                  {a.name}
                </span>
              </button>

              {/* 名前を変える */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startRename(a.id, a.name);
                }}
                title="名前を変える"
                className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-lg text-[10px] text-dd-muted opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
              >
                ✎
              </button>

              {/* 登録を消す */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`${a.name} の登録を消しますか。\nアプリ自体は消えません。`)) {
                    la.remove(a.id);
                  }
                }}
                title="登録を消す"
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-lg text-[11px] text-dd-muted opacity-0 transition hover:bg-dd-ng/25 hover:text-dd-text group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 名前の変更 */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[min(400px,94vw)] rounded-2xl border border-white/10 bg-dd-panel p-6"
          >
            <h3 className="mb-4 text-[15px] font-bold">名前を変える</h3>

            <input
              className={inputClass}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitRename()}
              autoFocus
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={commitRename}
                className="flex-1 rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110"
              >
                変える
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-[12.5px] transition hover:bg-white/10"
              >
                やめる
              </button>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}
