/**
 * ============================================================
 *  Mail — DayDreamプラス専用メーラー
 * ------------------------------------------------------------
 *  8月8日・9日の作業内容：
 *    メール作成／連絡先管理／ひな形／一斉配信／
 *    差し込み文字／配信ログ／設定
 * ============================================================
 */

import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useDashboard';
import { useMailSettings } from '../hooks/useMailSettings';
import {
  DEFAULT_CONTACTS,
  DEFAULT_TEMPLATES,
  GROUP_LABEL,
  GROUP_STYLE,
  MEMBER_SIGNS,
  findNgWords,
  isValidEmail,
  mergeFields,
  sendMail,
} from '../lib/mail';
import { inputClass } from '../lib/status';
import { AddButton, Empty, Field, Modal, Section, SmallButton } from './DashboardParts';
import type { Contact, MailLog, MailRecord, MailTemplate } from '../types';

type TabId = 'compose' | 'campaign' | 'contacts' | 'templates' | 'sent' | 'log' | 'settings';

const TABS: { id: TabId; label: string }[] = [
  { id: 'compose', label: '作成' },
  { id: 'campaign', label: '一斉配信' },
  { id: 'contacts', label: '連絡先' },
  { id: 'templates', label: 'ひな形' },
  { id: 'sent', label: '送信済み' },
  { id: 'log', label: '配信ログ' },
  { id: 'settings', label: '設定' },
];

type Draft = Record<string, string | number | boolean>;

