/**
 * ============================================================
 *  DayDream➕ の初期データ
 * ------------------------------------------------------------
 *  初回起動時に入る内容です。画面から自由に編集できます。
 * ============================================================
 */

import type { Goal, LiveEvent, Member, SnsAccount, Song, Video } from '../types';

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'm-yuma',
    name: '悠真',
    reading: 'ゆうま',
    role: 'キーボード / ボーカル',
    height: 178,
    birthday: '2006-11-07',
    color: 'from-[#5b8cff] to-[#3b5bdb]',
    note: '黒髪ショート、茶色の瞳、穏やかな笑顔',
  },
  {
    id: 'm-aoi',
    name: '葵',
    reading: 'あおい',
    role: 'ギター / ボーカル',
    height: 162,
    birthday: '2007-04-05',
    color: 'from-[#f59e0b] to-[#d97706]',
    note: '明るい茶色のボブ、赤いリボン、ウインクした笑顔',
  },
  {
    id: 'm-ren',
    name: '蓮',
    reading: 'れん',
    role: 'ギター / コーラス',
    height: 170,
    birthday: '2006-08-10',
    color: 'from-[#3ecf8e] to-[#0f9d63]',
    note: '茶髪センターパート、さわやかな笑顔',
  },
  {
    id: 'm-yui',
    name: '結衣',
    reading: 'ゆい',
    role: 'メインボーカル',
    height: 158,
    birthday: '2007-03-08',
    color: 'from-[#ec4899] to-[#be185d]',
    note: '黒髪ロング、青いヘアバンド、丸い茶色の瞳',
  },
  {
    id: 'm-daichi',
    name: '大地',
    reading: 'だいち',
    role: 'ドラム',
    height: 172,
    birthday: '2007-01-05',
    color: 'from-[#a06bff] to-[#7c3aed]',
    note: '茶髪、元気で明るい表情',
  },
  {
    id: 'm-mikoto',
    name: '月城 美琴',
    reading: 'つきしろ みこと',
    role: '',
    height: 160,
    birthday: '2007-10-12',
    color: 'from-[#c026d3] to-[#f472b6]',
    note: '黒髪ポニーテール、和柄の髪飾り、明るく元気な笑顔。和装衣装が似合う。',
  },
];

export const DEFAULT_LIVES: LiveEvent[] = [];
export const DEFAULT_SONGS: Song[] = [];
export const DEFAULT_VIDEOS: Video[] = [];

export const DEFAULT_SNS: SnsAccount[] = [
  { id: 's-x',  platform: 'X',         handle: '', url: '', followers: 0, updatedAt: '' },
  { id: 's-ig', platform: 'Instagram', handle: '', url: '', followers: 0, updatedAt: '' },
  { id: 's-tt', platform: 'TikTok',    handle: '', url: '', followers: 0, updatedAt: '' },
  { id: 's-yt', platform: 'YouTube',   handle: '', url: '', followers: 0, updatedAt: '' },
];

export const DEFAULT_GOALS: Goal[] = [];

/** 年齢を誕生日から求めます */
export function calcAge(birthday: string): number | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  if (Number.isNaN(b.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

/** 次の誕生日まで何日か */
export function daysToBirthday(birthday: string): number | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  if (Number.isNaN(b.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
  if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());

  return Math.round((next.getTime() - today.getTime()) / 86400000);
}
