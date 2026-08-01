/**
 * ============================================================
 *  App — 画面の土台
 * ------------------------------------------------------------
 *  タイトルバーと、各画面の切り替えを行います。
 * ============================================================
 */

import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import Home from './components/Home';
import Workspace from './components/Workspace';
import StartupCheck from './components/StartupCheck';
import type { ViewName } from './types';

export default function App() {
  const [view, setView] = useState<ViewName>('home');

  /* Ctrl + Tab で画面を順に切り替える */
  useEffect(() => {
    const order: ViewName[] = ['home', 'workspace', 'check'];
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        setView((cur) => order[(order.indexOf(cur) + 1) % order.length]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <TitleBar view={view} onChangeView={setView} />

      <main className="flex-1 overflow-hidden">
        {view === 'home' && (
          <div className="h-full overflow-y-auto">
            <Home />
          </div>
        )}
        {view === 'workspace' && <Workspace />}
        {view === 'check' && (
          <div className="h-full overflow-y-auto">
            <StartupCheck />
          </div>
        )}
      </main>
    </div>
  );
}
