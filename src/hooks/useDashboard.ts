/**
 * ============================================================
 *  useDashboard — DayDream Dashboard のデータ管理
 * ------------------------------------------------------------
 *  ログイン中は Firestore、未ログイン時はこの PC に保存します。
 *  どちらの場合も同じ使い方ができます。
 *
 *  保存先： users/{uid}/daydream/{種類}
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { loadLocal, saveLocal } from '../lib/storage';

/** 何かしら id を持つもの */
interface HasId {
  id: string;
}

export const newId = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/**
 * 一覧データを1種類ぶん扱います。
 * @param key      保存名（members / lives など）
 * @param initial  初回に入れておく内容
 * @param user     ログイン中の利用者（null なら端末保存のみ）
 */
export function useCollection<T extends HasId>(key: string, initial: T[], user: User | null) {
  const [items, setItems] = useState<T[]>(() => loadLocal<T[]>(`dd.${key}`, initial));
  const [syncing, setSyncing] = useState(false);

  /* ---------- Firestore の変更を受け取る ---------- */
  useEffect(() => {
    if (!db || !user) return;

    const ref = doc(db, 'users', user.uid, 'daydream', key);
    const stop = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as { items?: T[] };
        if (Array.isArray(data.items)) {
          setItems(data.items);
          saveLocal(`dd.${key}`, data.items);
        }
      },
      () => {
        /* 読めない場合は端末の内容をそのまま使います */
      },
    );
    return stop;
  }, [key, user]);

  /** 一覧を丸ごと差し替えて保存します */
  const commit = useCallback(
    async (next: T[]) => {
      setItems(next);
      saveLocal(`dd.${key}`, next);

      if (!db || !user) return;
      setSyncing(true);
      try {
        await setDoc(doc(db, 'users', user.uid, 'daydream', key), { items: next }, { merge: true });
      } catch {
        /* 保存に失敗しても端末には残ります */
      } finally {
        setSyncing(false);
      }
    },
    [key, user],
  );

  const add = useCallback(
    (item: Omit<T, 'id'>) => commit([...items, { ...item, id: newId() } as T]),
    [items, commit],
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) =>
      commit(items.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [items, commit],
  );

  const remove = useCallback(
    (id: string) => commit(items.filter((x) => x.id !== id)),
    [items, commit],
  );

  return { items, add, update, remove, commit, syncing };
}
