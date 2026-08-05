/**
 * ============================================================
 *  Dashboard で使う共通の部品
 * ============================================================
 */

import type { ReactNode } from 'react';
import { STATUS_LABEL, STATUS_STYLE } from '../lib/status';

/* ---------- 入力欄 ---------- */

interface FieldProps {
  label: string;
  children: ReactNode;
  wide?: boolean;
}

export function Field({ label, children, wide }: FieldProps) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <label className="mb-1 block text-[10.5px] text-dd-muted">{label}</label>
      {children}
    </div>
  );
}


/* ---------- 見出し ---------- */

interface SectionProps {
  title: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ title, count, action, children }: SectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[13px] font-bold">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9.5px] text-dd-muted">
            {count}
          </span>
        )}
        <span className="h-px flex-1 bg-white/10" />
        {action}
      </div>
      {children}
    </section>
  );
}

/* ---------- 空のときの案内 ---------- */

export function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-7 text-center text-[11.5px] text-dd-muted">
      {text}
    </p>
  );
}

/* ---------- 状態の色分け ---------- */



export function Badge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9.5px] ${STATUS_STYLE[status] ?? 'bg-white/10 text-dd-muted'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

/* ---------- 小さなボタン ---------- */

export function SmallButton({
  onClick,
  children,
  danger,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border border-white/10 px-2.5 py-1 text-[10.5px] transition hover:bg-white/10 ${
        danger ? 'text-dd-ng hover:bg-dd-ng/15' : ''
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- 追加ボタン ---------- */

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110"
    >
      ＋ {label}
    </button>
  );
}

/* ---------- 入力用の小窓 ---------- */

export function Modal({
  title,
  onClose,
  onSave,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] w-[min(520px,94vw)] overflow-y-auto rounded-2xl border border-white/10 bg-dd-panel p-6"
      >
        <h3 className="mb-4 text-[15px] font-bold">{title}</h3>

        <div className="mb-5 grid grid-cols-2 gap-3">{children}</div>

        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex-1 rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110"
          >
            保存する
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-5 py-2.5 text-[12.5px] transition hover:bg-white/10"
          >
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}
