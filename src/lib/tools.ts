/**
 * ============================================================
 *  ツールカタログ
 * ------------------------------------------------------------
 *  ホーム画面・Dock から起動できるツールの一覧です。
 *  追加したいときは、このファイルに1行足すだけです。
 * ============================================================
 */

import type { Tool } from '../types';

export const CATEGORIES = [
  { id: 'ai', label: 'AI' },
  { id: 'dev', label: '開発' },
  { id: 'daydream', label: 'DayDream' },
  { id: 'media', label: '制作' },
  { id: 'sns', label: 'SNS' },
] as const;

export const TOOLS: Tool[] = [
  /* ---------- AI ---------- */
  { id: 'claude',   name: 'Claude',        category: 'ai',  icon: '✳',  color: 'from-[#d97757] to-[#b85c3e]', url: 'https://claude.ai' },
  { id: 'chatgpt',  name: 'ChatGPT',       category: 'ai',  icon: '◍',  color: 'from-[#10a37f] to-[#0d7d61]', url: 'https://chatgpt.com' },
  { id: 'genspark', name: 'Genspark',      category: 'ai',  icon: '✦',  color: 'from-[#6366f1] to-[#4338ca]', url: 'https://www.genspark.ai' },
  { id: 'suno',     name: 'SUNO',          category: 'ai',  icon: '♪',  color: 'from-[#f59e0b] to-[#d97706]', url: 'https://suno.com' },
  { id: 'openai',   name: 'OpenAI',        category: 'ai',  icon: '⌾',  color: 'from-[#4b5563] to-[#1f2937]', url: 'https://platform.openai.com' },
  { id: 'eleven',   name: 'ElevenLabs',    category: 'ai',  icon: '◑',  color: 'from-[#8b5cf6] to-[#6d28d9]', url: 'https://elevenlabs.io' },

  /* ---------- 開発 ---------- */
  { id: 'github',   name: 'GitHub',        category: 'dev', icon: '⌥',  color: 'from-[#4b5563] to-[#111827]', url: 'https://github.com' },
  { id: 'vercel',   name: 'Vercel',        category: 'dev', icon: '▲',  color: 'from-[#374151] to-[#0b0f1a]', url: 'https://vercel.com/dashboard' },
  { id: 'firebase', name: 'Firebase',      category: 'dev', icon: '◭',  color: 'from-[#ffa000] to-[#f57c00]', url: 'https://console.firebase.google.com' },
  { id: 'gdrive',   name: 'Google Drive',  category: 'dev', icon: '△',  color: 'from-[#4285f4] to-[#1a73e8]', url: 'https://drive.google.com' },

  /* ---------- DayDream ---------- */
  { id: 'ddsite',   name: 'ファンサイト',   category: 'daydream', icon: '★', color: 'from-[#5b8cff] to-[#a06bff]', url: 'https://daydreamplusfunsite-2026.vercel.app' },
  { id: 'ddadmin',  name: '管理システム',   category: 'daydream', icon: '⚙', color: 'from-[#a06bff] to-[#5b8cff]', url: 'https://daysreamplussystem-2026.vercel.app/' },
  { id: 'ddchat',   name: 'DDCHAT',        category: 'daydream', icon: '✉', color: 'from-[#5b8cff] to-[#7c3aed]', url: '' },
  { id: 'ddmail',   name: 'DayDream Mail', category: 'daydream', icon: '✎', color: 'from-[#6366f1] to-[#a06bff]', url: '' },
  { id: 'ddlottery',name: '抽選アプリ',     category: 'daydream', icon: '◎', color: 'from-[#ec4899] to-[#be185d]', url: '' },
  { id: 'ddlight',  name: 'ペンライト',     category: 'daydream', icon: '❋', color: 'from-[#22d3ee] to-[#0891b2]', url: '' },

  /* ---------- 制作 ---------- */
  { id: 'canva',    name: 'Canva',         category: 'media', icon: '▣', color: 'from-[#00c4cc] to-[#7d2ae8]', url: 'https://www.canva.com' },
  { id: 'capcut',   name: 'CapCut',        category: 'media', icon: '✂', color: 'from-[#111827] to-[#374151]', url: 'https://www.capcut.com' },
  { id: 'ytstudio', name: 'YouTube Studio',category: 'media', icon: '▶', color: 'from-[#ff0000] to-[#b91c1c]', url: 'https://studio.youtube.com' },

  /* ---------- SNS ---------- */
  { id: 'x',        name: 'X',             category: 'sns', icon: '𝕏', color: 'from-[#1f2937] to-[#000000]', url: 'https://x.com' },
  { id: 'instagram',name: 'Instagram',     category: 'sns', icon: '◙', color: 'from-[#f97316] to-[#c026d3]', url: 'https://www.instagram.com' },
  { id: 'tiktok',   name: 'TikTok',        category: 'sns', icon: '♫', color: 'from-[#0ea5e9] to-[#e11d48]', url: 'https://www.tiktok.com' },
];

/** 初期のお気に入り（初回起動時のみ使用） */
export const DEFAULT_FAVORITES = ['claude', 'github', 'vercel', 'firebase', 'suno', 'ddsite'];

/** id からツールを引く */
export function findTool(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}
