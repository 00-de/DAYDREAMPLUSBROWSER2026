/**
 * ============================================================
 *  Clock — 時計と、時間帯に応じたメンバーの挨拶
 * ============================================================
 */

import { useEffect, useMemo, useState } from 'react';

/** 時間帯ごとの挨拶（DayDream➕ メンバー） */
const GREETINGS = [
  { from: 5, to: 10, member: '結衣', text: 'おはようございます。今日もいい一日になりますように。' },
  { from: 10, to: 14, member: '悠真', text: '午前の作業、順調ですか。無理のないペースで。' },
  { from: 14, to: 18, member: '葵', text: '午後もいきましょう！休憩も忘れずにね。' },
  { from: 18, to: 22, member: '大地', text: 'お疲れさまです！今日はどこまで進みましたか。' },
  { from: 22, to: 29, member: '蓮', text: '遅くまでお疲れさまです。そろそろ休みましょう。' },
];

function pickGreeting(hour: number) {
  const h = hour < 5 ? hour + 24 : hour;
  return GREETINGS.find((g) => h >= g.from && h < g.to) ?? GREETINGS[0];
}

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const greeting = useMemo(() => pickGreeting(hour), [hour]);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return (
    <div className="text-center">
      <div className="font-mono text-[58px] font-light leading-none tracking-[0.06em] tabular-nums">
        {hh}
        <span className="animate-pulse text-dd-muted">:</span>
        {mm}
        <span className="text-[30px] text-dd-muted">:{ss}</span>
      </div>

      <div className="mt-2 text-[12px] text-dd-muted">
        {now.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })}
      </div>

      <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-dd-accent to-dd-accent2 text-[11px] font-bold">
          {greeting.member.slice(0, 1)}
        </span>
        <span className="text-[12px] text-dd-text/90">{greeting.text}</span>
      </div>
    </div>
  );
}
