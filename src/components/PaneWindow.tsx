/**
 * ============================================================
 *  PaneWindow — アプリ内に浮かぶウィンドウ1枚
 * ------------------------------------------------------------
 *  ・タイトルバーをつかんで移動
 *  ・8方向の端をつかんでサイズ変更
 *  ・画面端に寄せるとスナップ配置
 *  ・ウィンドウの中にタブを持てます
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import WebFrame from './WebFrame';
import { MIN_H, MIN_W } from '../hooks/useWorkspace';
import { TOOLS, findTool } from '../lib/tools';
import type { Pane, SnapZone, Tab, Tool } from '../types';

interface Props {
  pane: Pane;
  isActive: boolean;
  container: { w: number; h: number };
  onFocus: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pane>) => void;
  onClose: (id: string) => void;
  onSnap: (id: string, zone: SnapZone) => void;
  onSnapHint: (zone: SnapZone | null) => void;
  onAddTab: (paneId: string, tool: Tool) => void;
  onSelectTab: (paneId: string, tabId: string) => void;
  onCloseTab: (paneId: string, tabId: string) => void;
  onUpdateTab: (paneId: string, tabId: string, patch: Partial<Tab>) => void;
}

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** 画面端から何ピクセル以内でスナップ判定するか */
const EDGE = 28;

