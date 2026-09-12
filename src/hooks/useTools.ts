/**
 * ============================================================
 *  useTools — ツール一覧の管理
 * ------------------------------------------------------------
 *  最初から入っているツール（tools.ts）と、
 *  あとから追加したツール（Firestore）をまとめて扱います。
 *
 *  追加分の保存先：
 *    個人用   users/{uid}/daydream/customTools
 *    グループ groups/{groupId}/daydream/customTools
 *
 *  グループに参加していれば、追加したツールは
 *  アプリを作り直さなくても、全員の画面にすぐ反映されます。
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { loadLocal, saveLocal } from '../lib/storage';
import { BUILT_IN_TOOLS } from '../lib/tools';
import type { Tool } from '../types';

/** 最初から入っているツールへの変更内容 */
export interface ToolOverride {
  /** 対象の id */
  id: string;
  /** 一覧から隠すかどうか */
  hidden?: boolean;
  /** 名前を変えた場合 */
  name?: string;
  /** URL を変えた場合 */
  url?: string;
  /** 記号を変えた場合 */
  icon?: string;
  /** 色を変えた場合 */
  color?: string;
}

/** Firestore に保存する内容 */
interface ToolData {
  /** 追加したツール */
  custom: Tool[];
  /** 最初から入っているツールへの変更 */
  overrides: ToolOverride[];
}

const EMPTY: ToolData = { custom: [], overrides: [] };

const newId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function useTools(user: User | null, scope?: string[] | null) {
  /** 保存先が変わっても、端末の控えは分けて持ちます */
  const localKey = useMemo(() => {
    if (scope && scope[0] === 'groups') return `dd.g.${scope[1]}.tools`;
    return 'dd.tools';
  }, [scope]);

  const [data, setData] = useState<ToolData>(() => loadLocal<ToolData>(localKey, EMPTY));
  const [message, setMessage] = useState<string | null>(null);

  /* 保存先が変わったら、その控えを読み直します */
  useEffect(() => {
    setData(loadLocal<ToolData>(localKey, EMPTY));
  }, [localKey]);

  /* ---------- Firestore の変更を受け取る ---------- */
  useEffect(() => {
    if (!db || !user) return;

    const path = scope ?? ['users', user.uid, 'daydream'];
    const ref = doc(db, path[0], path[1], path[2], 'customTools');

    const stop = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as Partial<ToolData>;
        const merged: ToolData = {
          custom: Array.isArray(d.custom) ? d.custom : [],
          overrides: Array.isArray(d.overrides) ? d.overrides : [],
        };
        setData(merged);
        saveLocal(localKey, merged);
      },
      () => {
        /* 読めない場合は端末の内容を使います */
      },
    );
    return stop;
  }, [user, scope, localKey]);

  /** 保存します */
  const commit = useCallback(
    async (next: ToolData) => {
      setData(next);
      saveLocal(localKey, next);

      if (!db || !user) return;

      const path = scope ?? ['users', user.uid, 'daydream'];
      try {
        await setDoc(doc(db, path[0], path[1], path[2], 'customTools'), next, { merge: true });
      } catch {
        setMessage('保存に失敗しました。通信の状態をご確認ください。');
      }
    },
    [user, scope, localKey],
  );

  /* ---------- 表示するツールの一覧 ---------- */
  const tools = useMemo<Tool[]>(() => {
    const overrideMap = new Map(data.overrides.map((o) => [o.id, o]));

    const base = BUILT_IN_TOOLS
      .filter((t) => !overrideMap.get(t.id)?.hidden)
      .map((t) => {
        const o = overrideMap.get(t.id);
        if (!o) return t;
        return {
          ...t,
          name: o.name ?? t.name,
          url: o.url ?? t.url,
          icon: o.icon ?? t.icon,
          color: o.color ?? t.color,
        };
      });

    return [...base, ...data.custom];
  }, [data]);

  /** id からツールを引きます */
  const findTool = useCallback(
    (id: string): Tool | undefined => tools.find((t) => t.id === id),
    [tools],
  );

  /* ---------- 追加・変更・削除 ---------- */

  /** 新しいツールを追加します */
  const addTool = useCallback(
    (tool: Omit<Tool, 'id'>) => {
      const rec: Tool = { ...tool, id: newId() };
      commit({ ...data, custom: [...data.custom, rec] });
      setMessage(`${tool.name} を追加しました。`);
      setTimeout(() => setMessage(null), 2500);
      return rec;
    },
    [data, commit],
  );

  /** ツールを変更します */
  const updateTool = useCallback(
    (id: string, patch: Partial<Tool>) => {
      const isCustom = data.custom.some((t) => t.id === id);

      if (isCustom) {
        commit({
          ...data,
          custom: data.custom.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        });
        return;
      }

      // 最初から入っているツールは、変更内容だけを記録します
      const others = data.overrides.filter((o) => o.id !== id);
      const current = data.overrides.find((o) => o.id === id) ?? { id };
      commit({ ...data, overrides: [...others, { ...current, ...patch }] });
    },
    [data, commit],
  );

  /** ツールを消します（最初から入っている分は隠すだけ） */
  const removeTool = useCallback(
    (id: string) => {
      const isCustom = data.custom.some((t) => t.id === id);

      if (isCustom) {
        commit({ ...data, custom: data.custom.filter((t) => t.id !== id) });
      } else {
        const others = data.overrides.filter((o) => o.id !== id);
        const current = data.overrides.find((o) => o.id === id) ?? { id };
        commit({ ...data, overrides: [...others, { ...current, hidden: true }] });
      }

      setMessage('一覧から外しました。');
      setTimeout(() => setMessage(null), 2500);
    },
    [data, commit],
  );

  /** 隠したツールを元に戻します */
  const restoreTool = useCallback(
    (id: string) => {
      const others = data.overrides.filter((o) => o.id !== id);
      const current = data.overrides.find((o) => o.id === id);

      if (current) {
        const { hidden, ...rest } = current;
        void hidden;
        // 変更が何も残らない場合は、記録ごと消します
        const hasOther = Object.keys(rest).length > 1;
        commit({ ...data, overrides: hasOther ? [...others, rest] : others });
      }

      setMessage('一覧に戻しました。');
      setTimeout(() => setMessage(null), 2500);
    },
    [data, commit],
  );

  /** 最初から入っているツールの変更を、すべて元に戻します */
  const resetOverrides = useCallback(() => {
    commit({ ...data, overrides: [] });
    setMessage('最初の状態に戻しました。');
    setTimeout(() => setMessage(null), 2500);
  }, [data, commit]);

  /** いま隠しているツールの一覧 */
  const hiddenTools = useMemo(
    () =>
      data.overrides
        .filter((o) => o.hidden)
        .map((o) => BUILT_IN_TOOLS.find((t) => t.id === o.id))
        .filter((t): t is Tool => !!t),
    [data.overrides],
  );

  return {
    tools,
    customTools: data.custom,
    hiddenTools,
    findTool,
    addTool,
    updateTool,
    removeTool,
    restoreTool,
    resetOverrides,
    message,
    setMessage,
  };
}
