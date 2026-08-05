/**
 * ============================================================
 *  状態の表示スタイル
 * ============================================================
 */

export const STATUS_STYLE: Record<string, string> = {
  planned:   'bg-white/10 text-dd-muted',
  confirmed: 'bg-dd-accent/20 text-[#9db8ff]',
  done:      'bg-dd-ok/20 text-[#7ee5b6]',
  canceled:  'bg-dd-ng/20 text-[#ffaab0]',
  idea:      'bg-white/10 text-dd-muted',
  writing:   'bg-dd-warn/20 text-[#ffd39b]',
  recording: 'bg-dd-accent/20 text-[#9db8ff]',
  mixing:    'bg-[#a06bff]/20 text-[#c9a6ff]',
  released:  'bg-dd-ok/20 text-[#7ee5b6]',
  shooting:  'bg-dd-warn/20 text-[#ffd39b]',
  editing:   'bg-[#a06bff]/20 text-[#c9a6ff]',
};

export const STATUS_LABEL: Record<string, string> = {
  planned: '予定', confirmed: '確定', done: '終了', canceled: '中止',
  idea: '構想', writing: '制作中', recording: '録音中', mixing: 'ミックス', released: '公開済み',
  shooting: '撮影中', editing: '編集中',
};

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[12.5px] outline-none transition focus:border-dd-accent';
