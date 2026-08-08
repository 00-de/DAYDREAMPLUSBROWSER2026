/**
 * ============================================================
 *  背景テーマ
 * ------------------------------------------------------------
 *  単色24色・グラデーション・画像の3種類に対応します。
 * ============================================================
 */

/** 背景の設定 */
export interface Background {
  /** 種類 */
  kind: 'solid' | 'gradient' | 'image';
  /** 選んだテーマの id（画像の場合は 'custom'） */
  id: string;
  /** 画像の場合の URL または data URL */
  imageUrl?: string;
  /** 画像の上にかける暗さ（0〜80） */
  dim?: number;
  /** 画像のぼかし（0〜20 px） */
  blur?: number;
}

export const DEFAULT_BACKGROUND: Background = {
  kind: 'gradient',
  id: 'dawn',
  dim: 40,
  blur: 0,
};

/* ============================================================
   単色 24 色
   ------------------------------------------------------------
   すべて暗めの色にしています。文字が読みにくくならないためです。
   ============================================================ */

export interface SolidTheme {
  id: string;
  name: string;
  /** 背景色 */
  color: string;
  /** パネルの色 */
  panel: string;
  /** 明るい背景かどうか。true のとき文字色を暗くします。 */
  light?: boolean;
}

export const SOLID_THEMES: SolidTheme[] = [
  { id: 'midnight',  name: '真夜中',   color: '#0b0f1a', panel: '#141a2b' },
  { id: 'charcoal',  name: '炭',       color: '#141416', panel: '#1f1f23' },
  { id: 'graphite',  name: '黒鉛',     color: '#1a1c20', panel: '#26292f' },
  { id: 'navy',      name: '紺',       color: '#0d1526', panel: '#182136' },
  { id: 'ocean',     name: '深海',     color: '#08202e', panel: '#0f2f42' },
  { id: 'teal',      name: '青緑',     color: '#0a2220', panel: '#123330' },
  { id: 'forest',    name: '深緑',     color: '#0d1f14', panel: '#152e1f' },
  { id: 'moss',      name: '苔',       color: '#161d13', panel: '#222b1d' },
  { id: 'olive',     name: 'オリーブ', color: '#1c1d10', panel: '#2a2b1a' },
  { id: 'sand',      name: '砂',       color: '#221c12', panel: '#31281c' },
  { id: 'coffee',    name: '珈琲',     color: '#1d1512', panel: '#2b201b' },
  { id: 'brick',     name: '煉瓦',     color: '#231310', panel: '#341c18' },
  { id: 'wine',      name: 'ワイン',   color: '#1f0e16', panel: '#2e1622' },
  { id: 'plum',      name: '梅',       color: '#1b1024', panel: '#291a34' },
  { id: 'violet',    name: '菫',       color: '#170f2b', panel: '#231a3d' },
  { id: 'indigo',    name: '藍',       color: '#101430', panel: '#1a2044' },
  { id: 'royal',     name: '瑠璃',     color: '#0c1436', panel: '#161f4b' },
  { id: 'steel',     name: '鋼',       color: '#151a1f', panel: '#20272e' },
  { id: 'slate',     name: '石板',     color: '#181b1e', panel: '#24282d' },
  { id: 'ash',       name: '灰',       color: '#1e1e20', panel: '#2b2b2f' },
  { id: 'cocoa',     name: 'ココア',   color: '#1a1512', panel: '#28211c' },
  { id: 'rosewood',  name: '紫檀',     color: '#211417', panel: '#311e23' },
  { id: 'emerald',   name: '翠玉',     color: '#08201a', panel: '#0f3026' },
  { id: 'space',     name: '宇宙',     color: '#06070d', panel: '#101219' },

  /* ---------- 明るい色（24色） ---------- */
  { id: 'pureWhite',  name: '白',         color: '#ffffff', panel: '#f2f4f8', light: true },
  { id: 'snow',       name: '雪',         color: '#f8fafc', panel: '#eaeef5', light: true },
  { id: 'ivory',      name: '象牙',       color: '#fdfaf2', panel: '#f4efe2', light: true },
  { id: 'pearl',      name: '真珠',       color: '#f6f4f8', panel: '#ece8f0', light: true },
  { id: 'skyBlue',    name: '水色',       color: '#e3f2fd', panel: '#d0e7fa', light: true },
  { id: 'aqua',       name: 'アクア',     color: '#dff5f7', panel: '#c9ecef', light: true },
  { id: 'powderBlue', name: '空',         color: '#dbeafe', panel: '#c6ddfb', light: true },
  { id: 'iceBlue',    name: '氷水',       color: '#eaf4fb', panel: '#d8ebf6', light: true },
  { id: 'mintCream',  name: 'ミント',     color: '#e0f7ef', panel: '#caf0e2', light: true },
  { id: 'pistachio',  name: '若草',       color: '#e8f6dd', panel: '#d8efc7', light: true },
  { id: 'lemon',      name: 'レモン',     color: '#fdf6d8', panel: '#f8eeba', light: true },
  { id: 'apricot',    name: '杏',         color: '#fdeede', panel: '#fbe0c6', light: true },
  { id: 'peach',      name: '桃',         color: '#fde8e4', panel: '#fbd6cf', light: true },
  { id: 'blossom',    name: '桜色',       color: '#fdeaf1', panel: '#fbd8e6', light: true },
  { id: 'lilac',      name: 'ライラック', color: '#f0e8fb', panel: '#e2d5f8', light: true },
  { id: 'lavender',   name: 'ラベンダー', color: '#e8e6fb', panel: '#d8d5f8', light: true },
  { id: 'wisteria',   name: '藤',         color: '#eee9f7', panel: '#e0d8f1', light: true },
  { id: 'linen',      name: '麻',         color: '#f6f1e8', panel: '#ece4d6', light: true },
  { id: 'greige',     name: 'グレージュ', color: '#f2efe9', panel: '#e6e1d8', light: true },
  { id: 'silver',     name: '銀',         color: '#eef1f4', panel: '#e0e5ea', light: true },
  { id: 'fog',        name: '霧',         color: '#eaecef', panel: '#dcdfe4', light: true },
  { id: 'cloud',      name: '雲',         color: '#f4f6f9', panel: '#e7eaef', light: true },
  { id: 'sandBeige',  name: '砂浜',       color: '#faf3e6', panel: '#f2e7d2', light: true },
  { id: 'shellPink',  name: '貝',         color: '#fbeeee', panel: '#f7dede', light: true },
];

