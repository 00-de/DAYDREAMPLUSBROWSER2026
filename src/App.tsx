/**
 * ============================================================
 *  App — 画面の土台
 * ------------------------------------------------------------
 *  タイトルバーと、各画面の切り替えを行います。
 *  ホーム画面でツールを押すと、ブラウザ画面のタブで開きます。
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import Home from './components/Home';
import Browser from './components/Browser';
import Workspace from './components/Workspace';
import StartupCheck from './components/StartupCheck';
import Dock from './components/Dock';
import type { Tool, ViewName } from './types';

const ORDER: ViewName[] = ['home', 'browser', 'workspace', 'check'];

export default function App() {
  const [view, setView] = useState<ViewName>('home');

  /* ホーム画面からブラウザ画面へ「これを開いて」と伝えるための箱 */
  const [request, setRequest] = useState<{ tool: Tool; nonce: number } | null>(null);

  const openInApp = useCallback((tool: Tool) => {
    setRequest({ tool, nonce: Date.now() });
    setView('browser');
  }, []);

  /* Ctrl + Tab で画面を順に切り替える */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        setView((cur) => ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <TitleBar view={view} onChangeView={setView} />

      <main className="flex-1 overflow-hidden">
        {/* ブラウザと Workspace は、切り替えても中身を消さずに残します。
            そうしないと、画面を移るたびにページが再読み込みされてしまいます。 */}
        <div className="h-full" style={{ display: view === 'home' ? 'block' : 'none' }}>
          <div className="h-full overflow-y-auto">
            <Home onOpenInApp={openInApp} />
          </div>
        </div>

        <div className="h-full" style={{ display: view === 'browser' ? 'block' : 'none' }}>
          <Browser request={request} />
        </div>

        <div className="h-full" style={{ display: view === 'workspace' ? 'block' : 'none' }}>
          <Workspace />
        </div>

        {view === 'check' && (
          <div className="h-full overflow-y-auto">
            <StartupCheck />
          </div>
        )}
      </main>

      {/* 画面下の Dock。どの画面でも共通で表示します。 */}
      <Dock onOpen={openInApp} />
    </div>
  );
}
