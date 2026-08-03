/**
 * ============================================================
 *  TitleBar — 自作のウィンドウ枠
 * ------------------------------------------------------------
 *  frame:false にしているため、最小化・最大化・閉じるを
 *  自分で用意する必要があります。
 *  画面の切り替えタブもここに置いています。
 * ============================================================
 */

import { useEffect, useState } from 'react';
import type { ViewName } from '../types';

interface Props {
  view: ViewName;
  onChangeView: (v: ViewName) => void;
}

const TABS: { id: ViewName; label: string }[] = [
  { id: 'home', label: 'ホーム' },
  { id: 'browser', label: 'ブラウザ' },
  { id: 'workspace', label: 'Workspace' },
  { id: 'account', label: 'アカウント' },
  { id: 'check', label: '起動チェック' },
];

export default function TitleBar({ view, onChangeView }: Props) {
  const [maximized, setMaximized] = useState(false);
  const bridge = window.dd;

  useEffect(() => {
    bridge?.window.isMaximized().then(setMaximized);
  }, [bridge]);

  const handleMaximize = async () => {
    const now = await bridge?.window.maximize();
    setMaximized(!!now);
  };

  return (
    <header className="drag-region flex h-10 flex-none items-center gap-3 border-b border-white/10 bg-black/30 px-3 backdrop-blur-[18px]">
      {/* ロゴ */}
      <div className="flex items-center gap-2">
        <div className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-dd-accent to-dd-accent2 text-[13px]">
          ✦
        </div>
        <span className="text-[12.5px] font-bold tracking-wide">DayDream Browser Ultimate</span>
        <span className="rounded-full border border-white/10 px-2 py-[1px] text-[9.5px] text-dd-muted">
          Ver.1.0 開発版
        </span>
      </div>

      {/* 画面切り替えタブ */}
      <nav className="no-drag ml-3 flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChangeView(t.id)}
            className={`rounded-lg px-3 py-1 text-[11.5px] transition ${
              view === t.id
                ? 'bg-white/[0.12] text-dd-text'
                : 'text-dd-muted hover:bg-white/[0.07] hover:text-dd-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* ウィンドウ操作ボタン */}
      {bridge && (
        <div className="no-drag flex items-center">
          <button
            onClick={() => bridge.window.minimize()}
            className="grid h-8 w-11 place-items-center rounded text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
            title="最小化"
          >
            ─
          </button>
          <button
            onClick={handleMaximize}
            className="grid h-8 w-11 place-items-center rounded text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
            title={maximized ? '元のサイズに戻す' : '最大化'}
          >
            {maximized ? '❐' : '□'}
          </button>
          <button
            onClick={() => bridge.window.close()}
            className="grid h-8 w-11 place-items-center rounded text-dd-muted transition hover:bg-dd-ng hover:text-white"
            title="閉じる"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
}
