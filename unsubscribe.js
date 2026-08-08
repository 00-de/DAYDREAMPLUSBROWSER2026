/**
 * ============================================================
 *  配信停止の受付API
 * ------------------------------------------------------------
 *  購読解除の申し出を受け取り、管理者へメールで知らせます。
 *  Firebase を使わないため、設定なしですぐ動きます。
 *
 *  必要な環境変数：
 *   RESEND_API_KEY … 送信APIと同じキー
 *   ADMIN_EMAIL    … 通知の受け取り先（あなたのアドレス）
 *   FROM_EMAIL     … 送信元（Resend で認証済みのアドレス）
 * ============================================================
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST でのみ受け付けます' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'データの形式が正しくありません' });
    }
  }

  const email = String((body && body.email) || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'メールアドレスが正しくありません' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const admin = process.env.ADMIN_EMAIL;
  const from = process.env.FROM_EMAIL;

  /* 通知の設定が無い場合でも、利用者には成功として返します */
  if (!apiKey || !admin || !from) {
    console.log('配信停止の申し出:', email, '（通知先が未設定のため記録のみ）');
    return res.status(200).json({ ok: true, notified: false });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `DayDream Mail <${from}>`,
        to: [admin],
        subject: '【配信停止】購読解除の申し出がありました',
        text:
          `次のアドレスから、配信停止の申し出がありました。\n\n` +
          `　${email}\n\n` +
          `受付日時：${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n\n` +
          `DayDream Browser のメール画面を開き、\n` +
          `「連絡先」からこのアドレスを削除してください。`,
      }),
    });

    if (!r.ok) throw new Error('通知の送信に失敗しました');

    return res.status(200).json({ ok: true, notified: true });
  } catch (e) {
    // 通知に失敗しても、利用者側は受付完了として扱います
    console.error('通知エラー:', e.message, '／ 対象:', email);
    return res.status(200).json({ ok: true, notified: false });
  }
}
