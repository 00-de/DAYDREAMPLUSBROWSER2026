/**
 * ============================================================
 *  Home — ホーム画面
 * ------------------------------------------------------------
 *  8月1日の作業内容：
 *    ロゴ／検索バー／時計／通知エリア／最近使用したツール／お気に入り
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import Clock from './Clock';
import SearchBar from './SearchBar';
import ToolTile from './ToolTile';
import NoticePanel from './NoticePanel';
import LocalAppSection from './LocalAppSection';
import { CATEGORIES, DEFAULT_FAVORITES } from '../lib/tools';
import { useTools } from '../hooks/useTools';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import ToolEditor from './ToolEditor';
import { loadLocal, pushRecent, saveLocal } from '../lib/storage';
import type { Tool } from '../types';

interface Props {
  /** アプリ内のブラウザ画面でタブを開く */
  onOpenInApp: (tool: Tool) => void;
}

export default function Home({ onOpenInApp }: Props) {
  const { user } = useAuth();
  const { scopePath } = useGroup(user);
  const tl = useTools(user, scopePath);

  /** 編集中のツール。'new' なら新規追加。 */
  const [editing, setEditing] = useState<Tool | 'new' | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [message, setMessage] = useState('');

  /* 保存済みの設定を読み込む */
  useEffect(() => {
    setFavorites(loadLocal('favorites', DEFAULT_FAVORITES));
    setRecents(loadLocal<string[]>('recents', []));
  }, []);

  /**
   * ツールを開きます。
   * 通常クリック    → アプリ内のタブで開く
   * Shift + クリック → 既定のブラウザで開く
   */
  const openTool = useCallback(
    (tool: Tool, external?: boolean) => {
      if (!tool.url) return;

      if (external) {
        window.dd?.shell.openExternal(tool.url);
        setMessage(`${tool.name} をブラウザで開きました`);
      } else {
        onOpenInApp(tool);
        setMessage(`${tool.name} をタブで開きました`);
      }

      setRecents((prev) => pushRecent(prev, tool.id));
      setTimeout(() => setMessage(''), 2200);
    },
    [onOpenInApp],
  );

  /* お気に入りの切り替え */
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveLocal('favorites', next);
      return next;
    });
  }, []);

  /* Ctrl + 1〜9 でお気に入りを起動 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.shiftKey || e.altKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const tool = tl.findTool(favorites[n - 1] ?? '');
      if (tool) {
        e.preventDefault();
        openTool(tool);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [favorites, openTool, tl]);

  const favoriteTools = favorites.map(tl.findTool).filter((t): t is Tool => !!t);
  const recentTools = recents.map(tl.findTool).filter((t): t is Tool => !!t);
  const listed = category === 'all' ? tl.tools : tl.tools.filter((t) => t.category === category);

  return (
    <div className="mx-auto w-full max-w-6xl animate-rise px-8 pb-28 pt-10">
      {/* ---------- ロゴ ---------- */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-dd-accent to-dd-accent2 text-3xl shadow-[0_10px_40px_rgba(91,140,255,.45)]">
          ✦
        </div>
        <h1 className="text-[21px] font-extrabold tracking-[0.08em]">DayDream Browser Ultimate</h1>
        <p className="mt-1 text-[11px] tracking-wider text-dd-muted">
          CREATIVE WORKSPACE FOR DAYDREAM&#10133;
        </p>
      </div>

      {/* ---------- 時計 ---------- */}
      <div className="mb-8">
        <Clock />
      </div>

      {/* ---------- 検索バー ---------- */}
      <div className="mb-10">
        <SearchBar />
      </div>

      {/* ---------- 2カラム ---------- */}
      <div className="grid gap-7 lg:grid-cols-[1fr_300px]">
        {/* 左：ツール類 */}
        <div className="space-y-8">
          {/* お気に入り */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold text-dd-muted">
              <span>お気に入り</span>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px]">Ctrl + 1〜9 で起動</span>
            </h2>

            {favoriteTools.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-[11.5px] text-dd-muted">
                下の一覧で ☆ を押すと、ここに追加されます
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {favoriteTools.map((t, i) => (
                  <div key={t.id} className="relative">
                    {i < 9 && (
                      <span className="pointer-events-none absolute left-1.5 top-1.5 z-10 rounded bg-black/40 px-1 text-[9px] text-dd-muted">
                        {i + 1}
                      </span>
                    )}
                    <ToolTile
                      tool={t}
                      isFavorite
                      onOpen={openTool}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 最近使用したツール */}
          {recentTools.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold text-dd-muted">
                <span>最近使用したツール</span>
                <span className="h-px flex-1 bg-white/10" />
                <button
                  onClick={() => {
                    setRecents([]);
                    saveLocal('recents', []);
                  }}
                  className="text-[10px] transition hover:text-dd-text"
                >
                  履歴を消去
                </button>
              </h2>

              <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-8">
                {recentTools.map((t) => (
                  <ToolTile
                    key={t.id}
                    tool={t}
                    compact
                    isFavorite={favorites.includes(t.id)}
                    onOpen={openTool}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </section>
          )}

          {/* パソコンのアプリ */}
          <LocalAppSection />

          {/* すべてのツール */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold text-dd-muted">
              <span>すべてのツール</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9.5px]">
                {tl.tools.length}
              </span>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[10px]">Shift + クリックでブラウザ</span>
              <button
                onClick={() => setEditing('new')}
                className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
              >
                ＋ 追加
              </button>
            </h2>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {[{ id: 'all', label: 'すべて' }, ...CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-3.5 py-1 text-[11px] transition ${
                    category === c.id
                      ? 'bg-white/[0.14] text-dd-text'
                      : 'text-dd-muted hover:bg-white/[0.07] hover:text-dd-text'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {listed.map((t) => (
                <div key={t.id} className="group/edit relative">
                  <ToolTile
                    tool={t}
                    isFavorite={favorites.includes(t.id)}
                    onOpen={openTool}
                    onToggleFavorite={toggleFavorite}
                  />

                  {/* 編集 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(t);
                    }}
                    title="編集する"
                    className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-lg text-[10px] text-dd-muted opacity-0 transition hover:bg-white/15 group-hover/edit:opacity-100"
                  >
                    ✎
                  </button>

                  {/* 一覧から外す */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`${t.name} を一覧から外しますか。`)) {
                        tl.removeTool(t.id);
                      }
                    }}
                    title="一覧から外す"
                    className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-lg text-[10px] text-dd-muted opacity-0 transition hover:bg-dd-ng/25 hover:text-dd-text group-hover/edit:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* 外したツールを戻す */}
            {tl.hiddenTools.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowHidden((v) => !v)}
                  className="text-[11px] text-dd-muted transition hover:text-dd-text"
                >
                  {showHidden ? '▾' : '▸'} 一覧から外したツール（{tl.hiddenTools.length}）
                </button>

                {showHidden && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {tl.hiddenTools.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => tl.restoreTool(t.id)}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] transition hover:bg-white/[0.1]"
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded bg-gradient-to-br text-[10px] text-white ${t.color}`}
                        >
                          {t.icon}
                        </span>
                        {t.name}
                        <span className="text-[10px] text-dd-muted">戻す</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* 右：通知エリア */}
        <aside>
          <NoticePanel />
        </aside>
      </div>

      {/* ---------- ツールの追加・編集 ---------- */}
      {editing && (
        <ToolEditor
          target={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(value) => {
            if (editing === 'new') tl.addTool(value);
            else tl.updateTool(editing.id, value);
          }}
        />
      )}

      {/* ---------- 起動メッセージ ---------- */}
      {(message || tl.message) && (
        <div className="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 animate-fade-in rounded-xl border border-white/10 bg-dd-panel/95 px-5 py-3 text-[12.5px] shadow-2xl backdrop-blur-[18px]">
          {message || tl.message}
        </div>
      )}
    </div>
  );
}
