/**
 * ============================================================
 *  SearchBar — 検索バー
 * ------------------------------------------------------------
 *  検索先を選んで Enter を押すと、既定のブラウザで開きます。
 *  URL をそのまま入力した場合は、直接そのページを開きます。
 * ============================================================
 */

import { useEffect, useRef, useState } from 'react';

interface Engine {
  id: string;
  label: string;
  build: (q: string) => string;
}

const ENGINES: Engine[] = [
  { id: 'google',  label: 'Google',  build: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: 'claude',  label: 'Claude',  build: (q) => `https://claude.ai/new?q=${encodeURIComponent(q)}` },
  { id: 'chatgpt', label: 'ChatGPT', build: (q) => `https://chatgpt.com/?q=${encodeURIComponent(q)}` },
  { id: 'github',  label: 'GitHub',  build: (q) => `https://github.com/search?q=${encodeURIComponent(q)}` },
  { id: 'youtube', label: 'YouTube', build: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
];

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState(ENGINES[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Ctrl + Space で検索バーへ移動 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const run = () => {
    const q = query.trim();
    if (!q) return;

    // 「http〜」または「〜.com」のような入力は、そのままURLとして開く
    const looksLikeUrl = /^https?:\/\//i.test(q) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q);
    const url = looksLikeUrl ? (/^https?:\/\//i.test(q) ? q : `https://${q}`) : engine.build(q);

    window.dd?.shell.openExternal(url);
    setQuery('');
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-[18px] transition focus-within:border-dd-accent/60 focus-within:bg-white/[0.09]">
        <span className="pl-1 text-dd-muted">⌕</span>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder={`${engine.label} で検索（Ctrl + Space）`}
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-dd-text outline-none placeholder:text-dd-muted"
        />

        <button
          onClick={run}
          disabled={!query.trim()}
          className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-3.5 py-1.5 text-[12px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
        >
          検索
        </button>
      </div>

      {/* 検索先の切り替え */}
      <div className="mt-2.5 flex justify-center gap-1.5">
        {ENGINES.map((e) => (
          <button
            key={e.id}
            onClick={() => setEngine(e)}
            className={`rounded-full px-3 py-1 text-[11px] transition ${
              engine.id === e.id
                ? 'bg-white/[0.14] text-dd-text'
                : 'text-dd-muted hover:bg-white/[0.07] hover:text-dd-text'
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
