/**
 * ============================================================
 *  useLocalApps — パソコンに入っているアプリの管理
 * ------------------------------------------------------------
 *  CapCut や DaVinci Resolve など、この PC に入っているアプリを
 *  登録しておくと、ワンクリックで起動できます。
 *
 *  ※ 場所は PC ごとに違うため、この PC の中だけに保存します。
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { loadLocal, saveLocal } from '../lib/storage';
import type { LocalApp } from '../types';

const KEY = 'localApps';

/** アプリ名から、それらしい記号と色を選びます */
function guessLook(name: string): { icon: string; color: string } {
  const n = name.toLowerCase();

  const table: { match: string[]; icon: string; color: string }[] = [
    { match: ['capcut'],            icon: '✂', color: 'from-[#111827] to-[#374151]' },
    { match: ['davinci', 'resolve'],icon: '◈', color: 'from-[#f97316] to-[#c2410c]' },
    { match: ['premiere'],          icon: 'Pr', color: 'from-[#6d28d9] to-[#4c1d95]' },
    { match: ['after effect'],      icon: 'Ae', color: 'from-[#7c3aed] to-[#5b21b6]' },
    { match: ['photoshop'],         icon: 'Ps', color: 'from-[#0ea5e9] to-[#075985]' },
    { match: ['illustrator'],       icon: 'Ai', color: 'from-[#f59e0b] to-[#b45309]' },
    { match: ['blender'],           icon: '◐', color: 'from-[#f97316] to-[#ea580c]' },
    { match: ['obs'],               icon: '●', color: 'from-[#1f2937] to-[#111827]' },
    { match: ['audacity'],          icon: '♪', color: 'from-[#2563eb] to-[#1e40af]' },
    { match: ['voicevox', 'voice'], icon: '◑', color: 'from-[#22d3ee] to-[#0e7490]' },
    { match: ['discord'],           icon: '◍', color: 'from-[#5865f2] to-[#3c45a5]' },
    { match: ['vlc'],               icon: '▶', color: 'from-[#f97316] to-[#c2410c]' },
    { match: ['code', 'vscode'],    icon: '◧', color: 'from-[#0ea5e9] to-[#0369a1]' },
    { match: ['github'],            icon: '⌥', color: 'from-[#4b5563] to-[#111827]' },
    { match: ['bandicam', 'record'],icon: '◉', color: 'from-[#dc2626] to-[#991b1b]' },
    { match: ['excel'],             icon: '▦', color: 'from-[#16a34a] to-[#14532d]' },
    { match: ['word'],              icon: '▤', color: 'from-[#2563eb] to-[#1e3a8a]' },
    { match: ['chrome', 'edge'],    icon: '◎', color: 'from-[#3b82f6] to-[#1d4ed8]' },
    { match: ['music', 'spotify'],  icon: '♫', color: 'from-[#22c55e] to-[#15803d]' },
  ];

  for (const t of table) {
    if (t.match.some((m) => n.includes(m))) {
      return { icon: t.icon, color: t.color };
    }
  }

  // 見つからない場合は、頭文字を使います
  return {
    icon: name.slice(0, 1).toUpperCase(),
    color: 'from-[#5b8cff] to-[#a06bff]',
  };
}

const newId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function useLocalApps() {
  const [apps, setApps] = useState<LocalApp[]>(() => loadLocal<LocalApp[]>(KEY, []));
  const [message, setMessage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const bridge = window.dd;
  const available = !!bridge;

  useEffect(() => {
    saveLocal(KEY, apps);
  }, [apps]);

  /** 自分でファイルを選んで登録します */
  const addByPicker = useCallback(async () => {
    if (!bridge) return;
    setMessage(null);

    const r = await bridge.app.pickExe();
    if (!r) return;

    if (apps.some((a) => a.path === r.path)) {
      setMessage('そのアプリは、すでに登録されています。');
      return;
    }

    const look = guessLook(r.name);
    setApps((prev) => [...prev, { id: newId(), name: r.name, path: r.path, ...look }]);
    setMessage(`${r.name} を登録しました。`);
  }, [bridge, apps]);

  /** よくある場所から自動で探します */
  const autoFind = useCallback(async () => {
    if (!bridge) return;

    setSearching(true);
    setMessage(null);

    try {
      const found = await bridge.app.findKnown();

      if (found.length === 0) {
        setMessage('見つかりませんでした。「自分で選ぶ」からご登録ください。');
        return;
      }

      let added = 0;
      setApps((prev) => {
        const next = [...prev];
        for (const f of found) {
          if (next.some((a) => a.path === f.path)) continue;
          next.push({ id: newId(), name: f.name, path: f.path, ...guessLook(f.name) });
          added += 1;
        }
        return next;
      });

      // setApps の中で数えた値は、次の描画まで反映されないため少し待ちます
      setTimeout(() => {
        setMessage(
          added > 0
            ? `${added} 件のアプリを登録しました。`
            : '新しく見つかったアプリはありませんでした。',
        );
      }, 100);
    } finally {
      setSearching(false);
    }
  }, [bridge]);

  /** 登録したアプリを起動します */
  const launch = useCallback(
    async (appItem: LocalApp) => {
      if (!bridge) return;
      setMessage(null);

      const ok = await bridge.app.exists(appItem.path);
      if (!ok) {
        setMessage(
          `${appItem.name} が見つかりませんでした。場所が変わった可能性があります。登録し直してください。`,
        );
        return;
      }

      const r = await bridge.app.launch(appItem.path);
      if (r.ok) {
        setMessage(`${appItem.name} を起動しました。`);
        setTimeout(() => setMessage(null), 2500);
      } else {
        setMessage(`起動できませんでした。${r.error ?? ''}`);
      }
    },
    [bridge],
  );

  const rename = useCallback((id: string, name: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, name, ...guessLook(name) } : a)));
  }, []);

  const remove = useCallback((id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    setApps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return {
    apps,
    available,
    searching,
    message,
    setMessage,
    addByPicker,
    autoFind,
    launch,
    rename,
    remove,
    reorder,
  };
}
