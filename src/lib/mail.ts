/**
 * ============================================================
 *  DayDream Mail — 初期データと送信処理
 * ============================================================
 */

import type { Contact, MailSettings, MailTemplate } from '../types';

/** メンバーの署名 */
export const MEMBER_SIGNS: { id: string; name: string; sign: string }[] = [
  { id: 'yuma',   name: '悠真', sign: 'DayDream➕ 悠真\nいつも応援ありがとうございます。' },
  { id: 'aoi',    name: '葵',   sign: 'DayDream➕ 葵\n次のライブでも会えるのを楽しみにしてます！' },
  { id: 'ren',    name: '蓮',   sign: 'DayDream➕ 蓮\nまた次の曲でお会いしましょう。' },
  { id: 'yui',    name: '結衣', sign: 'DayDream➕ 結衣\n聴いてくれてありがとうございます♪' },
  { id: 'daichi', name: '大地', sign: 'DayDream➕ 大地\n最後まで読んでくれてありがとう！' },
  { id: 'mikoto', name: '美琴', sign: 'DayDream➕ 月城美琴\nまたお会いできますように。' },
  { id: 'all',    name: 'メンバー一同', sign: 'DayDream➕ メンバー一同\n悠真 / 葵 / 蓮 / 結衣 / 大地 / 美琴' },
];

/** 最初から入っているひな形 */
export const DEFAULT_TEMPLATES: MailTemplate[] = [
  {
    id: 't1',
    name: 'ライブ告知',
    subject: '【DayDream➕】{{イベント名}} 開催のお知らせ',
    body: '{{名前}} 様\n\nいつも DayDream➕ を応援いただきありがとうございます。\n\nこの度、下記の日程でライブを開催いたします。\n\n──────────────\n■ 公演名：\n■ 日 時：\n■ 会 場：\n■ 料 金：\n──────────────\n\n皆さまにお会いできるのを楽しみにしております。',
  },
  {
    id: 't2',
    name: '新曲・MV公開',
    subject: '【DayDream➕】新曲「{{曲名}}」公開しました',
    body: '{{名前}} 様\n\n新曲を公開しました。\nMV も同時公開しております。ぜひご覧ください。\n\n▼ 視聴はこちら\n\nご感想をお聞かせいただけると嬉しいです。',
  },
  {
    id: 't3',
    name: 'グッズ販売',
    subject: '【DayDream➕】新グッズ販売開始のお知らせ',
    body: '{{名前}} 様\n\n新しいグッズの販売を開始いたしました。\n\n■ 商品：\n■ 価格：\n■ 販売期間：\n\n数に限りがございますので、お早めにどうぞ。',
  },
  {
    id: 't4',
    name: 'ライブ後のお礼',
    subject: '【DayDream➕】ご来場ありがとうございました',
    body: '{{名前}} 様\n\n先日のライブへお越しいただき、誠にありがとうございました。\n\n皆さまの声援のおかげで、最高の一日になりました。\n\nまた次の機会にお会いできますよう、メンバー一同精進してまいります。',
  },
  {
    id: 't5',
    name: 'スタッフ連絡',
    subject: '【業務連絡】',
    body: '{{名前}} さん\n\nお疲れさまです。\n\n\n\n以上、ご確認よろしくお願いいたします。',
  },
];

export const DEFAULT_CONTACTS: Contact[] = [];

export const DEFAULT_MAIL_SETTINGS: MailSettings = {
  fromName: 'DayDream➕',
  fromEmail: '',
  apiEndpoint: '',
  unsubUrl: '',
  ngWords: '',
};

export const GROUP_LABEL: Record<string, string> = {
  fan: 'ファン',
  staff: 'スタッフ',
  friend: '友人',
};

export const GROUP_STYLE: Record<string, string> = {
  fan: 'bg-dd-accent/20 text-[#9db8ff]',
  staff: 'bg-[#a06bff]/20 text-[#c9a6ff]',
  friend: 'bg-dd-ok/20 text-[#7ee5b6]',
};

/** {{名前}} などを実際の値に置き換えます */
export function mergeFields(text: string, contact?: Contact): string {
  if (!text) return '';
  return text
    .replace(/\{\{名前\}\}/g, contact?.name ?? '')
    .replace(/\{\{会員番号\}\}/g, contact?.memberNo ?? '')
    .replace(/\{\{メール\}\}/g, contact?.email ?? '');
}

/** NGワードが含まれていないか調べます */
export function findNgWords(text: string, ngWords: string): string[] {
  const list = ngWords.split(',').map((w) => w.trim()).filter(Boolean);
  return list.filter((w) => text.includes(w));
}

/** メールアドレスの形が正しいか */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ============================================================
   送信処理
   ============================================================ */

export interface SendResult {
  ok: boolean;
  simulated: boolean;
  error?: string;
  sent?: number;
}

export interface Recipient {
  email: string;
  name?: string;
  subject?: string;
  body?: string;
}

/**
 * メールを送信します。
 * 送信APIが未設定の場合は、実際には送らずに成功を返します
 * （シミュレーションモード）。
 */
export async function sendMail(
  settings: MailSettings,
  recipients: Recipient[],
  subject: string,
  body: string,
): Promise<SendResult> {
  if (!settings.apiEndpoint) {
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, simulated: true, sent: recipients.length };
  }

  if (!settings.fromEmail) {
    return { ok: false, simulated: false, error: '送信元メールアドレスが未設定です' };
  }

  try {
    const res = await fetch(settings.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${settings.fromName} <${settings.fromEmail}>`,
        recipients,
        subject,
        body,
        unsubUrl: settings.unsubUrl,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        simulated: false,
        error: data?.error ?? `送信に失敗しました（${res.status}）`,
      };
    }

    return { ok: true, simulated: false, sent: data?.sent ?? recipients.length };
  } catch (e) {
    return {
      ok: false,
      simulated: false,
      error: e instanceof Error ? e.message : '通信に失敗しました',
    };
  }
}