export default function Mail() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('compose');

  const contacts = useCollection<Contact>('contacts', DEFAULT_CONTACTS, user);
  const templates = useCollection<MailTemplate>('templates', DEFAULT_TEMPLATES, user);
  const sent = useCollection<MailRecord>('sentMails', [], user);
  const logs = useCollection<MailLog>('mailLogs', [], user);
  const { settings, save: saveSettings } = useMailSettings(user);

  /* ---------- 単発メール ---------- */
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'ng' | 'warn'; text: string } | null>(null);

  /* ---------- 一斉配信 ---------- */
  const [kGroup, setKGroup] = useState<'all' | 'fan' | 'staff' | 'friend'>('fan');
  const [kFilter, setKFilter] = useState('');
  const [kSubject, setKSubject] = useState('');
  const [kBody, setKBody] = useState('');
  const [preview, setPreview] = useState(false);

  /* ---------- 編集用 ---------- */
  const [editing, setEditing] = useState<{ kind: string; id: string | null; draft: Draft } | null>(
    null,
  );

  /* ---------- 設定の下書き ---------- */
  const [sDraft, setSDraft] = useState(settings);
  const [sDirty, setSDirty] = useState(false);

  const val = (key: string): string | number => {
    const v = editing?.draft[key];
    if (typeof v === 'boolean') return String(v);
    return v ?? '';
  };

  const setDraft = (patch: Draft) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const notify = (type: 'ok' | 'ng' | 'warn', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /* ---------- 配信対象 ---------- */
  const targets = useMemo(
    () =>
      contacts.items.filter(
        (c) =>
          (kGroup === 'all' || c.group === kGroup) && (!kFilter || (c.note ?? '').includes(kFilter)),
      ),
    [contacts.items, kGroup, kFilter],
  );

  const groupCounts = useMemo(() => {
    const n = { fan: 0, staff: 0, friend: 0 };
    contacts.items.forEach((c) => {
      if (c.group in n) n[c.group] += 1;
    });
    return n;
  }, [contacts.items]);

  /* ---------- 記録を残す ---------- */
  const pushLog = (subj: string, count: number, status: string, ok: boolean) => {
    logs.commit([
      {
        id: 'L' + Date.now().toString(36),
        date: new Date().toLocaleString('ja-JP'),
        subject: subj,
        count,
        status,
        ok,
      },
      ...logs.items,
    ].slice(0, 100));
  };

  /* ---------- 単発送信 ---------- */
  const doSendSingle = async () => {
    if (!isValidEmail(to)) {
      notify('ng', '宛先のメールアドレスを正しく入力してください。');
      return;
    }
    if (!subject.trim()) {
      notify('ng', '件名を入力してください。');
      return;
    }

    const ng = findNgWords(subject + body, settings.ngWords);
    if (ng.length > 0) {
      notify('ng', `NGワードが含まれています：${ng.join('、')}`);
      return;
    }

    setBusy(true);
    const r = await sendMail(settings, [{ email: to.trim() }], subject, body);
    setBusy(false);

    if (r.ok) {
      sent.add({
        to: to.trim(),
        subject,
        body,
        date: new Date().toLocaleString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      pushLog(subject, 1, r.simulated ? 'シミュレーション' : '送信成功', true);
      notify('ok', r.simulated ? '（シミュレーション）送信しました。' : '送信しました。');
      setTo('');
      setSubject('');
      setBody('');
    } else {
      pushLog(subject, 1, `失敗: ${r.error}`, false);
      notify('ng', r.error ?? '送信に失敗しました。');
    }
  };

  /* ---------- 一斉配信 ---------- */
  const doSendCampaign = async () => {
    if (targets.length === 0) {
      notify('ng', '配信対象がいません。');
      return;
    }
    if (!kSubject.trim()) {
      notify('ng', '件名を入力してください。');
      return;
    }
    if (!kBody.trim()) {
      notify('ng', '本文を入力してください。');
      return;
    }

    const ng = findNgWords(kSubject + kBody, settings.ngWords);
    if (ng.length > 0) {
      notify('ng', `NGワードが含まれています：${ng.join('、')}`);
      return;
    }

    if (!settings.unsubUrl) {
      const go = window.confirm(
        '配信停止URLが未設定です。特定電子メール法により必須ですが、このまま送信しますか。',
      );
      if (!go) return;
    }

    const go = window.confirm(`${targets.length} 名に一斉配信します。よろしいですか。`);
    if (!go) return;

    const unsub = settings.unsubUrl
      ? `\n\n────────────\n配信停止はこちら：${settings.unsubUrl}`
      : '';

    const recipients = targets.map((c) => ({
      email: c.email,
      name: c.name,
      subject: mergeFields(kSubject, c),
      body: mergeFields(kBody, c) + unsub,
    }));

    setBusy(true);
    const r = await sendMail(settings, recipients, kSubject, kBody);
    setBusy(false);

    if (r.ok) {
      sent.add({
        to: `一斉配信（${targets.length}名）`,
        subject: kSubject,
        body: kBody,
        count: targets.length,
        date: new Date().toLocaleString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      pushLog(kSubject, targets.length, r.simulated ? 'シミュレーション' : '配信成功', true);
      notify(
        'ok',
        `${r.simulated ? '（シミュレーション）' : ''}${targets.length} 名への配信が完了しました。`,
      );
    } else {
      pushLog(kSubject, targets.length, `失敗: ${r.error}`, false);
      notify('ng', r.error ?? '配信に失敗しました。');
    }
  };

  /* ---------- ひな形の適用 ---------- */
  const applyTemplate = (id: string, forCampaign: boolean) => {
    const t = templates.items.find((x) => x.id === id);
    if (!t) return;
    if (forCampaign) {
      setKSubject(t.subject);
      setKBody(t.body);
    } else {
      setSubject(t.subject);
      setBody(t.body);
    }
  };

  /* ---------- 署名の挿入 ---------- */
  const insertSign = (signId: string, forCampaign: boolean) => {
    const m = MEMBER_SIGNS.find((x) => x.id === signId);
    if (!m) return;
    const text = `\n\n────────────\n${m.sign}\n`;
    if (forCampaign) setKBody((b) => b + text);
    else setBody((b) => b + text);
  };

  /* ---------- 編集の保存 ---------- */
  const saveEdit = () => {
    if (!editing) return;
    const { kind, id, draft } = editing;
    const target = kind === 'contact' ? contacts : templates;
    if (id) target.update(id, draft as never);
    else target.add(draft as never);
    setEditing(null);
  };

  const live = settings.apiEndpoint.length > 0;

  return (
    <div className="mx-auto w-full max-w-5xl animate-rise px-8 pb-28 pt-8">
      {/* ---------- 見出し ---------- */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-dd-accent to-dd-accent2 text-xl shadow-[0_8px_28px_rgba(91,140,255,.4)]">
          ✉
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-extrabold">DayDream Mail</h1>
          <p className="text-[11px] text-dd-muted">
            {user ? 'クラウドに保存されています' : 'この PC に保存されています'}
          </p>
        </div>
        <span
          className={`flex-none rounded-full px-2.5 py-1 text-[10px] ${
            live ? 'bg-dd-ok/20 text-[#7ee5b6]' : 'bg-white/10 text-dd-muted'
          }`}
        >
          {live ? '本番送信モード' : 'シミュレーション'}
        </span>
      </div>

      {/* ---------- 送信未設定の案内 ---------- */}
      {!live && (
        <div className="mb-5 rounded-xl border border-dd-warn/30 bg-dd-warn/10 px-4 py-3 text-[11.5px] leading-relaxed text-dd-muted">
          送信APIが未設定のため、<b>実際のメールは送信されません</b>。
          操作の練習や下書きの作成には、そのままお使いいただけます。
          実際に送るには、設定タブでエンドポイントURLを登録してください。
        </div>
      )}

      {/* ---------- 通知 ---------- */}
      {message && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-[12px] leading-relaxed ${
            message.type === 'ok'
              ? 'border-dd-ok/30 bg-dd-ok/10 text-[#a5e9cb]'
              : message.type === 'ng'
                ? 'border-dd-ng/30 bg-dd-ng/10 text-[#ffaab0]'
                : 'border-dd-warn/30 bg-dd-warn/10 text-[#ffd39b]'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ---------- タブ ---------- */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-[11.5px] transition ${
              tab === t.id
                ? 'bg-white/[0.14] text-dd-text'
                : 'text-dd-muted hover:bg-white/[0.07] hover:text-dd-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ 作成 ============ */}
      {tab === 'compose' && (
        <Section title="メールを作成">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">連絡先から選ぶ</label>
                <select
                  className={inputClass}
                  value=""
                  onChange={(e) => e.target.value && setTo(e.target.value)}
                >
                  <option value="">— 選んでください —</option>
                  {contacts.items.map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.name}（{GROUP_LABEL[c.group]}）
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">宛先</label>
                <input
                  className={inputClass}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">ひな形</label>
                <select
                  className={inputClass}
                  value=""
                  onChange={(e) => e.target.value && applyTemplate(e.target.value, false)}
                >
                  <option value="">— 使わない —</option>
                  {templates.items.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">件名</label>
                <input
                  className={inputClass}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10.5px] text-dd-muted">本文</label>
              <textarea
                rows={12}
                className={`${inputClass} leading-relaxed`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="ここに本文を入力してください。"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10.5px] text-dd-muted">署名を挿入</label>
              <div className="flex flex-wrap gap-1.5">
                {MEMBER_SIGNS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => insertSign(m.id, false)}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] transition hover:bg-white/[0.12]"
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={doSendSingle}
              disabled={busy}
              className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-5 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              {busy ? '送信中…' : '送信する'}
            </button>
          </div>
        </Section>
      )}

      {/* ============ 一斉配信 ============ */}
      {tab === 'campaign' && (
        <>
          <div className="mb-5 rounded-xl border border-dd-warn/30 bg-dd-warn/10 px-4 py-3 text-[11.5px] leading-relaxed text-dd-muted">
            配信停止（購読解除）リンクは、特定電子メール法により必須です。
            設定タブでURLを登録してください。
          </div>

          <Section title="1. 配信対象">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">区分</label>
                <select
                  className={inputClass}
                  value={kGroup}
                  onChange={(e) => setKGroup(e.target.value as typeof kGroup)}
                >
                  <option value="all">すべて（{contacts.items.length} 名）</option>
                  <option value="fan">ファンのみ（{groupCounts.fan} 名）</option>
                  <option value="staff">スタッフのみ（{groupCounts.staff} 名）</option>
                  <option value="friend">友人のみ（{groupCounts.friend} 名）</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">
                  メモで絞り込む（任意）
                </label>
                <input
                  className={inputClass}
                  value={kFilter}
                  onChange={(e) => setKFilter(e.target.value)}
                  placeholder="例：常連"
                />
              </div>
            </div>
            <p className="mt-2.5 text-[11.5px] text-dd-muted">
              配信対象：<b className="text-dd-accent">{targets.length}</b> 名
            </p>
          </Section>

          <Section title="2. 内容">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10.5px] text-dd-muted">ひな形</label>
                  <select
                    className={inputClass}
                    value=""
                    onChange={(e) => e.target.value && applyTemplate(e.target.value, true)}
                  >
                    <option value="">— 使わない —</option>
                    {templates.items.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10.5px] text-dd-muted">件名</label>
                  <input
                    className={inputClass}
                    value={kSubject}
                    onChange={(e) => setKSubject(e.target.value)}
                    placeholder="【DayDream➕】…"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[10.5px] text-dd-muted">
                  本文（{'{{名前}}'} {'{{会員番号}}'} が使えます）
                </label>
                <textarea
                  rows={12}
                  className={`${inputClass} leading-relaxed`}
                  value={kBody}
                  onChange={(e) => setKBody(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10.5px] text-dd-muted">署名を挿入</label>
                <div className="flex flex-wrap gap-1.5">
                  {MEMBER_SIGNS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => insertSign(m.id, true)}
                      className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] transition hover:bg-white/[0.12]"
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPreview(true)}
                  disabled={targets.length === 0}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-[12.5px] transition hover:bg-white/10 disabled:opacity-40"
                >
                  差し込みを確認
                </button>
                <button
                  onClick={doSendCampaign}
                  disabled={busy || targets.length === 0}
                  className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-5 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                >
                  {busy ? '配信中…' : '一斉配信する'}
                </button>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ============ 連絡先 ============ */}
      {tab === 'contacts' && (
        <Section
          title="連絡先"
          count={contacts.items.length}
          action={
            <AddButton
              onClick={() =>
                setEditing({
                  kind: 'contact',
                  id: null,
                  draft: { name: '', email: '', group: 'fan', memberNo: '', note: '' },
                })
              }
              label="追加"
            />
          }
        >
          <p className="mb-3 text-[11px] text-dd-muted">
            ファン {groupCounts.fan} 名 ／ スタッフ {groupCounts.staff} 名 ／ 友人{' '}
            {groupCounts.friend} 名
          </p>

          {contacts.items.length === 0 ? (
            <Empty text="連絡先を追加してください" />
          ) : (
            <div className="space-y-2">
              {contacts.items.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3"
                >
                  <span
                    className={`flex-none rounded-full px-2 py-0.5 text-[9.5px] ${GROUP_STYLE[c.group]}`}
                  >
                    {GROUP_LABEL[c.group]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold">{c.name}</div>
                    <div className="truncate text-[10.5px] text-dd-muted">{c.email}</div>
                  </div>
                  {c.memberNo && (
                    <span className="flex-none font-mono text-[10px] text-dd-muted">
                      {c.memberNo}
                    </span>
                  )}
                  <div className="flex flex-none gap-1.5">
                    <SmallButton onClick={() => setEditing({ kind: 'contact', id: c.id, draft: { ...c } as unknown as Draft })}>
                      編集
                    </SmallButton>
                    <SmallButton onClick={() => contacts.remove(c.id)} danger>
                      削除
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ============ ひな形 ============ */}
      {tab === 'templates' && (
        <Section
          title="ひな形"
          count={templates.items.length}
          action={
            <AddButton
              onClick={() =>
                setEditing({ kind: 'template', id: null, draft: { name: '', subject: '', body: '' } })
              }
              label="追加"
            />
          }
        >
          <p className="mb-3 text-[11px] text-dd-muted">
            {'{{名前}}'} {'{{会員番号}}'} は、送信時に自動で置き換わります。
          </p>

          <div className="space-y-2.5">
            {templates.items.map((t) => (
              <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="flex-1 text-[13px] font-bold">{t.name}</h3>
                  <SmallButton onClick={() => setEditing({ kind: 'template', id: t.id, draft: { ...t } as unknown as Draft })}>
                    編集
                  </SmallButton>
                  <SmallButton onClick={() => templates.remove(t.id)} danger>
                    削除
                  </SmallButton>
                </div>
                <p className="mb-1.5 text-[11.5px]">{t.subject}</p>
                <p className="whitespace-pre-wrap text-[10.5px] leading-relaxed text-dd-muted">
                  {t.body.slice(0, 150)}
                  {t.body.length > 150 && '…'}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ============ 送信済み ============ */}
      {tab === 'sent' && (
        <Section title="送信済み" count={sent.items.length}>
          {sent.items.length === 0 ? (
            <Empty text="送信したメールはまだありません" />
          ) : (
            <div className="space-y-2.5">
              {[...sent.items].reverse().map((m) => (
                <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="mb-1.5 flex items-baseline gap-2">
                    <h3 className="flex-1 text-[12.5px] font-bold">{m.subject}</h3>
                    <span className="flex-none text-[10px] text-dd-muted">{m.date}</span>
                  </div>
                  <p className="mb-2 text-[11px] text-dd-muted">宛先：{m.to}</p>
                  <p className="whitespace-pre-wrap text-[10.5px] leading-relaxed text-dd-muted">
                    {m.body.slice(0, 200)}
                    {m.body.length > 200 && '…'}
                  </p>
                  <div className="mt-2.5">
                    <SmallButton onClick={() => sent.remove(m.id)} danger>
                      削除
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ============ 配信ログ ============ */}
      {tab === 'log' && (
        <Section
          title="配信ログ"
          count={logs.items.length}
          action={
            logs.items.length > 0 ? (
              <SmallButton onClick={() => logs.commit([])} danger>
                すべて消去
              </SmallButton>
            ) : undefined
          }
        >
          {logs.items.length === 0 ? (
            <Empty text="配信の記録はまだありません" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
              {logs.items.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center gap-3 border-b border-white/5 px-4 py-2.5 last:border-0"
                >
                  <span className="flex-none font-mono text-[10px] text-dd-muted">{l.date}</span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px]">{l.subject}</span>
                  <span className="flex-none text-[10.5px] text-dd-muted">{l.count} 件</span>
                  <span
                    className={`flex-none text-[10.5px] ${l.ok ? 'text-dd-ok' : 'text-dd-ng'}`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ============ 設定 ============ */}
      {tab === 'settings' && (
        <Section title="送信の設定">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
              <h3 className="mb-3 text-[13px] font-bold">送信元</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10.5px] text-dd-muted">送信者名</label>
                  <input
                    className={inputClass}
                    value={sDraft.fromName}
                    onChange={(e) => {
                      setSDraft({ ...sDraft, fromName: e.target.value });
                      setSDirty(true);
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10.5px] text-dd-muted">
                    送信元メールアドレス
                  </label>
                  <input
                    className={inputClass}
                    value={sDraft.fromEmail}
                    onChange={(e) => {
                      setSDraft({ ...sDraft, fromEmail: e.target.value });
                      setSDirty(true);
                    }}
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              <p className="mt-2.5 text-[10.5px] leading-relaxed text-dd-muted">
                Resend に登録し、SPF / DKIM を設定した独自ドメインのアドレスをお使いください。
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
              <h3 className="mb-3 text-[13px] font-bold">送信API</h3>
              <label className="mb-1 block text-[10.5px] text-dd-muted">エンドポイントURL</label>
              <input
                className={inputClass}
                value={sDraft.apiEndpoint}
                onChange={(e) => {
                  setSDraft({ ...sDraft, apiEndpoint: e.target.value });
                  setSDirty(true);
                }}
                placeholder="https://ddmail-api.vercel.app/api/send?token=..."
              />
              <p className="mt-2.5 text-[10.5px] leading-relaxed text-dd-muted">
                空欄のままだと、実際のメールは送信されません（練習用）。
                安全に試したいときは空欄にしておいてください。
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
              <h3 className="mb-3 text-[13px] font-bold">配信停止URL</h3>
              <input
                className={inputClass}
                value={sDraft.unsubUrl}
                onChange={(e) => {
                  setSDraft({ ...sDraft, unsubUrl: e.target.value });
                  setSDirty(true);
                }}
                placeholder="https://example.com/unsubscribe"
              />
              <p className="mt-2.5 text-[10.5px] leading-relaxed text-dd-muted">
                一斉配信の本文末尾に自動で追記されます。法律上、必須です。
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.05] p-5">
              <h3 className="mb-3 text-[13px] font-bold">NGワード</h3>
              <input
                className={inputClass}
                value={sDraft.ngWords}
                onChange={(e) => {
                  setSDraft({ ...sDraft, ngWords: e.target.value });
                  setSDirty(true);
                }}
                placeholder="カンマ区切りで入力"
              />
              <p className="mt-2.5 text-[10.5px] text-dd-muted">
                送信前に、件名と本文をチェックします。
              </p>
            </div>

            <button
              onClick={() => {
                saveSettings(sDraft);
                setSDirty(false);
                notify('ok', '設定を保存しました。');
              }}
              disabled={!sDirty}
              className="rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-5 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              設定を保存
            </button>
          </div>
        </Section>
      )}

      {/* ============ 差し込みの確認 ============ */}
      {preview && (
        <div
          onClick={() => setPreview(false)}
          className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] w-[min(600px,94vw)] overflow-y-auto rounded-2xl border border-white/10 bg-dd-panel p-6"
          >
            <h3 className="mb-4 text-[15px] font-bold">差し込みの確認（先頭3名）</h3>

            {targets.slice(0, 3).map((c) => (
              <div key={c.id} className="mb-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
                <p className="mb-2 text-[10.5px] text-dd-muted">
                  宛先：{c.name}（{c.email}）
                </p>
                <p className="mb-2 text-[12px] font-bold">{mergeFields(kSubject, c)}</p>
                <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-dd-muted">
                  {mergeFields(kBody, c)}
                  {settings.unsubUrl &&
                    `\n\n────────────\n配信停止はこちら：${settings.unsubUrl}`}
                </p>
              </div>
            ))}

            {targets.length > 3 && (
              <p className="mb-4 text-[11px] text-dd-muted">
                ほか {targets.length - 3} 名にも同様に配信されます。
              </p>
            )}

            <button
              onClick={() => setPreview(false)}
              className="w-full rounded-lg border border-white/10 py-2.5 text-[12.5px] transition hover:bg-white/10"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ============ 編集の小窓 ============ */}
      {editing && (
        <Modal
          title={editing.id ? '編集' : '新しく追加'}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
        >
          {editing.kind === 'contact' && (
            <>
              <Field label="名前">
                <input className={inputClass} value={val('name')} onChange={(e) => setDraft({ name: e.target.value })} />
              </Field>
              <Field label="メールアドレス">
                <input className={inputClass} value={val('email')} onChange={(e) => setDraft({ email: e.target.value })} />
              </Field>
              <Field label="区分">
                <select className={inputClass} value={val('group')} onChange={(e) => setDraft({ group: e.target.value })}>
                  <option value="fan">ファン</option>
                  <option value="staff">スタッフ</option>
                  <option value="friend">友人</option>
                </select>
              </Field>
              <Field label="会員番号">
                <input className={inputClass} value={val('memberNo')} onChange={(e) => setDraft({ memberNo: e.target.value })} />
              </Field>
              <Field label="メモ" wide>
                <input className={inputClass} value={val('note')} onChange={(e) => setDraft({ note: e.target.value })} />
              </Field>
            </>
          )}

          {editing.kind === 'template' && (
            <>
              <Field label="ひな形の名前" wide>
                <input className={inputClass} value={val('name')} onChange={(e) => setDraft({ name: e.target.value })} />
              </Field>
              <Field label="件名" wide>
                <input className={inputClass} value={val('subject')} onChange={(e) => setDraft({ subject: e.target.value })} />
              </Field>
              <Field label="本文" wide>
                <textarea rows={10} className={`${inputClass} leading-relaxed`} value={val('body')} onChange={(e) => setDraft({ body: e.target.value })} />
              </Field>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
