/**
 * ============================================================
 *  PaneWindow — アプリ内に浮かぶウィンドウ1枚
 * ------------------------------------------------------------
 *  ・タイトルバーをつかんで移動
 *  ・8方向の端をつかんでサイズ変更
 *  ・画面端に寄せるとスナップ配置
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { MIN_H, MIN_W } from '../hooks/useWorkspace';
import { findTool } from '../lib/tools';
import type { Pane, SnapZone } from '../types';

interface Props {
  pane: Pane;
  isActive: boolean;
  container: { w: number; h: number };
  onFocus: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pane>) => void;
  onClose: (id: string) => void;
  onSnap: (id: string, zone: SnapZone) => void;
  /** ドラッグ中にスナップ候補を親へ知らせる */
  onSnapHint: (zone: SnapZone | null) => void;
}

/** 端をつかむ向き */
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
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<Dir | null>(null);
  const start = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const beforeMax = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const tool = findTool(pane.toolId);

  /* ---------- マウス位置からスナップ位置を判定 ---------- */
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

  /* ---------- 移動 ---------- */
  const beginDrag = (e: React.MouseEvent) => {
    if (pane.maximized) return;
    e.preventDefault();
    onFocus(pane.id);
    start.current = { mx: e.clientX, my: e.clientY, x: pane.x, y: pane.y, w: pane.w, h: pane.h };
    setDragging(true);
  };

  /* ---------- サイズ変更 ---------- */
  const beginResize = (e: React.MouseEvent, dir: Dir) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(pane.id);
    start.current = { mx: e.clientX, my: e.clientY, x: pane.x, y: pane.y, w: pane.w, h: pane.h };
    setResizing(dir);
  };

  /* ---------- マウス操作の共通処理 ---------- */
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

        // 親要素の左上を基準にした座標でスナップ判定
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

  /* ---------- 最大化の切り替え ---------- */
  const toggleMax = () => {
    if (pane.maximized) {
      const b = beforeMax.current;
      onUpdate(pane.id, {
        maximized: false,
        ...(b ?? { x: 40, y: 40, w: 520, h: 380 }),
      });
    } else {
      beforeMax.current = { x: pane.x, y: pane.y, w: pane.w, h: pane.h };
      onUpdate(pane.id, { maximized: true, x: 0, y: 0, w: container.w, h: container.h });
    }
  };

  if (pane.minimized) return null;

  /* 端をつかむ領域の定義 */
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

  return (
    <div
      onMouseDown={() => onFocus(pane.id)}
      style={{ left: pane.x, top: pane.y, width: pane.w, height: pane.h, zIndex: pane.z }}
      className={`absolute flex flex-col overflow-hidden rounded-xl border backdrop-blur-[18px] transition-shadow
        ${isActive
          ? 'border-dd-accent/50 bg-dd-panel/95 shadow-[0_14px_50px_rgba(0,0,0,.55)]'
          : 'border-white/10 bg-dd-panel/80 shadow-[0_6px_24px_rgba(0,0,0,.4)]'}
        ${dragging || resizing ? 'select-none' : ''}`}
    >
      {/* ---------- タイトルバー ---------- */}
      <div
        onMouseDown={beginDrag}
        onDoubleClick={toggleMax}
        className={`flex h-9 flex-none items-center gap-2 border-b border-white/10 px-2.5 ${
          pane.maximized ? '' : 'cursor-move'
        }`}
      >
        <span
          className={`grid h-5 w-5 flex-none place-items-center rounded-md bg-gradient-to-br text-[10px] text-white ${
            tool?.color ?? 'from-dd-accent to-dd-accent2'
          }`}
        >
          {tool?.icon ?? '□'}
        </span>

        <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold">{pane.title}</span>

        <div className="flex flex-none items-center">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onUpdate(pane.id, { minimized: true })}
            title="最小化"
            className="grid h-6 w-7 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ─
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={toggleMax}
            title={pane.maximized ? '元のサイズに戻す' : '最大化'}
            className="grid h-6 w-7 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            {pane.maximized ? '❐' : '□'}
          </button>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => onClose(pane.id)}
            title="閉じる"
            className="grid h-6 w-7 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-dd-ng hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ---------- 中身 ---------- */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto p-5 text-center">
        <span
          className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-lg ${
            tool?.color ?? 'from-dd-accent to-dd-accent2'
          }`}
        >
          {tool?.icon ?? '□'}
        </span>

        <div>
          <div className="text-[14px] font-bold">{pane.title}</div>
          <div className="mt-1 break-all px-2 text-[10.5px] text-dd-muted">
            {pane.url || '準備中のツールです'}
          </div>
        </div>

        {pane.url && (
          <button
            onClick={() => window.dd?.shell.openExternal(pane.url)}
            className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2 text-[11.5px] font-semibold text-white transition hover:brightness-110"
          >
            ブラウザで開く
          </button>
        )}

        <p className="max-w-[280px] text-[10px] leading-relaxed text-dd-muted">
          外部サイトはセキュリティ上、既定のブラウザで開きます。
          DayDream 専用ツールは今後この枠内に直接表示できるようにします。
        </p>
      </div>

      {/* ---------- サイズ変更のつかみ ---------- */}
      {!pane.maximized &&
        handles.map((h) => (
          <div
            key={h.dir}
            onMouseDown={(e) => beginResize(e, h.dir)}
            className={`absolute z-10 ${h.className}`}
          />
        ))}
    </div>
  );
}
