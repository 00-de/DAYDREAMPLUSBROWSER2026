/**
 * ============================================================
 *  useBackground — 背景の設定
 * ------------------------------------------------------------
 *  選んだ背景をこの PC に保存し、画面全体に反映します。
 *  ログイン中は Firestore にも保存し、別の PC でも同じ見た目に
 *  なります（画像は URL の場合のみ同期されます）。
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { loadLocal, saveLocal } from '../lib/storage';
import { DEFAULT_BACKGROUND, hexToRgb, toCss, type Background } from '../lib/themes';

const KEY = 'background';

/** PC 内に保存した画像は大きいので、同期の対象から外します */
function isLocalImage(bg: Background): boolean {
  return bg.kind === 'image' && !!bg.imageUrl?.startsWith('data:');
}

export function useBackground(user: User | null) {
  const [bg, setBg] = useState<Background>(() => loadLocal<Background>(KEY, DEFAULT_BACKGROUND));

  /* ---------- クラウドの内容を受け取る ---------- */
  useEffect(() => {
    if (!db || !user) return;

    const ref = doc(db, 'users', user.uid, 'daydream', 'background');
    const stop = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Background;

        // この PC で画像を選んでいる場合は、上書きしません
        const current = loadLocal<Background>(KEY, DEFAULT_BACKGROUND);
        if (isLocalImage(current)) return;

        setBg({ ...DEFAULT_BACKGROUND, ...data });
        saveLocal(KEY, { ...DEFAULT_BACKGROUND, ...data });
      },
      () => {
        /* 読めない場合はこの PC の設定を使います */
      },
    );
    return stop;
  }, [user]);

  /* ---------- 画面へ反映 ---------- */
  useEffect(() => {
    const css = toCss(bg);
    const root = document.documentElement;

    root.style.setProperty('--dd-bg-color', css.backgroundColor);
    root.style.setProperty('--dd-bg-image', css.background);
    root.style.setProperty('--dd-panel-rgb', hexToRgb(css.panel));

    // 明るい背景のときは、文字色を暗く切り替えます
    root.setAttribute('data-tone', css.light ? 'light' : 'dark');

    if (bg.kind === 'image' && bg.imageUrl) {
      root.style.setProperty('--dd-photo', `url("${bg.imageUrl}")`);
      root.style.setProperty('--dd-dim', String((bg.dim ?? 40) / 100));
      root.style.setProperty('--dd-blur', `${bg.blur ?? 0}px`);
      root.setAttribute('data-bg', 'image');
    } else {
      root.style.removeProperty('--dd-photo');
      root.setAttribute('data-bg', bg.kind);
    }
  }, [bg]);

  /* ---------- 変更を保存 ---------- */
  const change = useCallback(
    async (next: Background) => {
      setBg(next);
      saveLocal(KEY, next);

      if (!db || !user) return;
      // PC 内の画像は大きすぎるため、クラウドには送りません
      if (isLocalImage(next)) return;

      try {
        await setDoc(doc(db, 'users', user.uid, 'daydream', 'background'), next, { merge: true });
      } catch {
        /* 失敗してもこの PC には残ります */
      }
    },
    [user],
  );

  return { bg, change };
}
