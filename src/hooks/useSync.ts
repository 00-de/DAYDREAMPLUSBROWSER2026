/**
 * ============================================================
 *  useSync — 設定を Firestore と同期する
 * ------------------------------------------------------------
 *  お気に入り・Dock・レイアウトを、ログインした利用者ごとに
 *  クラウドへ保存します。別の PC でも同じ設定が使えます。
 *
 *  保存先： users/{uid}/settings/workspace
 * ============================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { loadLocal, saveLocal } from '../lib/storage';
import type { Layout } from '../types';

/** 同期する内容 */
export interface SyncData {
  favorites: string[];
  dock: string[];
  layouts: Layout[];
}

export type SyncState = 'off' | 'idle' | 'saving' | 'error';

/** この端末の設定をまとめて取り出す */
function collectLocal(): SyncData {
  return {
    favorites: loadLocal<string[]>('favorites', []),
    dock: loadLocal<string[]>('dock', []),
    layouts: loadLocal<Layout[]>('layouts', []),
  };
}

/** 受け取った設定をこの端末に書き戻す */
function applyLocal(data: Partial<SyncData>) {
  if (data.favorites) saveLocal('favorites', data.favorites);
  if (data.dock) saveLocal('dock', data.dock);
  if (data.layouts) saveLocal('layouts', data.layouts);
}

export function useSync(user: User | null) {
  const [state, setState] = useState<SyncState>('off');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const applying = useRef(false);

  /* ---------- クラウドの変更を監視 ---------- */
  useEffect(() => {
    if (!db || !user) {
      setState('off');
      return;
    }

    setState('idle');
    const ref = doc(db, 'users', user.uid, 'settings', 'workspace');

    const stop = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        // 自分が書き込んだ直後は無視する
        if (applying.current) return;

        const data = snap.data() as Partial<SyncData>;
        applyLocal(data);
        setLastSaved(new Date());
      },
      () => {
        setState('error');
        setMessage('クラウドの読み取りに失敗しました。Firestore のルールをご確認ください。');
      },
    );

    return stop;
  }, [user]);

  /** この端末の設定をクラウドへ送る */
  const push = useCallback(async () => {
    if (!db || !user) return false;

    setState('saving');
    setMessage(null);
    applying.current = true;

    try {
      const ref = doc(db, 'users', user.uid, 'settings', 'workspace');
      await setDoc(ref, { ...collectLocal(), updatedAt: serverTimestamp() }, { merge: true });
      setLastSaved(new Date());
      setState('idle');
      setMessage('クラウドへ保存しました。');
      return true;
    } catch {
      setState('error');
      setMessage('保存に失敗しました。Firestore のルールをご確認ください。');
      return false;
    } finally {
      // 監視側が反応し終わるのを少し待ってから解除します
      setTimeout(() => {
        applying.current = false;
      }, 800);
    }
  }, [user]);

  /** クラウドの設定をこの端末へ取り込む */
  const pull = useCallback(async () => {
    if (!db || !user) return false;

    setState('saving');
    setMessage(null);

    try {
      const ref = doc(db, 'users', user.uid, 'settings', 'workspace');
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setState('idle');
        setMessage('クラウドにまだ保存がありません。先に「保存」してください。');
        return false;
      }

      applyLocal(snap.data() as Partial<SyncData>);
      setLastSaved(new Date());
      setState('idle');
      setMessage('クラウドから取り込みました。画面を切り替えると反映されます。');
      return true;
    } catch {
      setState('error');
      setMessage('取り込みに失敗しました。');
      return false;
    }
  }, [user]);

  return { state, lastSaved, message, push, pull, setMessage };
}
