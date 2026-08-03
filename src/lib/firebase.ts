/**
 * ============================================================
 *  Firebase 初期化
 * ------------------------------------------------------------
 *  ▼ 下の firebaseConfig を、ご自身のプロジェクトの値に
 *    書き換えてください（Firebaseコンソール → プロジェクトの設定）。
 *
 *  まだ設定していない場合でもアプリは起動します。
 *  その場合 isFirebaseReady が false になります。
 * ============================================================
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA6G1UCwb6aTaJiPp7Gy6mCgxmBLowVMg4",
  authDomain: "daydreambroser2026.firebaseapp.com",
  projectId: "daydreambroser2026",
  storageBucket: "daydreambroser2026.firebasestorage.app",
  messagingSenderId: "497868135929",
  appId: "1:497868135929:web:59a7d0146fec2091c43128"
};

/** 設定が書き換え済みかどうかの判定 */
export const isFirebaseReady =
  !firebaseConfig.apiKey.startsWith('ここに') && firebaseConfig.projectId.length > 0;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseReady) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (e) {
    console.error('Firebase の初期化に失敗しました:', e);
  }
}

export { app, db, storage, auth, firebaseConfig };