/* ============================================================
   グラデーション
   ============================================================ */

export interface GradientTheme {
  id: string;
  name: string;
  /** CSS の background 指定 */
  css: string;
  /** 下地の色 */
  base: string;
  panel: string;
  /** 明るい背景かどうか。true のとき文字色を暗くします。 */
  light?: boolean;
}

export const GRADIENT_THEMES: GradientTheme[] = [
  {
    id: 'dawn',
    name: '夜明け',
    base: '#0b0f1a',
    panel: '#141a2b',
    css: 'radial-gradient(1200px 700px at 10% -10%, #21306b 0%, transparent 60%), radial-gradient(900px 600px at 100% 0%, #4a2273 0%, transparent 55%)',
  },
  {
    id: 'sunset',
    name: '夕焼け',
    base: '#150d14',
    panel: '#231824',
    css: 'radial-gradient(1100px 700px at 15% -5%, #7a2b4a 0%, transparent 58%), radial-gradient(900px 600px at 95% 10%, #8a4520 0%, transparent 55%)',
  },
  {
    id: 'aurora',
    name: 'オーロラ',
    base: '#07141a',
    panel: '#10232c',
    css: 'radial-gradient(1000px 700px at 20% 0%, #0f6b63 0%, transparent 58%), radial-gradient(900px 600px at 90% 20%, #2c4a8a 0%, transparent 55%)',
  },
  {
    id: 'sakura',
    name: '桜',
    base: '#160f14',
    panel: '#251a22',
    css: 'radial-gradient(1100px 700px at 12% -8%, #7d2f52 0%, transparent 58%), radial-gradient(850px 600px at 95% 5%, #5a3a7a 0%, transparent 55%)',
  },
  {
    id: 'ocean',
    name: '大海',
    base: '#061620',
    panel: '#0e2534',
    css: 'radial-gradient(1200px 800px at 30% -10%, #0d4a6b 0%, transparent 60%), radial-gradient(900px 600px at 100% 30%, #123a5c 0%, transparent 55%)',
  },
  {
    id: 'forest',
    name: '森',
    base: '#0a1710',
    panel: '#13251a',
    css: 'radial-gradient(1000px 700px at 15% 0%, #1c5233 0%, transparent 58%), radial-gradient(900px 600px at 95% 25%, #2a4a20 0%, transparent 55%)',
  },
  {
    id: 'ember',
    name: '熾火',
    base: '#140b08',
    panel: '#231512',
    css: 'radial-gradient(1000px 700px at 25% -5%, #8a3a15 0%, transparent 55%), radial-gradient(800px 600px at 90% 15%, #6b1f2a 0%, transparent 55%)',
  },
  {
    id: 'nebula',
    name: '星雲',
    base: '#0a0714',
    panel: '#181228',
    css: 'radial-gradient(1100px 750px at 20% -10%, #4a2a8a 0%, transparent 58%), radial-gradient(950px 650px at 95% 20%, #7a2a6b 0%, transparent 55%)',
  },
  {
    id: 'mint',
    name: 'ミント',
    base: '#071a16',
    panel: '#102a24',
    css: 'radial-gradient(1000px 700px at 18% 0%, #12665a 0%, transparent 58%), radial-gradient(900px 600px at 92% 20%, #2a6b6b 0%, transparent 55%)',
  },
  {
    id: 'gold',
    name: '黄金',
    base: '#161206',
    panel: '#251f10',
    css: 'radial-gradient(1000px 700px at 20% -5%, #6b5210 0%, transparent 58%), radial-gradient(850px 600px at 95% 15%, #7a3f12 0%, transparent 55%)',
  },
  {
    id: 'ice',
    name: '氷',
    base: '#0a1420',
    panel: '#152232',
    css: 'radial-gradient(1100px 750px at 15% -8%, #1f4a7a 0%, transparent 58%), radial-gradient(900px 600px at 95% 15%, #2a5c7a 0%, transparent 55%)',
  },
  {
    id: 'mono',
    name: '無彩',
    base: '#101012',
    panel: '#1c1c20',
    css: 'radial-gradient(1200px 800px at 20% -10%, #33343a 0%, transparent 60%), radial-gradient(900px 600px at 100% 10%, #26272c 0%, transparent 55%)',
  },

  /* ---------- 虹色（暗め） ---------- */
  {
    id: 'rainbow',
    name: '虹',
    base: '#0d0b16',
    panel: '#1b1828',
    css: 'radial-gradient(700px 500px at 5% 0%, #8a2b3a 0%, transparent 45%), radial-gradient(700px 500px at 30% 10%, #8a5a1a 0%, transparent 45%), radial-gradient(700px 500px at 55% 0%, #1a6b3a 0%, transparent 45%), radial-gradient(700px 500px at 80% 12%, #1a4a8a 0%, transparent 45%), radial-gradient(700px 500px at 100% 0%, #6b2a8a 0%, transparent 45%)',
  },
  {
    id: 'prism',
    name: 'プリズム',
    base: '#0a0c14',
    panel: '#171b28',
    css: 'linear-gradient(135deg, rgba(255,90,120,.30) 0%, rgba(255,180,80,.28) 22%, rgba(120,220,140,.26) 45%, rgba(90,160,255,.28) 70%, rgba(180,110,255,.30) 100%)',
  },

  /* ---------- 明るいグラデーション ---------- */
  {
    id: 'rainbowLight',
    name: '虹（淡）',
    base: '#ffffff',
    panel: '#f1f3f8',
    light: true,
    css: 'linear-gradient(135deg, rgba(255,150,170,.42) 0%, rgba(255,205,140,.40) 22%, rgba(175,235,185,.38) 45%, rgba(155,200,255,.40) 70%, rgba(215,175,255,.42) 100%)',
  },
  {
    id: 'pastelDream',
    name: 'パステル',
    base: '#fbfcff',
    panel: '#eef1f8',
    light: true,
    css: 'radial-gradient(900px 650px at 12% -5%, rgba(255,190,215,.55) 0%, transparent 58%), radial-gradient(850px 600px at 92% 8%, rgba(185,215,255,.55) 0%, transparent 55%), radial-gradient(800px 600px at 50% 100%, rgba(215,240,205,.45) 0%, transparent 55%)',
  },
  {
    id: 'skyMorning',
    name: '朝空',
    base: '#f4fafe',
    panel: '#e4eff8',
    light: true,
    css: 'radial-gradient(1100px 700px at 15% -8%, rgba(140,200,250,.60) 0%, transparent 58%), radial-gradient(900px 600px at 95% 10%, rgba(190,225,255,.55) 0%, transparent 55%)',
  },
  {
    id: 'sakuraLight',
    name: '桜（淡）',
    base: '#fefafc',
    panel: '#f6eaf1',
    light: true,
    css: 'radial-gradient(1000px 700px at 12% -5%, rgba(255,190,215,.60) 0%, transparent 58%), radial-gradient(850px 600px at 95% 8%, rgba(225,200,250,.50) 0%, transparent 55%)',
  },
  {
    id: 'lemonade',
    name: 'レモネード',
    base: '#fffdf5',
    panel: '#f6f1e0',
    light: true,
    css: 'radial-gradient(1000px 700px at 18% -5%, rgba(255,235,150,.55) 0%, transparent 58%), radial-gradient(850px 600px at 92% 12%, rgba(255,205,165,.50) 0%, transparent 55%)',
  },
  {
    id: 'freshMint',
    name: '若葉',
    base: '#f6fdfa',
    panel: '#e6f4ee',
    light: true,
    css: 'radial-gradient(1000px 700px at 15% 0%, rgba(150,225,195,.55) 0%, transparent 58%), radial-gradient(900px 600px at 95% 15%, rgba(180,225,240,.50) 0%, transparent 55%)',
  },
  {
    id: 'paper',
    name: '紙',
    base: '#fbfaf7',
    panel: '#efece5',
    light: true,
    css: 'radial-gradient(1200px 800px at 20% -10%, rgba(225,215,195,.50) 0%, transparent 60%), radial-gradient(900px 600px at 100% 10%, rgba(235,230,220,.55) 0%, transparent 55%)',
  },
];

/* ============================================================
   CSS への変換
   ============================================================ */

/**
 * #1a2b3c のような色を "26 43 60" の形に変換します。
 * Tailwind の透明度指定（bg-dd-panel/95 など）で使うためです。
 */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** 背景設定から、実際に適用する CSS を作ります */
export function toCss(bg: Background): {
  background: string;
  backgroundColor: string;
  panel: string;
  /** 明るい背景かどうか */
  light: boolean;
} {
  if (bg.kind === 'solid') {
    const t = SOLID_THEMES.find((x) => x.id === bg.id) ?? SOLID_THEMES[0];
    return { background: 'none', backgroundColor: t.color, panel: t.panel, light: !!t.light };
  }

  if (bg.kind === 'image') {
    // 画像の場合は、上に暗い覆いをかけるため、常に暗い前提とします
    return { background: 'none', backgroundColor: '#0b0f1a', panel: '#141a2b', light: false };
  }

  const t = GRADIENT_THEMES.find((x) => x.id === bg.id) ?? GRADIENT_THEMES[0];
  return { background: t.css, backgroundColor: t.base, panel: t.panel, light: !!t.light };
}
