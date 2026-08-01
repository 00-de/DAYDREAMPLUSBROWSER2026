/**
 * ============================================================
 *  useWorkspace — Workspace の状態管理
 * ------------------------------------------------------------
 *  ウィンドウの追加・移動・サイズ変更・レイアウト保存を
 *  すべてここで受け持ちます。
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { loadLocal, saveLocal } from '../lib/storage';
import type { Layout, Pane, SnapZone, Tab, Tool } from '../types';

/** ウィンドウの最小サイズ */
export const MIN_W = 280;
export const MIN_H = 200;

/** 新しいウィンドウを開くときの既定サイズ */
const DEF_W = 520;
const DEF_H = 380;

const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** スナップ位置から座標を計算する */
export function zoneToRect(zone: SnapZone, cw: number, ch: number) {
  const half = { w: Math.floor(cw / 2), h: Math.floor(ch / 2) };
  switch (zone) {
    case 'left':        return { x: 0,      y: 0,      w: half.w, h: ch };
    case 'right':       return { x: half.w, y: 0,      w: cw - half.w, h: ch };
    case 'top':         return { x: 0,      y: 0,      w: cw,     h: half.h };
    case 'bottom':      return { x: 0,      y: half.h, w: cw,     h: ch - half.h };
    case 'topLeft':     return { x: 0,      y: 0,      w: half.w, h: half.h };
    case 'topRight':    return { x: half.w, y: 0,      w: cw - half.w, h: half.h };
    case 'bottomLeft':  return { x: 0,      y: half.h, w: half.w, h: ch - half.h };
    case 'bottomRight': return { x: half.w, y: half.h, w: cw - half.w, h: ch - half.h };
    case 'full':        return { x: 0,      y: 0,      w: cw,     h: ch };
  }
}

