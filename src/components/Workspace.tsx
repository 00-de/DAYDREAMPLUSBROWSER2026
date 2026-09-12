/**
 * ============================================================
 *  Workspace — 複数ツールを並べて作業する画面
 * ------------------------------------------------------------
 *  8月2日の作業内容：
 *    ドラッグ移動／サイズ変更／スナップ配置／
 *    レイアウト保存／ワークスペース切替／ウィンドウ配置
 * ============================================================
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PaneWindow from './PaneWindow';
import { useWorkspace, zoneToRect } from '../hooks/useWorkspace';
import { useTools } from '../hooks/useTools';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';
import { loadLocal } from '../lib/storage';
import type { SnapZone, Tool } from '../types';

export default function Workspace() {
  const { user } = useAuth();
  const { scopePath } = useGroup(user);
  const { tools: TOOLS, findTool } = useTools(user, scopePath);

  const ws = useWorkspace();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 600 });
  const [hint, setHint] = useState<SnapZone | null>(null);
  const [picker, setPicker] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');

  /* キャンバスの大きさを追跡する */
  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ショートカット：Ctrl+W で閉じる／Ctrl+Shift+T で並べる */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        ws.tileAll(size);
      }
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'w') {
        if (ws.activeId) {
          e.preventDefault();
          ws.closePane(ws.activeId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ws, size]);

  const openTool = (tool: Tool) => {
    ws.openPane(tool, size);
    setPicker(false);
  };

  const doSaveLayout = () => {
    const name = layoutName.trim() || `レイアウト ${ws.layouts.length + 1}`;
    ws.saveLayout(name);
    setLayoutName('');
    setSaveOpen(false);
  };

  const minimized = ws.panes.filter((p) => p.minimized);
  const favorites = loadLocal<string[]>('favorites', []);
  const quickTools = favorites.map(findTool).filter((t): t is Tool => !!t).slice(0, 8);

  const hintRect = hint ? zoneToRect(hint, size.w, size.h) : null;

  return (
    <div className="flex h-full flex-col">
      {/* ============ ツールバー ============ */}
      <div className="flex flex-none flex-wrap items-center gap-2 border-b border-white/10 bg-black/20 px-4 py-2.5 backdrop-blur-[18px]">
        <button
          onClick={() => setPicker((v) => !v)}
          className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition hover:brightness-110"
        >
          ＋ ツールを開く
        </button>

        {/* お気に入りからすぐ開く */}
        {quickTools.length > 0 && (
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            {quickTools.map((t) => (
              <button
                key={t.id}
                onClick={() => openTool(t)}
                title={t.name}
                className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br text-[12px] text-white transition hover:-translate-y-0.5 ${t.color}`}
              >
                {t.icon}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        <span className="text-[10.5px] text-dd-muted">
          {ws.panes.length} 枚（{minimized.length} 枚 最小化中）
        </span>

        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
          <button
            onClick={() => ws.tileAll(size)}
            disabled={ws.panes.length === 0}
            title="Ctrl + Shift + T"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] transition hover:bg-white/10 disabled:opacity-30"
          >
            均等に並べる
          </button>
          <button
            onClick={() => setSaveOpen(true)}
            disabled={ws.panes.length === 0}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] transition hover:bg-white/10 disabled:opacity-30"
          >
            レイアウト保存
          </button>
          <button
            onClick={() => ws.closeAll()}
            disabled={ws.panes.length === 0}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-dd-ng transition hover:bg-dd-ng/15 disabled:opacity-30"
          >
            すべて閉じる
          </button>
        </div>
      </div>

      {/* ============ 保存済みレイアウト ============ */}
      {ws.layouts.length > 0 && (
        <div className="flex flex-none items-center gap-2 overflow-x-auto border-b border-white/10 bg-black/10 px-4 py-2">
          <span className="flex-none text-[10.5px] text-dd-muted">ワークスペース</span>
          {ws.layouts.map((l) => (
            <div key={l.id} className="group flex flex-none items-center">
              <button
                onClick={() => ws.applyLayout(l)}
                className="rounded-l-lg border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] transition hover:bg-white/[0.12]"
              >
                {l.name}
                <span className="ml-1.5 text-[9.5px] text-dd-muted">{l.panes.length}枚</span>
              </button>
              <button
                onClick={() => ws.deleteLayout(l.id)}
                title="このレイアウトを削除"
                className="rounded-r-lg border border-l-0 border-white/10 bg-white/[0.05] px-1.5 py-1 text-[10px] text-dd-muted transition hover:bg-dd-ng/25 hover:text-dd-text"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============ キャンバス ============ */}
      <div id="ws-canvas" ref={canvasRef} className="relative flex-1 overflow-hidden">
        {/* 方眼の背景 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* スナップ位置の予告表示 */}
        {hintRect && (
          <div
            style={{
              left: hintRect.x,
              top: hintRect.y,
              width: hintRect.w,
              height: hintRect.h,
            }}
            className="pointer-events-none absolute z-[9999] rounded-xl border-2 border-dd-accent/70 bg-dd-accent/15 transition-all duration-100"
          />
        )}

        {/* ウィンドウが無いときの案内 */}
        {ws.panes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="mb-3 text-4xl opacity-25">▦</div>
              <p className="text-[13px] font-semibold text-dd-muted">
                「＋ ツールを開く」から始めてください
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-dd-muted/70">
                タイトルバーをつかんで移動、端をつかんでサイズ変更。
                <br />
                画面の端まで寄せると自動で整列します。
              </p>
            </div>
          </div>
        )}

        {/* ウィンドウ本体 */}
        {ws.panes.map((p) => (
          <PaneWindow
            key={p.id}
            pane={p}
            isActive={ws.activeId === p.id}
            container={size}
            onFocus={ws.focusPane}
            onUpdate={ws.updatePane}
            onClose={ws.closePane}
            onSnap={(id, zone) => ws.snapPane(id, zone, size)}
            onSnapHint={setHint}
            onAddTab={ws.addTab}
            onSelectTab={ws.selectTab}
            onCloseTab={ws.closeTab}
            onUpdateTab={ws.updateTab}
          />
        ))}

        {/* ---------- 最小化したウィンドウの置き場 ---------- */}
        {minimized.length > 0 && (
          <div className="absolute bottom-[76px] left-1/2 z-[9998] flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-white/10 bg-dd-panel/90 px-2.5 py-2 backdrop-blur-[18px]">
            {minimized.map((p) => {
              const t = findTool(p.toolId);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    ws.updatePane(p.id, { minimized: false });
                    ws.focusPane(p.id);
                  }}
                  title={`${p.title} を戻す`}
                  className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-[13px] text-white transition hover:-translate-y-0.5 ${
                    t?.color ?? 'from-dd-accent to-dd-accent2'
                  }`}
                >
                  {t?.icon ?? '□'}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ============ ツール選択 ============ */}
      {picker && (
        <div
          onClick={() => setPicker(false)}
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] w-[min(680px,92vw)] overflow-y-auto rounded-2xl border border-white/10 bg-dd-panel p-6"
          >
            <h3 className="mb-4 text-[15px] font-bold">開くツールを選んでください</h3>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTool(t)}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-3 transition hover:-translate-y-0.5 hover:bg-white/[0.11]"
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-[16px] text-white shadow-lg ${t.color}`}
                  >
                    {t.icon}
                  </span>
                  <span className="w-full truncate text-center text-[10.5px]">{t.name}</span>
                </button>
              ))}
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

      {/* ============ レイアウト保存 ============ */}
      {saveOpen && (
        <div
          onClick={() => setSaveOpen(false)}
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[min(420px,92vw)] rounded-2xl border border-white/10 bg-dd-panel p-6"
          >
            <h3 className="mb-2 text-[15px] font-bold">レイアウトを保存</h3>
            <p className="mb-4 text-[11.5px] leading-relaxed text-dd-muted">
              いま開いている {ws.panes.length} 枚の配置を保存します。
              あとからワンクリックで元通りに並べ直せます。
            </p>

            <input
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSaveLayout()}
              placeholder="例：作曲用、MV制作用、配信準備"
              autoFocus
              className="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[13px] outline-none transition focus:border-dd-accent"
            />

            <div className="flex gap-2">
              <button
                onClick={doSaveLayout}
                className="flex-1 rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110"
              >
                保存する
              </button>
              <button
                onClick={() => setSaveOpen(false)}
                className="rounded-lg border border-white/10 px-5 py-2.5 text-[12.5px] transition hover:bg-white/10"
              >
                やめる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
