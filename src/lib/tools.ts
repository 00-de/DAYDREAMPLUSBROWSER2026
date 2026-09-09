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
  { id: 'service', label: 'サービス' },
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
  { id: 'ddsite',       name: 'ファンサイト',     category: 'daydream', icon: '★', color: 'from-[#5b8cff] to-[#a06bff]', url: 'https://daydreamplusfunsite-2026.vercel.app' },
  { id: 'ddadmin',      name: '管理システム',     category: 'daydream', icon: '⚙', color: 'from-[#a06bff] to-[#5b8cff]', url: 'https://daysreamplussystem-2026.vercel.app/' },
  { id: 'ddchat',       name: 'DDCHAT',          category: 'daydream', icon: '✉', color: 'from-[#5b8cff] to-[#7c3aed]', url: 'https://ddchat-1s39.vercel.app/' },
  { id: 'ddlight',      name: 'ペンライト',       category: 'daydream', icon: '❋', color: 'from-[#22d3ee] to-[#0891b2]', url: 'https://daydreampenlight-2026.vercel.app/' },
  { id: 'ddlightAdmin', name: 'ペンライト管理',   category: 'daydream', icon: '❈', color: 'from-[#0891b2] to-[#155e75]', url: 'https://penlightkanrisyadaysreamplus-2026.vercel.app/admin.html' },
  { id: 'ddlottery',    name: '抽選アプリ',       category: 'daydream', icon: '◎', color: 'from-[#ec4899] to-[#be185d]', url: 'https://livetyusenapp.vercel.app/' },
  { id: 'ddlotteryAdmin', name: '抽選管理',       category: 'daydream', icon: '◉', color: 'from-[#be185d] to-[#831843]', url: 'https://tyuusenappsystem.vercel.app/' },

  /* ---------- 制作 ---------- */
  { id: 'canva',    name: 'Canva',         category: 'media', icon: '▣', color: 'from-[#00c4cc] to-[#7d2ae8]', url: 'https://www.canva.com' },
  { id: 'capcut',   name: 'CapCut',        category: 'media', icon: '✂', color: 'from-[#111827] to-[#374151]', url: 'https://www.capcut.com' },
  { id: 'ytstudio', name: 'YouTube Studio',category: 'media', icon: '▶', color: 'from-[#ff0000] to-[#b91c1c]', url: 'https://studio.youtube.com' },

  /* ---------- SNS ---------- */
  { id: 'x',        name: 'X',             category: 'sns', icon: '𝕏', color: 'from-[#1f2937] to-[#000000]', url: 'https://x.com' },
  { id: 'instagram',name: 'Instagram',     category: 'sns', icon: '◙', color: 'from-[#f97316] to-[#c026d3]', url: 'https://www.instagram.com' },
  { id: 'tiktok',   name: 'TikTok',        category: 'sns', icon: '♫', color: 'from-[#0ea5e9] to-[#e11d48]', url: 'https://www.tiktok.com' },

  /* ---------- サービス ---------- */
  { id: 'onamae',   name: 'お名前.com',        category: 'service', icon: '◆', color: 'from-[#e11d48] to-[#9f1239]', url: 'https://navi.onamae.com/login' },
  { id: 'resend',   name: 'Resend',           category: 'service', icon: '✉', color: 'from-[#374151] to-[#0b0f1a]', url: 'https://resend.com/emails' },
  { id: 'tavily',   name: 'Tavily',           category: 'service', icon: '◇', color: 'from-[#0ea5e9] to-[#0369a1]', url: 'https://app.tavily.com' },
  { id: 'gcloud',   name: 'Google Cloud 請求', category: 'service', icon: '△', color: 'from-[#4285f4] to-[#1a73e8]', url: 'https://console.cloud.google.com/billing/01A90E-6FA6D7-2C79C1?project=daysreamsystem2026-500423' },
  { id: 'dojoclip', name: '動画圧縮',          category: 'service', icon: '▽', color: 'from-[#8b5cf6] to-[#6d28d9]', url: 'https://dojoclip.com/ja/video-compressor' },
];

/** 初期のお気に入り（初回起動時のみ使用） */
export const DEFAULT_FAVORITES = ['claude', 'github', 'vercel', 'firebase', 'suno', 'ddsite'];

/** id からツールを引く */
export function findTool(id: string): Tool | undefined {
  return TOOLS.find((t) => t.id === id);
}
