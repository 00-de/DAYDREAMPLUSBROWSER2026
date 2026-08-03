/**
 * ============================================================
 *  useAuth — ログイン状態の管理
 * ------------------------------------------------------------
 *  Firebase Authentication（メール＋パスワード）を使います。
 *  Firebase が未設定の場合でも、アプリは動き続けます。
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseReady } from '../lib/firebase';

/** Firebase のエラーコードを、日本語の案内に直します */
function toJapanese(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
    'auth/user-not-found': 'このメールアドレスは登録されていません。',
    'auth/wrong-password': 'パスワードが違います。',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが違います。',
    'auth/email-already-in-use': 'このメールアドレスは既に登録されています。',
    'auth/weak-password': 'パスワードは6文字以上にしてください。',
    'auth/too-many-requests': '試行回数が多すぎます。しばらく待ってからお試しください。',
    'auth/network-request-failed': 'ネットワークに接続できませんでした。',
    'auth/operation-not-allowed':
      'メール認証が有効になっていません。Firebase コンソールで有効にしてください。',
  };
  return map[code] ?? `エラーが発生しました（${code}）`;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseReady);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ログイン状態の監視 */
  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    const stop = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return stop;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!auth) return false;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (e) {
      setError(toJapanese((e as { code?: string }).code ?? 'unknown'));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    if (!auth) return false;
    setBusy(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (e) {
      setError(toJapanese((e as { code?: string }).code ?? 'unknown'));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, []);

  return { user, ready, busy, error, login, register, logout, setError };
}
