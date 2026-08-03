/**
 * ============================================================
 *  Dock — 画面下のツールバー
 * ------------------------------------------------------------
 *  8月3日の作業内容：
 *    Dock作成／アイコン拡大／ドラッグ並び替え／
 *    お気に入り登録／クイック起動
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { TOOLS, findTool } from '../lib/tools';
import { loadLocal, saveLocal } from '../lib/storage';
import type { Tool } from '../types';

interface Props {
  /** アプリ内タブで開く */
  onOpen: (tool: Tool) => void;
}

/** マウスとの距離に応じた拡大の効き具合 */
const MAX_SCALE = 1.7;
const RANGE = 110;

export default function Dock({ onOpen }: Props) {
  const [items, setItems] = useState<string[]>(() =>
    loadLocal<string[]>('dock', loadLocal<string[]>('favorites', [])),
  );
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [picker, setPicker] = useState(false);
  const [hidden, setHidden] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* 変更のたびに保存 */
  useEffect(() => {
    saveLocal('dock', items);
  }, [items]);

  /* Ctrl + D で Dock の表示・非表示 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setHidden((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** マウスとの距離から拡大率を求める */
  const scaleOf = useCallback(
    (index: number): number => {
      if (mouseX === null || dragIndex !== null) return 1;
      const el = iconRefs.current[index];
      if (!el) return 1;

      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      const dist = Math.abs(mouseX - center);
      if (dist > RANGE) return 1;

      // 距離が近いほど大きくなる、なめらかな曲線
      const t = 1 - dist / RANGE;
      return 1 + (MAX_SCALE - 1) * t * t;
    },
    [mouseX, dragIndex],
  );

  /* ---------- 並び替え ---------- */
  const handleDrop = () => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(overIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
    setOverIndex(null);
  };

  const addItem = (tool: Tool) => {
    setItems((prev) => (prev.includes(tool.id) ? prev : [...prev, tool.id]));
    setPicker(false);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x !== id));

  const tools = items.map(findTool).filter((t): t is Tool => !!t);

  /* ---------- 隠しているときは細いバーだけ ---------- */
  if (hidden) {
    return (
      <div
        onMouseEnter={() => setHidden(false)}
        title="Dock を表示（Ctrl + D）"
        className="fixed bottom-0 left-1/2 z-[9000] h-1.5 w-40 -translate-x-1/2 cursor-pointer rounded-t-full bg-white/15 transition hover:bg-white/30"
      />
    );
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-[9000] flex justify-center pb-2.5">
        <div
          ref={barRef}
          onMouseMove={(e) => setMouseX(e.clientX)}
          onMouseLeave={() => setMouseX(null)}
          className="pointer-events-auto flex items-end gap-1.5 rounded-2xl border border-white/10 bg-black/45 px-2.5 pb-2 pt-2 shadow-[0_8px_40px_rgba(0,0,0,.5)] backdrop-blur-[20px]"
        >
          {tools.length === 0 && (
            <span className="px-3 py-3 text-[11px] text-dd-muted">
              ＋ からツールを追加してください
            </span>
          )}

          {tools.map((t, i) => {
            const scale = scaleOf(i);
            const dragging = dragIndex === i;

            return (
              <div
                key={t.id}
                ref={(el) => (iconRefs.current[i] = el)}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(i);
                }}
                onDragEnd={handleDrop}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center transition-opacity ${
                  dragging ? 'opacity-30' : ''
                }`}
                style={{
                  width: 46,
                  transition: 'width .12s ease',
                }}
              >
                {/* 挿入位置の目印 */}
                {overIndex === i && dragIndex !== null && dragIndex !== i && (
                  <span className="absolute -left-1 bottom-1 top-1 w-0.5 rounded bg-dd-accent" />
                )}

                {/* 名前の吹き出し */}
                {scale > 1.15 && !dragging && (
                  <span className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-lg border border-white/10 bg-dd-panel/95 px-2.5 py-1 text-[10.5px] shadow-lg">
                    {t.name}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    if (e.shiftKey) {
                      window.dd?.shell.openExternal(t.url);
                    } else if (t.url) {
                      onOpen(t);
                    }
                  }}
                  disabled={!t.url}
                  title={t.url ? `${t.name}（Shift + クリックでブラウザ）` : `${t.name}（準備中）`}
                  className={`grid place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg ${t.color} ${
                    !t.url ? 'opacity-40' : ''
                  }`}
                  style={{
                    width: 40 * scale,
                    height: 40 * scale,
                    fontSize: 17 * scale,
                    transform: `translateY(${-(scale - 1) * 12}px)`,
                    transition: 'width .12s ease, height .12s ease, transform .12s ease, font-size .12s ease',
                  }}
                >
                  {t.icon}
                </button>

                {/* 取り外しボタン */}
                <button
                  onClick={() => removeItem(t.id)}
                  title="Dock から外す"
                  className="absolute -top-1 right-0 grid h-4 w-4 place-items-center rounded-full border border-white/20 bg-dd-panel text-[9px] text-dd-muted opacity-0 transition hover:bg-dd-ng hover:text-white group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* 区切りと追加ボタン */}
          <span className="mx-0.5 h-9 w-px self-center bg-white/15" />

          <button
            onClick={() => setPicker(true)}
            title="Dock にツールを追加"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-[17px] text-dd-muted transition hover:bg-white/[0.15] hover:text-dd-text"
          >
            ＋
          </button>

          <button
            onClick={() => setHidden(true)}
            title="Dock を隠す（Ctrl + D）"
            className="grid h-10 w-6 place-items-center rounded-lg text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ▾
          </button>
        </div>
      </div>

      {/* ---------- ツール選択 ---------- */}
      {picker && (
        <div
          onClick={() => setPicker(false)}
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] w-[min(640px,92vw)] overflow-y-auto rounded-2xl border border-white/10 bg-dd-panel p-6"
          >
            <h3 className="mb-1 text-[15px] font-bold">Dock に追加</h3>
            <p className="mb-4 text-[11px] text-dd-muted">
              追加したあと、アイコンをドラッグして並び替えできます。
            </p>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {TOOLS.map((t) => {
                const already = items.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => addItem(t)}
                    disabled={already}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-white/10 px-2 py-3 transition ${
                      already
                        ? 'cursor-not-allowed bg-white/[0.02] opacity-35'
                        : 'bg-white/[0.05] hover:-translate-y-0.5 hover:bg-white/[0.11]'
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-[16px] text-white shadow-lg ${t.color}`}
                    >
                      {t.icon}
                    </span>
                    <span className="w-full truncate text-center text-[10.5px]">{t.name}</span>
                    {already && <span className="text-[9px] text-dd-muted">追加済み</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPicker(false)}
              className="mt-5 w-full rounded-lg border border-white/10 py-2 text-[12px] transition hover:bg-white/10"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
