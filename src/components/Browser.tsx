/**
 * ============================================================
 *  Browser — タブ付きのアプリ内ブラウザ
 * ------------------------------------------------------------
 *  ツールをタブで開き、アプリの中で表示します。
 *  埋め込みを拒否するサイトは、自動で案内表示に切り替わります。
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import WebFrame from './WebFrame';
import { TOOLS, findTool } from '../lib/tools';
import { loadLocal, saveLocal } from '../lib/storage';
import type { Tab, Tool } from '../types';

const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>(() => loadLocal<Tab[]>('tabs', []));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [addressBar, setAddressBar] = useState('');
  const [command, setCommand] = useState<{
    type: 'back' | 'forward' | 'reload';
    nonce: number;
  } | null>(null);
  const closedStack = useRef<Tab[]>([]);

  /* 起動時に、保存済みタブの先頭を選ぶ */
  useEffect(() => {
    if (tabs.length > 0 && !activeId) setActiveId(tabs[0].id);
    // 初回のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* タブの状態を保存 */
  useEffect(() => {
    saveLocal('tabs', tabs);
  }, [tabs]);

  const active = tabs.find((t) => t.id === activeId) ?? null;

  /* アドレスバーの表示を、選択中タブに追従させる */
  useEffect(() => {
    setAddressBar(active?.url ?? '');
  }, [active?.id, active?.url]);

  /* ---------- タブ操作 ---------- */

  const openTab = useCallback((tool: Tool) => {
    if (!tool.url) return;

    setTabs((prev) => {
      const exists = prev.find((t) => t.toolId === tool.id);
      if (exists) {
        setActiveId(exists.id);
        return prev;
      }
      const tab: Tab = {
        id: uid(),
        toolId: tool.id,
        title: tool.name,
        url: tool.url,
        loading: true,
      };
      setActiveId(tab.id);
      return [...prev, tab];
    });
    setPicker(false);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        const target = prev.find((t) => t.id === id);
        if (target) closedStack.current.push(target);

        const next = prev.filter((t) => t.id !== id);

        if (activeId === id) {
          const i = prev.findIndex((t) => t.id === id);
          setActiveId(next[Math.min(i, next.length - 1)]?.id ?? null);
        }
        return next;
      });
    },
    [activeId],
  );

  /** 直前に閉じたタブを戻す */
  const reopenTab = useCallback(() => {
    const t = closedStack.current.pop();
    if (!t) return;
    setTabs((prev) => [...prev, t]);
    setActiveId(t.id);
  }, []);

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  /** アドレスバーから移動 */
  const goAddress = () => {
    const q = addressBar.trim();
    if (!q || !active) return;

    const looksLikeUrl = /^https?:\/\//i.test(q) || /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q);
    const url = looksLikeUrl
      ? /^https?:\/\//i.test(q)
        ? q
        : `https://${q}`
      : `https://www.google.com/search?q=${encodeURIComponent(q)}`;

    updateTab(active.id, { url });
  };

  const send = (type: 'back' | 'forward' | 'reload') =>
    setCommand({ type, nonce: Date.now() });

  /* ---------- ショートカット ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      // Ctrl + Shift + T … 閉じたタブを戻す
      if (e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        reopenTab();
        return;
      }
      // Ctrl + W … タブを閉じる
      if (!e.shiftKey && e.key.toLowerCase() === 'w' && activeId) {
        e.preventDefault();
        closeTab(activeId);
        return;
      }
      // Ctrl + R … 再読み込み
      if (!e.shiftKey && e.key.toLowerCase() === 'r' && activeId) {
        e.preventDefault();
        send('reload');
        return;
      }
      // Alt は使わず、Ctrl + [ ] で 戻る・進む
      if (e.key === '[') {
        e.preventDefault();
        send('back');
      }
      if (e.key === ']') {
        e.preventDefault();
        send('forward');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, closeTab, reopenTab]);

  return (
    <div className="flex h-full flex-col">
      {/* ============ タブ列 ============ */}
      <div className="flex flex-none items-end gap-0.5 overflow-x-auto border-b border-white/10 bg-black/25 px-2 pt-1.5 backdrop-blur-[18px]">
        {tabs.map((t) => {
          const tool = findTool(t.toolId);
          const on = t.id === activeId;
          return (
            <div
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`group flex h-[34px] max-w-[190px] flex-none cursor-pointer items-center gap-1.5 rounded-t-lg px-2.5 text-[11.5px] transition
                ${on
                  ? 'bg-dd-panel/95 text-dd-text'
                  : 'bg-white/[0.04] text-dd-muted hover:bg-white/[0.09]'}`}
            >
              <span
                className={`grid h-4 w-4 flex-none place-items-center rounded bg-gradient-to-br text-[9px] text-white ${
                  tool?.color ?? 'from-dd-accent to-dd-accent2'
                }`}
              >
                {t.loading ? '◌' : (tool?.icon ?? '□')}
              </span>

              <span className="min-w-0 flex-1 truncate">{t.title}</span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t.id);
                }}
                title="タブを閉じる"
                className="grid h-4 w-4 flex-none place-items-center rounded text-[10px] opacity-0 transition hover:bg-white/15 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setPicker(true)}
          title="新しいタブ"
          className="mb-0.5 ml-1 grid h-[30px] w-8 flex-none place-items-center rounded-lg text-[15px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
        >
          ＋
        </button>
      </div>

      {/* ============ アドレスバー ============ */}
      {active && (
        <div className="flex flex-none items-center gap-1.5 border-b border-white/10 bg-black/15 px-3 py-2">
          <button
            onClick={() => send('back')}
            title="戻る（Ctrl + [ ）"
            className="grid h-7 w-7 place-items-center rounded-lg text-[13px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ←
          </button>
          <button
            onClick={() => send('forward')}
            title="進む（Ctrl + ] ）"
            className="grid h-7 w-7 place-items-center rounded-lg text-[13px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            →
          </button>
          <button
            onClick={() => send('reload')}
            title="再読み込み（Ctrl + R）"
            className="grid h-7 w-7 place-items-center rounded-lg text-[12px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ↻
          </button>

          <input
            value={addressBar}
            onChange={(e) => setAddressBar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goAddress()}
            placeholder="URL または検索語を入力"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11.5px] outline-none transition focus:border-dd-accent/60"
          />

          <button
            onClick={() => window.dd?.shell.openExternal(active.url)}
            title="既定のブラウザで開く"
            className="grid h-7 w-7 place-items-center rounded-lg text-[12px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
          >
            ↗
          </button>
        </div>
      )}

      {/* ============ 表示領域 ============ */}
      <div className="relative flex-1 overflow-hidden">
        {tabs.length === 0 ? (
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <div className="mb-3 text-4xl opacity-25">◫</div>
              <p className="mb-1 text-[13px] font-semibold text-dd-muted">
                ＋ を押してタブを開いてください
              </p>
              <p className="text-[11px] leading-relaxed text-dd-muted/70">
                Claude・GitHub・Vercel などはアプリ内で表示できます。
                <br />
                Google・YouTube・X はサイト側の制限でブラウザが開きます。
              </p>
            </div>
          </div>
        ) : (
          /* タブは非表示にするだけで、消さずに残します（再読み込み防止） */
          tabs.map((t) => (
            <div
              key={t.id}
              className="absolute inset-0"
              style={{ visibility: t.id === activeId ? 'visible' : 'hidden' }}
            >
              <WebFrame
                url={t.url}
                command={t.id === activeId ? command : null}
                onTitle={(title) => updateTab(t.id, { title })}
                onLoading={(loading) => updateTab(t.id, { loading })}
                onUrlChange={(url) => updateTab(t.id, { url })}
              />
            </div>
          ))
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
            <h3 className="mb-1 text-[15px] font-bold">タブで開くツール</h3>
            <p className="mb-4 text-[11px] text-dd-muted">
              グレーのものは、サイト側の制限でブラウザが開きます。
            </p>

            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {TOOLS.filter((t) => t.url).map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTab(t)}
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
    </div>
  );
}
