/**
 * ============================================================
 *  useImageUpload — Firebase Storage への画像アップロード
 * ------------------------------------------------------------
 *  保存先： users/{uid}/members/{memberId}
 *
 *  ・アップロード前に、ブラウザ側で 512px に縮小します
 *    （通信量とストレージ容量を抑えるため）
 *  ・ログインしていない場合は使えません
 * ============================================================
 */

import { useCallback, useState } from 'react';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { storage } from '../lib/firebase';

/** 縮小後の最大の辺（ピクセル） */
const MAX_SIZE = 512;

/** 受け付ける形式 */
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** アップロード前の容量上限（10MB） */
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * 画像を正方形に切り抜き、512px に縮小します。
 * 顔写真として使うため、中央を基準に切り抜きます。
 */
function shrink(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 中央を正方形に切り抜く
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = MAX_SIZE;
      canvas.height = MAX_SIZE;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('画像を処理できませんでした'));
        return;
      }

      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_SIZE, MAX_SIZE);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('変換に失敗しました'))),
        'image/jpeg',
        0.86,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('画像を読み込めませんでした'));
    };

    img.src = url;
  });
}

export function useImageUpload(user: User | null) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 使える状態かどうか */
  const available = !!storage && !!user;

  /**
   * 画像をアップロードし、表示用の URL を返します。
   * 失敗した場合は null を返します。
   */
  const upload = useCallback(
    async (memberId: string, file: File): Promise<string | null> => {
      setError(null);

      if (!storage || !user) {
        setError('写真を使うにはログインが必要です。');
        return null;
      }
      if (!ALLOWED.includes(file.type)) {
        setError('JPEG・PNG・WebP・GIF のいずれかを選んでください。');
        return null;
      }
      if (file.size > MAX_BYTES) {
        setError('ファイルが大きすぎます（10MB まで）。');
        return null;
      }

      setBusy(true);
      try {
        const blob = await shrink(file);
        const path = `users/${user.uid}/members/${memberId}.jpg`;
        const r = ref(storage, path);

        await uploadBytes(r, blob, { contentType: 'image/jpeg' });
        return await getDownloadURL(r);
      } catch (e) {
        const code = (e as { code?: string }).code ?? '';
        if (code === 'storage/unauthorized') {
          setError('保存が許可されていません。Storage のルールをご確認ください。');
        } else if (code === 'storage/retry-limit-exceeded') {
          setError('通信に時間がかかりすぎました。もう一度お試しください。');
        } else {
          setError('アップロードに失敗しました。');
        }
        return null;
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  /** 写真を削除します */
  const remove = useCallback(
    async (memberId: string): Promise<boolean> => {
      if (!storage || !user) return false;
      try {
        await deleteObject(ref(storage, `users/${user.uid}/members/${memberId}.jpg`));
        return true;
      } catch {
        // すでに無い場合も成功として扱います
        return true;
      }
    },
    [user],
  );

  return { upload, remove, busy, error, available, setError };
}
