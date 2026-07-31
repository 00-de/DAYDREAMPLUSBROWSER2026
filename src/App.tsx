/**
 * ============================================================
 *  App — 画面の土台
 * ------------------------------------------------------------
 *  タイトルバーと、ホーム／起動チェックの切り替えを行います。
 * ============================================================
 */

import { useState } from 'react';
import TitleBar from './components/TitleBar';
import Home from './components/Home';
import StartupCheck from './components/StartupCheck';
import type { ViewName } from './types';

export default function App() {
  const [view, setView] = useState<ViewName>('home');

  return (
    <div className="flex h-full flex-col">
      <TitleBar view={view} onChangeView={setView} />

      <main className="flex-1 overflow-y-auto">
        {view === 'home' ? <Home /> : <StartupCheck />}
      </main>
    </div>
  );
}
