/**
 * ============================================================
 *  useCollection — 一覧データの管理
 * ------------------------------------------------------------
 *  ログイン中は Firestore、未ログイン時はこの PC に保存します。
 *
 *  グループに参加していれば、グループの保存先を使います。
 *  参加していなければ、個人の保存先を使います。
 *    個人用   users/{uid}/daydream/{種類}
 *    グループ groups/{groupId}/daydream/{種類}
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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
 * @param scope    保存先の道。省略時は個人用。
 */
export function useCollection<T extends HasId>(
  key: string,
  initial: T[],
  user: User | null,
  scope?: string[] | null,
) {
  /** 保存先が変わっても、端末の控えは分けて持ちます */
  const localKey = useMemo(() => {
    if (scope && scope[0] === 'groups') return `dd.g.${scope[1]}.${key}`;
    return `dd.${key}`;
  }, [scope, key]);

  const [items, setItems] = useState<T[]>(() => loadLocal<T[]>(localKey, initial));
  const [syncing, setSyncing] = useState(false);

  /* 保存先が変わったら、その控えを読み直します */
  useEffect(() => {
    setItems(loadLocal<T[]>(localKey, initial));
    // initial は毎回同じ内容のため、依存に含めません
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localKey]);

  /* ---------- Firestore の変更を受け取る ---------- */
  useEffect(() => {
    if (!db || !user) return;

    const path = scope ?? ['users', user.uid, 'daydream'];
    const ref = doc(db, path[0], path[1], path[2], key);

    const stop = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as { items?: T[] };
        if (Array.isArray(data.items)) {
          setItems(data.items);
          saveLocal(localKey, data.items);
        }
      },
      () => {
        /* 読めない場合は端末の内容をそのまま使います */
      },
    );
    return stop;
  }, [key, user, scope, localKey]);

  /** 一覧を丸ごと差し替えて保存します */
  const commit = useCallback(
    async (next: T[]) => {
      setItems(next);
      saveLocal(localKey, next);

      if (!db || !user) return;

      const path = scope ?? ['users', user.uid, 'daydream'];
      setSyncing(true);
      try {
        await setDoc(doc(db, path[0], path[1], path[2], key), { items: next }, { merge: true });
      } catch {
        /* 保存に失敗しても端末には残ります */
      } finally {
        setSyncing(false);
      }
    },
    [key, user, scope, localKey],
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