export function useWorkspace() {
  const [panes, setPanes] = useState<Pane[]>(() => loadLocal<Pane[]>('panes', []));
  const [layouts, setLayouts] = useState<Layout[]>(() => loadLocal<Layout[]>('layouts', []));
  const [activeId, setActiveId] = useState<string | null>(null);
  const topZ = useRef(10);

  /* 起動時に、保存済みウィンドウの最大 z を拾っておく */
  useEffect(() => {
    topZ.current = panes.reduce((m, p) => Math.max(m, p.z), 10);
    // 初回のみ実行するため、依存は空にしています
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 変更のたびに保存 */
  useEffect(() => {
    saveLocal('panes', panes);
  }, [panes]);

  useEffect(() => {
    saveLocal('layouts', layouts);
  }, [layouts]);

  /** 最前面に持ってくる */
  const focusPane = useCallback((id: string) => {
    topZ.current += 1;
    const z = topZ.current;
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, z } : p)));
    setActiveId(id);
  }, []);

  /** ツールを開く（既に開いていれば前面に出すだけ） */
  const openPane = useCallback(
    (tool: Tool, container: { w: number; h: number }) => {
      const exists = panes.find((p) => p.toolId === tool.id);
      if (exists) {
        focusPane(exists.id);
        if (exists.minimized) {
          setPanes((prev) =>
            prev.map((p) => (p.id === exists.id ? { ...p, minimized: false } : p)),
          );
        }
        return;
      }

      // 開くたびに少しずつずらして重ならないようにする
      const n = panes.length;
      const offset = (n % 6) * 28;

      topZ.current += 1;
      const firstTab: Tab = {
        id: uid(),
        toolId: tool.id,
        title: tool.name,
        url: tool.url,
        loading: true,
      };
      const pane: Pane = {
        id: uid(),
        toolId: tool.id,
        title: tool.name,
        url: tool.url,
        tabs: [firstTab],
        activeTabId: firstTab.id,
        x: Math.min(40 + offset, Math.max(0, container.w - DEF_W - 20)),
        y: Math.min(40 + offset, Math.max(0, container.h - DEF_H - 20)),
        w: Math.min(DEF_W, container.w - 40),
        h: Math.min(DEF_H, container.h - 40),
        z: topZ.current,
        minimized: false,
        maximized: false,
      };

      setPanes((prev) => [...prev, pane]);
      setActiveId(pane.id);
    },
    [panes, focusPane],
  );

  /** 位置・サイズなどを部分更新 */
  const updatePane = useCallback((id: string, patch: Partial<Pane>) => {
    setPanes((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const closePane = useCallback((id: string) => {
    setPanes((prev) => prev.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const closeAll = useCallback(() => {
    setPanes([]);
    setActiveId(null);
  }, []);

  /** 指定位置にスナップ配置 */
  const snapPane = useCallback(
    (id: string, zone: SnapZone, container: { w: number; h: number }) => {
      const r = zoneToRect(zone, container.w, container.h);
      updatePane(id, { ...r, maximized: zone === 'full', minimized: false });
    },
    [updatePane],
  );

  /** 開いている全ウィンドウを均等に並べる */
  const tileAll = useCallback(
    (container: { w: number; h: number }) => {
      const list = panes.filter((p) => !p.minimized);
      if (list.length === 0) return;

      const cols = Math.ceil(Math.sqrt(list.length));
      const rows = Math.ceil(list.length / cols);
      const w = Math.floor(container.w / cols);
      const h = Math.floor(container.h / rows);

      setPanes((prev) =>
        prev.map((p) => {
          const i = list.findIndex((x) => x.id === p.id);
          if (i < 0) return p;
          return {
            ...p,
            x: (i % cols) * w,
            y: Math.floor(i / cols) * h,
            w,
            h,
            maximized: false,
          };
        }),
      );
    },
    [panes],
  );

  /* ---------- ウィンドウ内のタブ操作 ---------- */

  /** ウィンドウにタブを1枚追加する */
  const addTab = useCallback((paneId: string, tool: Tool) => {
    if (!tool.url) return;
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== paneId) return p;
        const list = p.tabs ?? [];
        const exists = list.find((t) => t.toolId === tool.id);
        if (exists) return { ...p, activeTabId: exists.id, title: exists.title };

        const tab: Tab = {
          id: uid(),
          toolId: tool.id,
          title: tool.name,
          url: tool.url,
          loading: true,
        };
        return { ...p, tabs: [...list, tab], activeTabId: tab.id, title: tab.title };
      }),
    );
  }, []);

  /** ウィンドウ内のタブを選ぶ */
  const selectTab = useCallback((paneId: string, tabId: string) => {
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== paneId) return p;
        const t = p.tabs?.find((x) => x.id === tabId);
        return { ...p, activeTabId: tabId, title: t?.title ?? p.title };
      }),
    );
  }, []);

  /** ウィンドウ内のタブを閉じる（最後の1枚ならウィンドウごと閉じる） */
  const closeTab = useCallback((paneId: string, tabId: string) => {
    setPanes((prev) => {
      const target = prev.find((p) => p.id === paneId);
      const rest = (target?.tabs ?? []).filter((t) => t.id !== tabId);

      if (rest.length === 0) return prev.filter((p) => p.id !== paneId);

      return prev.map((p) => {
        if (p.id !== paneId) return p;
        const nextActive = p.activeTabId === tabId ? rest[rest.length - 1] : rest.find((t) => t.id === p.activeTabId);
        return {
          ...p,
          tabs: rest,
          activeTabId: nextActive?.id ?? rest[0].id,
          title: nextActive?.title ?? rest[0].title,
        };
      });
    });
  }, []);

  /** タブの中身が変わったときに反映する */
  const updateTab = useCallback((paneId: string, tabId: string, patch: Partial<Tab>) => {
    setPanes((prev) =>
      prev.map((p) => {
        if (p.id !== paneId) return p;
        const tabs = (p.tabs ?? []).map((t) => (t.id === tabId ? { ...t, ...patch } : t));
        const act = tabs.find((t) => t.id === p.activeTabId);
        return { ...p, tabs, title: act?.title ?? p.title };
      }),
    );
  }, []);

  /* ---------- レイアウトの保存・呼び出し ---------- */

  const saveLayout = useCallback(
    (name: string) => {
      const rec: Layout = {
        id: 'L' + Date.now().toString(36),
        name,
        panes: JSON.parse(JSON.stringify(panes)),
        updatedAt: Date.now(),
      };
      setLayouts((prev) => [rec, ...prev].slice(0, 20));
      return rec;
    },
    [panes],
  );

  const applyLayout = useCallback((layout: Layout) => {
    setPanes(JSON.parse(JSON.stringify(layout.panes)));
    topZ.current = layout.panes.reduce((m, p) => Math.max(m, p.z), 10);
    setActiveId(null);
  }, []);

  const deleteLayout = useCallback((id: string) => {
    setLayouts((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return {
    panes,
    layouts,
    activeId,
    openPane,
    updatePane,
    closePane,
    closeAll,
    focusPane,
    snapPane,
    tileAll,
    saveLayout,
    applyLayout,
    deleteLayout,
    addTab,
    selectTab,
    closeTab,
    updateTab,
  };
}
