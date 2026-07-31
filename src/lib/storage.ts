/**
 * ============================================================
 *  ローカル保存
 * ------------------------------------------------------------
 *  お気に入り・最近使ったツールを、この端末に保存します。
 *  8月5日以降、Firestore と同期させる予定です。
 * ============================================================
 */

const PREFIX = 'ddbrowser.';

/** 保存（失敗しても落ちない） */
export function saveLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn('保存に失敗しました:', key, e);
  }
}

/** 読み込み（無ければ既定値を返す） */
export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** 最近使ったツールの記録（先頭に追加・重複除去・最大12件） */
export function pushRecent(list: string[], id: string): string[] {
  const next = [id, ...list.filter((x) => x !== id)].slice(0, 12);
  saveLocal('recents', next);
  return next;
}