export default function PaneWindow({
  pane,
  isActive,
  container,
  onFocus,
  onUpdate,
  onClose,
  onSnap,
  onSnapHint,
  onAddTab,
  onSelectTab,
  onCloseTab,
  onUpdateTab,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<Dir | null>(null);
  const [picker, setPicker] = useState(false);
  const [command, setCommand] = useState<{ type: 'back' | 'forward' | 'reload'; nonce: number } | null>(null);
  const start = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const beforeMax = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  /* 古い保存データにタブが無い場合の保険 */
  const tabs: Tab[] =
    pane.tabs && pane.tabs.length > 0
      ? pane.tabs
      : [{ id: pane.id + '-t0', toolId: pane.toolId, title: pane.title, url: pane.url, loading: false }];
  const activeTabId = pane.activeTabId ?? tabs[0].id;
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  /* ---------- スナップ判定 ---------- */
  const detectZone = useCallback(
    (mx: number, my: number): SnapZone | null => {
      const nearL = mx < EDGE;
      const nearR = mx > container.w - EDGE;
      const nearT = my < EDGE;
      const nearB = my > container.h - EDGE;

      if (nearT && nearL) return 'topLeft';
      if (nearT && nearR) return 'topRight';
      if (nearB && nearL) return 'bottomLeft';
      if (nearB && nearR) return 'bottomRight';
      if (nearT) return 'full';
      if (nearL) return 'left';
      if (nearR) return 'right';
      if (nearB) return 'bottom';
      return null;
    },
    [container],
  );

  const beginDrag = (e: React.MouseEvent) => {
    if (pane.maximized) return;
    e.preventDefault();
    onFocus(pane.id);
    start.current = { mx: e.clientX, my: e.clientY, x: pane.x, y: pane.y, w: pane.w, h: pane.h };
    setDragging(true);
  };

  const beginResize = (e: React.MouseEvent, dir: Dir) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(pane.id);
    start.current = { mx: e.clientX, my: e.clientY, x: pane.x, y: pane.y, w: pane.w, h: pane.h };
    setResizing(dir);
  };

  /* ---------- マウス操作 ---------- */
  useEffect(() => {
    if (!dragging && !resizing) return;

    const onMove = (e: MouseEvent) => {
      const s = start.current;
      const dx = e.clientX - s.mx;
      const dy = e.clientY - s.my;

      if (dragging) {
        const nx = Math.max(-s.w + 80, Math.min(container.w - 80, s.x + dx));
        const ny = Math.max(0, Math.min(container.h - 36, s.y + dy));
        onUpdate(pane.id, { x: nx, y: ny });

        const host = document.getElementById('ws-canvas');
        if (host) {
          const r = host.getBoundingClientRect();
          onSnapHint(detectZone(e.clientX - r.left, e.clientY - r.top));
        }
        return;
      }

      if (resizing) {
        let { x, y, w, h } = s;
        if (resizing.includes('e')) w = Math.max(MIN_W, s.w + dx);
        if (resizing.includes('s')) h = Math.max(MIN_H, s.h + dy);
        if (resizing.includes('w')) {
          w = Math.max(MIN_W, s.w - dx);
          x = s.x + (s.w - w);
        }
        if (resizing.includes('n')) {
          h = Math.max(MIN_H, s.h - dy);
          y = s.y + (s.h - h);
        }
        onUpdate(pane.id, { x, y, w, h, maximized: false });
      }
    };

    const onUp = (e: MouseEvent) => {
      if (dragging) {
        const host = document.getElementById('ws-canvas');
        if (host) {
          const r = host.getBoundingClientRect();
          const zone = detectZone(e.clientX - r.left, e.clientY - r.top);
          if (zone) onSnap(pane.id, zone);
        }
        onSnapHint(null);
      }
      setDragging(false);
      setResizing(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, resizing, container, pane.id, onUpdate, onSnap, onSnapHint, detectZone]);

  const toggleMax = () => {
    if (pane.maximized) {
      const b = beforeMax.current;
      onUpdate(pane.id, { maximized: false, ...(b ?? { x: 40, y: 40, w: 560, h: 420 }) });
    } else {
      beforeMax.current = { x: pane.x, y: pane.y, w: pane.w, h: pane.h };
      onUpdate(pane.id, { maximized: true, x: 0, y: 0, w: container.w, h: container.h });
    }
  };

  const send = (type: 'back' | 'forward' | 'reload') => setCommand({ type, nonce: Date.now() });

  if (pane.minimized) return null;

  const handles: { dir: Dir; className: string }[] = [
    { dir: 'n',  className: 'left-2 right-2 top-0 h-1.5 cursor-ns-resize' },
    { dir: 's',  className: 'left-2 right-2 bottom-0 h-1.5 cursor-ns-resize' },
    { dir: 'w',  className: 'top-2 bottom-2 left-0 w-1.5 cursor-ew-resize' },
    { dir: 'e',  className: 'top-2 bottom-2 right-0 w-1.5 cursor-ew-resize' },
    { dir: 'nw', className: 'top-0 left-0 h-3 w-3 cursor-nwse-resize' },
    { dir: 'ne', className: 'top-0 right-0 h-3 w-3 cursor-nesw-resize' },
    { dir: 'sw', className: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize' },
    { dir: 'se', className: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize' },
  ];

  /* ドラッグ中は webview を隠す（マウス操作を奪われないように） */
  const busy = dragging || !!resizing;

  return (
    <div
      onMouseDown={() => onFocus(pane.id)}
      style={{ left: pane.x, top: pane.y, width: pane.w, height: pane.h, zIndex: pane.z }}
      className={`absolute flex flex-col overflow-hidden rounded-xl border backdrop-blur-[18px]
        ${isActive
          ? 'border-dd-accent/50 bg-dd-panel/95 shadow-[0_14px_50px_rgba(0,0,0,.55)]'
          : 'border-white/10 bg-dd-panel/85 shadow-[0_6px_24px_rgba(0,0,0,.4)]'}
        ${busy ? 'select-none' : ''}`}
    >
      {/* ---------- タイトルバー ---------- */}
      <div
        onMouseDown={beginDrag}
        onDoubleClick={toggleMax}
        className={`flex h-8 flex-none items-center gap-1.5 border-b border-white/10 px-2 ${
          pane.maximized ? '' : 'cursor-move'
        }`}
      >
        {/* 戻る・進む・再読込 */}
        <div className="flex flex-none items-center" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => send('back')}
            title="戻る"
            className="grid h-5 w-5 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ←
          </button>
          <button
            onClick={() => send('forward')}
            title="進む"
            className="grid h-5 w-5 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            →
          </button>
          <button
            onClick={() => send('reload')}
            title="再読み込み"
            className="grid h-5 w-5 place-items-center rounded text-[10px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ↻
          </button>
        </div>

        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{activeTab.title}</span>

        <div className="flex flex-none items-center" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => window.dd?.shell.openExternal(activeTab.url)}
            title="既定のブラウザで開く"
            className="grid h-6 w-6 place-items-center rounded text-[10px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ↗
          </button>
          <button
            onClick={() => onUpdate(pane.id, { minimized: true })}
            title="最小化"
            className="grid h-6 w-6 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ─
          </button>
          <button
            onClick={toggleMax}
            title={pane.maximized ? '元のサイズに戻す' : '最大化'}
            className="grid h-6 w-6 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            {pane.maximized ? '❐' : '□'}
          </button>
          <button
            onClick={() => onClose(pane.id)}
            title="閉じる"
            className="grid h-6 w-6 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-dd-ng hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ---------- ウィンドウ内タブ ---------- */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-[26px] flex-none items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-black/20 px-1.5"
      >
        {tabs.map((t) => {
          const tool = findTool(t.toolId);
          const on = t.id === activeTabId;
          return (
            <div
              key={t.id}
              onClick={() => onSelectTab(pane.id, t.id)}
              className={`group flex h-[20px] max-w-[130px] flex-none cursor-pointer items-center gap-1 rounded px-1.5 text-[10px] transition
                ${on ? 'bg-white/[0.14] text-dd-text' : 'text-dd-muted hover:bg-white/[0.07]'}`}
            >
              <span
                className={`grid h-3 w-3 flex-none place-items-center rounded-sm bg-gradient-to-br text-[7px] text-white ${
                  tool?.color ?? 'from-dd-accent to-dd-accent2'
                }`}
              >
                {t.loading ? '◌' : (tool?.icon ?? '□')}
              </span>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(pane.id, t.id);
                  }}
                  className="grid h-3 w-3 flex-none place-items-center rounded text-[8px] opacity-0 transition hover:bg-white/20 group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setPicker(true)}
          title="このウィンドウにタブを追加"
          className="grid h-[18px] w-5 flex-none place-items-center rounded text-[12px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
        >
          ＋
        </button>
      </div>

      {/* ---------- 中身 ---------- */}
      <div className="relative flex-1 overflow-hidden">
        {/* ドラッグ中は覆いをかけて、マウス操作を webview に奪われないようにする */}
        {busy && <div className="absolute inset-0 z-20 bg-dd-panel/60" />}

        {tabs.map((t) => (
          <div
            key={t.id}
            className="absolute inset-0"
            style={{ visibility: t.id === activeTabId ? 'visible' : 'hidden' }}
          >
            <WebFrame
              url={t.url}
              command={t.id === activeTabId ? command : null}
              onTitle={(title) => onUpdateTab(pane.id, t.id, { title })}
              onLoading={(loading) => onUpdateTab(pane.id, t.id, { loading })}
              onUrlChange={(url) => onUpdateTab(pane.id, t.id, { url })}
            />
          </div>
        ))}
      </div>

      {/* ---------- サイズ変更のつかみ ---------- */}
      {!pane.maximized &&
        handles.map((h) => (
          <div key={h.dir} onMouseDown={(e) => beginResize(e, h.dir)} className={`absolute z-30 ${h.className}`} />
        ))}

      {/* ---------- タブ追加の選択 ---------- */}
      {picker && (
        <div
          onClick={() => setPicker(false)}
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full overflow-y-auto rounded-xl border border-white/10 bg-dd-panel p-4"
          >
            <h4 className="mb-3 text-[12px] font-bold">このウィンドウに追加</h4>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {TOOLS.filter((t) => t.url).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onAddTab(pane.id, t);
                    setPicker(false);
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-1 py-2 transition hover:bg-white/[0.12]"
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br text-[12px] text-white ${t.color}`}
                  >
                    {t.icon}
                  </span>
                  <span className="w-full truncate text-center text-[9px]">{t.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setPicker(false)}
              className="mt-3 w-full rounded-lg border border-white/10 py-1.5 text-[11px] transition hover:bg-white/10"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
