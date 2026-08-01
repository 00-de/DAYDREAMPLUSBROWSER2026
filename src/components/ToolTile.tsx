/**
 * ============================================================
 *  ToolTile — ツール1つ分のタイル
 * ============================================================
 */

import type { Tool } from '../types';

interface Props {
  tool: Tool;
  isFavorite: boolean;
  onOpen: (tool: Tool, external?: boolean) => void;
  onToggleFavorite: (id: string) => void;
  /** 小さめ表示にするか */
  compact?: boolean;
}

export default function ToolTile({ tool, isFavorite, onOpen, onToggleFavorite, compact }: Props) {
  const ready = tool.url.length > 0;

  return (
    <div className="group relative">
      <button
        onClick={(e) => onOpen(tool, e.shiftKey)}
        disabled={!ready}
        title={ready ? `${tool.url}\n（Shift + クリックでブラウザ）` : '準備中です'}
        className={`flex w-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] transition
          ${compact ? 'px-2 py-3' : 'px-3 py-4'}
          ${ready ? 'hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.1]' : 'cursor-not-allowed opacity-40'}`}
      >
        <span
          className={`grid place-items-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-lg
            ${compact ? 'h-9 w-9 text-[15px]' : 'h-12 w-12 text-[19px]'}`}
        >
          {tool.icon}
        </span>

        <span
          className={`w-full truncate text-center ${compact ? 'text-[10.5px]' : 'text-[11.5px]'} text-dd-text/90`}
        >
          {tool.name}
        </span>

        {!ready && <span className="text-[9px] text-dd-muted">準備中</span>}
      </button>

      {/* お気に入りの星（マウスを乗せると出る） */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(tool.id);
        }}
        title={isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
        className={`absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-lg text-[12px] transition
          ${isFavorite ? 'text-dd-warn opacity-100' : 'text-dd-muted opacity-0 group-hover:opacity-100'}
          hover:bg-white/10`}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  );
}
