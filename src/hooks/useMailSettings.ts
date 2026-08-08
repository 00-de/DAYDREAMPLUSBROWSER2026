/**
 * ============================================================
 *  useMailSettings — メール送信の設定
 * ------------------------------------------------------------
 *  ログイン中は Firestore、未ログイン時はこの PC に保存します。
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { loadLocal, saveLocal } from '../lib/storage';
import { DEFAULT_MAIL_SETTINGS } from '../lib/mail';
import type { MailSettings } from '../types';

const KEY = 'mail.settings';

export function useMailSettings(user: User | null) {
  const [settings, setSettings] = useState<MailSettings>(() =>
    loadLocal<MailSettings>(KEY, DEFAULT_MAIL_SETTINGS),
  );

  /* Firestore の内容を受け取る */
  useEffect(() => {
    if (!db || !user) return;

    const ref = doc(db, 'users', user.uid, 'daydream', 'mailSettings');
    const stop = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Partial<MailSettings>;
        const merged = { ...DEFAULT_MAIL_SETTINGS, ...data };
        setSettings(merged);
        saveLocal(KEY, merged);
      },
      () => {
        /* 読めない場合は端末の内容を使います */
      },
    );
    return stop;
  }, [user]);

  const save = useCallback(
    async (next: MailSettings) => {
      setSettings(next);
      saveLocal(KEY, next);

      if (!db || !user) return;
      try {
        await setDoc(doc(db, 'users', user.uid, 'daydream', 'mailSettings'), next, { merge: true });
      } catch {
        /* 失敗しても端末には残ります */
      }
    },
    [user],
  );

  return { settings, save };
}
