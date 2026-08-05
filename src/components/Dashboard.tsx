/**
 * ============================================================
 *  Dashboard — DayDream➕ 専用の管理画面
 * ------------------------------------------------------------
 *  8月7日の作業内容：
 *    Dashboard／メンバー管理／ライブ予定／曲管理／
 *    MV管理／SNS管理／目標管理
 * ============================================================
 */

import { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCollection } from '../hooks/useDashboard';
import { useImageUpload } from '../hooks/useImageUpload';
import MemberPhoto from './MemberPhoto';
import {
  DEFAULT_GOALS,
  DEFAULT_LIVES,
  DEFAULT_MEMBERS,
  DEFAULT_SNS,
  DEFAULT_SONGS,
  DEFAULT_VIDEOS,
  calcAge,
  daysToBirthday,
} from '../lib/daydream';
import {
  AddButton,
  Badge,
  Empty,
  Field,
  Modal,
  Section,
  SmallButton,
} from './DashboardParts';
import { inputClass } from '../lib/status';
import type { Goal, LiveEvent, Member, SnsAccount, Song, Video } from '../types';

/** 編集対象として受け取れる形（種類ごとに項目が違います） */
type HasIdRecord = { id: string };

type TabId = 'overview' | 'members' | 'lives' | 'songs' | 'videos' | 'sns' | 'goals';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: '概要' },
  { id: 'members', label: 'メンバー' },
  { id: 'lives', label: 'ライブ予定' },
  { id: 'songs', label: '曲' },
  { id: 'videos', label: 'MV' },
  { id: 'sns', label: 'SNS' },
  { id: 'goals', label: '目標' },
];

/** 何も入っていない下書き */
const blank = {
  member: { name: '', reading: '', role: '', height: 165, birthday: '', color: 'from-[#5b8cff] to-[#a06bff]', note: '', photo: '' },
  live: { title: '', date: '', venue: '', status: 'planned' as const, note: '' },
  song: { title: '', status: 'idea' as const, vocal: '', releaseDate: '', url: '', note: '' },
  video: { title: '', songId: '', status: 'idea' as const, releaseDate: '', url: '', note: '' },
  goal: { title: '', target: 100, current: 0, unit: '人', deadline: '', done: false },
  sns: { platform: '', handle: '', url: '', followers: 0, updatedAt: '' },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');

  const members = useCollection<Member>('members', DEFAULT_MEMBERS, user);
  const lives = useCollection<LiveEvent>('lives', DEFAULT_LIVES, user);
  const songs = useCollection<Song>('songs', DEFAULT_SONGS, user);
  const videos = useCollection<Video>('videos', DEFAULT_VIDEOS, user);
  const sns = useCollection<SnsAccount>('sns', DEFAULT_SNS, user);
  const goals = useCollection<Goal>('goals', DEFAULT_GOALS, user);
  const photoUp = useImageUpload(user);

  /** どのメンバーの写真を処理中か */
  const [photoBusyId, setPhotoBusyId] = useState<string | null>(null);

  /** 写真を選んだときの処理 */
  const pickPhoto = async (member: Member, file: File) => {
    setPhotoBusyId(member.id);
    const url = await photoUp.upload(member.id, file);
    if (url) members.update(member.id, { photo: url });
    setPhotoBusyId(null);
  };

  /** 写真を消す */
  const clearPhoto = async (member: Member) => {
    setPhotoBusyId(member.id);
    await photoUp.remove(member.id);
    members.update(member.id, { photo: '' });
    setPhotoBusyId(null);
  };

  /* 編集中の内容（種類ごとに項目が違うため、緩やかな型で扱います） */
  type Draft = Record<string, string | number | boolean>;
  const [editing, setEditing] = useState<{ kind: string; id: string | null; draft: Draft } | null>(
    null,
  );

  const openNew = (kind: keyof typeof blank) =>
    setEditing({ kind, id: null, draft: { ...blank[kind] } });

  const openEdit = (kind: string, item: HasIdRecord) =>
    setEditing({ kind, id: item.id, draft: { ...item } as unknown as Draft });

  /** 入力欄に渡す値を、文字列または数値に整えます */
  const val = (key: string): string | number => {
    const v = editing?.draft[key];
    if (typeof v === 'boolean') return String(v);
    return v ?? '';
  };

  const setDraft = (patch: Draft) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const save = () => {
    if (!editing) return;
    const { kind, id, draft } = editing;
    const target =
      kind === 'member' ? members
      : kind === 'live' ? lives
      : kind === 'song' ? songs
      : kind === 'video' ? videos
      : kind === 'sns' ? sns
      : goals;

    if (id) target.update(id, draft as never);
    else target.add(draft as never);
    setEditing(null);
  };

  /* ---------- 概要の集計 ---------- */
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = lives.items
      .filter((l) => l.date && new Date(l.date) >= now && l.status !== 'canceled')
      .sort((a, b) => a.date.localeCompare(b.date));

    const nextBirthday = [...members.items]
      .map((m) => ({ m, d: daysToBirthday(m.birthday) }))
      .filter((x) => x.d !== null)
      .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))[0];

    return {
      upcoming,
      nextLive: upcoming[0] ?? null,
      released: songs.items.filter((s) => s.status === 'released').length,
      working: songs.items.filter((s) => s.status !== 'released' && s.status !== 'idea').length,
      mvReleased: videos.items.filter((v) => v.status === 'released').length,
      totalFollowers: sns.items.reduce((n, s) => n + (s.followers || 0), 0),
      nextBirthday,
    };
  }, [lives.items, members.items, songs.items, videos.items, sns.items]);

  return (
    <div className="mx-auto w-full max-w-5xl animate-rise px-8 pb-28 pt-8">
      {/* ---------- 見出し ---------- */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-dd-accent to-dd-accent2 text-xl shadow-[0_8px_28px_rgba(91,140,255,.4)]">
          ✦
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-extrabold">DayDream&#10133; Dashboard</h1>
          <p className="text-[11px] text-dd-muted">
            {user ? 'クラウドに保存されています' : 'この PC に保存されています（ログインで同期）'}
          </p>
        </div>
      </div>

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

      {/* ============ 概要 ============ */}
      {tab === 'overview' && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['メンバー', members.items.length, '人'],
              ['公開済みの曲', stats.released, '曲'],
              ['公開済みMV', stats.mvReleased, '本'],
              ['フォロワー合計', stats.totalFollowers.toLocaleString(), '人'],
            ].map(([label, value, unit]) => (
              <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="mb-1 text-[10.5px] text-dd-muted">{label}</div>
                <div className="text-[22px] font-bold leading-none">
                  {value}
                  <span className="ml-1 text-[11px] font-normal text-dd-muted">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 次のライブ */}
          <Section title="次のライブ">
            {stats.nextLive ? (
              <div className="rounded-2xl border border-dd-accent/30 bg-dd-accent/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-[15px] font-bold">{stats.nextLive.title}</h3>
                  <Badge status={stats.nextLive.status} />
                </div>
                <p className="text-[12px] text-dd-muted">
                  {stats.nextLive.date}{'　'}{stats.nextLive.venue}
                </p>
                {stats.nextLive.note && (
                  <p className="mt-2 text-[11.5px] leading-relaxed text-dd-muted">{stats.nextLive.note}</p>
                )}
              </div>
            ) : (
              <Empty text="予定されているライブはありません" />
            )}
          </Section>

          {/* 次の誕生日 */}
          {stats.nextBirthday && (
            <Section title="次の誕生日">
              <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <MemberPhoto
                  photo={stats.nextBirthday.m.photo}
                  name={stats.nextBirthday.m.name}
                  color={stats.nextBirthday.m.color}
                  size={44}
                />
                <div>
                  <div className="text-[13.5px] font-semibold">
                    {stats.nextBirthday.m.name}
                    <span className="ml-2 text-[11px] font-normal text-dd-muted">
                      {stats.nextBirthday.m.birthday}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-dd-accent">
                    {stats.nextBirthday.d === 0
                      ? '今日が誕生日です'
                      : `あと ${stats.nextBirthday.d} 日`}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* 目標 */}
          <Section title="目標の進み具合">
            {goals.items.length === 0 ? (
              <Empty text="目標タブから追加できます" />
            ) : (
              <div className="space-y-2.5">
                {goals.items.slice(0, 4).map((g) => {
                  const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
                  return (
                    <div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                      <div className="mb-2 flex items-baseline gap-2">
                        <span className="flex-1 text-[12.5px] font-semibold">{g.title}</span>
                        <span className="text-[11px] text-dd-muted">
                          {g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-dd-accent to-dd-accent2 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </>
      )}

      {/* ============ メンバー ============ */}
      {tab === 'members' && (
        <Section
          title="メンバー"
          count={members.items.length}
          action={<AddButton onClick={() => openNew('member')} label="追加" />}
        >
          {!photoUp.available && (
            <p className="mb-3 rounded-xl border border-dd-warn/30 bg-dd-warn/10 px-4 py-3 text-[11.5px] leading-relaxed text-dd-muted">
              写真を登録するには、アカウントタブからログインしてください。
            </p>
          )}

          {photoUp.error && (
            <p className="mb-3 rounded-xl border border-dd-ng/30 bg-dd-ng/10 px-4 py-3 text-[11.5px] leading-relaxed text-dd-ng">
              {photoUp.error}
            </p>
          )}

          {photoUp.available && (
            <p className="mb-3 text-[11px] text-dd-muted">
              顔写真の丸をクリック、または画像をドラッグ＆ドロップすると登録できます。
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {members.items.map((m) => {
              const age = calcAge(m.birthday);
              return (
                <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <MemberPhoto
                      photo={m.photo}
                      name={m.name}
                      color={m.color}
                      size={44}
                      busy={photoBusyId === m.id}
                      onPick={photoUp.available ? (f) => pickPhoto(m, f) : undefined}
                      onClear={photoUp.available ? () => clearPhoto(m) : undefined}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold">
                        {m.name}
                        <span className="ml-1.5 text-[10px] font-normal text-dd-muted">
                          {m.reading}
                        </span>
                      </div>
                      <div className="text-[11px] text-dd-muted">{m.role}</div>
                    </div>
                  </div>

                  <dl className="mb-3 space-y-1 text-[11px]">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <dt className="text-dd-muted">誕生日</dt>
                      <dd>
                        {m.birthday || '—'}
                        {age !== null && <span className="ml-1.5 text-dd-muted">{age}歳</span>}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <dt className="text-dd-muted">身長</dt>
                      <dd>{m.height} cm</dd>
                    </div>
                  </dl>

                  {m.note && (
                    <p className="mb-3 text-[10.5px] leading-relaxed text-dd-muted">{m.note}</p>
                  )}

                  <div className="flex gap-1.5">
                    <SmallButton onClick={() => openEdit('member', m)}>編集</SmallButton>
                    <SmallButton onClick={() => members.remove(m.id)} danger>
                      削除
                    </SmallButton>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============ ライブ予定 ============ */}
      {tab === 'lives' && (
        <Section
          title="ライブ・イベント"
          count={lives.items.length}
          action={<AddButton onClick={() => openNew('live')} label="追加" />}
        >
          {lives.items.length === 0 ? (
            <Empty text="ライブの予定を追加してください" />
          ) : (
            <div className="space-y-2.5">
              {[...lives.items]
                .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                .map((l) => (
                  <div key={l.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="flex-1 text-[13px] font-bold">{l.title}</h3>
                      <Badge status={l.status} />
                    </div>
                    <p className="mb-2 text-[11.5px] text-dd-muted">
                      {l.date || '日付未定'}{'　'}{l.venue || '会場未定'}
                    </p>
                    {l.note && (
                      <p className="mb-2.5 text-[10.5px] leading-relaxed text-dd-muted">{l.note}</p>
                    )}
                    <div className="flex gap-1.5">
                      <SmallButton onClick={() => openEdit('live', l)}>編集</SmallButton>
                      <SmallButton onClick={() => lives.remove(l.id)} danger>
                        削除
                      </SmallButton>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Section>
      )}

      {/* ============ 曲 ============ */}
      {tab === 'songs' && (
        <Section
          title="楽曲"
          count={songs.items.length}
          action={<AddButton onClick={() => openNew('song')} label="追加" />}
        >
          {songs.items.length === 0 ? (
            <Empty text="楽曲を追加してください" />
          ) : (
            <div className="space-y-2.5">
              {songs.items.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="mb-1.5 flex items-center gap-2">
                    <h3 className="flex-1 text-[13px] font-bold">{s.title}</h3>
                    <Badge status={s.status} />
                  </div>
                  <p className="mb-2 text-[11.5px] text-dd-muted">
                    {s.vocal && `ボーカル：${s.vocal}`}{s.vocal && '　'}
                    {s.releaseDate && `公開：${s.releaseDate}`}
                  </p>
                  {s.note && (
                    <p className="mb-2.5 text-[10.5px] leading-relaxed text-dd-muted">{s.note}</p>
                  )}
                  <div className="flex gap-1.5">
                    {s.url && (
                      <SmallButton onClick={() => window.dd?.shell.openExternal(s.url)}>
                        開く
                      </SmallButton>
                    )}
                    <SmallButton onClick={() => openEdit('song', s)}>編集</SmallButton>
                    <SmallButton onClick={() => songs.remove(s.id)} danger>
                      削除
                    </SmallButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ============ MV ============ */}
      {tab === 'videos' && (
        <Section
          title="MV・映像"
          count={videos.items.length}
          action={<AddButton onClick={() => openNew('video')} label="追加" />}
        >
          {videos.items.length === 0 ? (
            <Empty text="MV を追加してください" />
          ) : (
            <div className="space-y-2.5">
              {videos.items.map((v) => {
                const song = songs.items.find((s) => s.id === v.songId);
                return (
                  <div key={v.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="mb-1.5 flex items-center gap-2">
                      <h3 className="flex-1 text-[13px] font-bold">{v.title}</h3>
                      <Badge status={v.status} />
                    </div>
                    <p className="mb-2 text-[11.5px] text-dd-muted">
                      {song && `楽曲：${song.title}`}{song && '　'}
                      {v.releaseDate && `公開：${v.releaseDate}`}
                    </p>
                    {v.note && (
                      <p className="mb-2.5 text-[10.5px] leading-relaxed text-dd-muted">{v.note}</p>
                    )}
                    <div className="flex gap-1.5">
                      {v.url && (
                        <SmallButton onClick={() => window.dd?.shell.openExternal(v.url)}>
                          開く
                        </SmallButton>
                      )}
                      <SmallButton onClick={() => openEdit('video', v)}>編集</SmallButton>
                      <SmallButton onClick={() => videos.remove(v.id)} danger>
                        削除
                      </SmallButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* ============ SNS ============ */}
      {tab === 'sns' && (
        <Section
          title="SNS アカウント"
          count={sns.items.length}
          action={<AddButton onClick={() => openNew('sns')} label="追加" />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {sns.items.map((s) => (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="flex-1 text-[13px] font-bold">{s.platform}</h3>
                  <span className="text-[10.5px] text-dd-muted">{s.handle || '未設定'}</span>
                </div>
                <div className="mb-3 text-[20px] font-bold leading-none">
                  {(s.followers || 0).toLocaleString()}
                  <span className="ml-1 text-[10.5px] font-normal text-dd-muted">フォロワー</span>
                </div>
                {s.updatedAt && (
                  <p className="mb-2.5 text-[10px] text-dd-muted/70">更新：{s.updatedAt}</p>
                )}
                <div className="flex gap-1.5">
                  {s.url && (
                    <SmallButton onClick={() => window.dd?.shell.openExternal(s.url)}>
                      開く
                    </SmallButton>
                  )}
                  <SmallButton onClick={() => openEdit('sns', s)}>編集</SmallButton>
                  <SmallButton onClick={() => sns.remove(s.id)} danger>
                    削除
                  </SmallButton>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ============ 目標 ============ */}
      {tab === 'goals' && (
        <Section
          title="目標"
          count={goals.items.length}
          action={<AddButton onClick={() => openNew('goal')} label="追加" />}
        >
          {goals.items.length === 0 ? (
            <Empty text="目標を追加してください" />
          ) : (
            <div className="space-y-2.5">
              {goals.items.map((g) => {
                const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
                return (
                  <div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="mb-2 flex items-baseline gap-2">
                      <h3 className={`flex-1 text-[13px] font-bold ${g.done ? 'line-through opacity-50' : ''}`}>
                        {g.title}
                      </h3>
                      <span className="text-[11px] text-dd-muted">
                        {g.current.toLocaleString()} / {g.target.toLocaleString()} {g.unit}
                      </span>
                    </div>

                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-dd-accent to-dd-accent2 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="mb-2.5 flex items-center gap-2 text-[10.5px] text-dd-muted">
                      <span>{Math.round(pct)}%</span>
                      {g.deadline && <span>期限：{g.deadline}</span>}
                    </div>

                    <div className="flex gap-1.5">
                      <SmallButton onClick={() => goals.update(g.id, { done: !g.done })}>
                        {g.done ? '未達成に戻す' : '達成にする'}
                      </SmallButton>
                      <SmallButton onClick={() => openEdit('goal', g)}>編集</SmallButton>
                      <SmallButton onClick={() => goals.remove(g.id)} danger>
                        削除
                      </SmallButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* ============ 入力用の小窓 ============ */}
      {editing && (
        <Modal
          title={editing.id ? '編集' : '新しく追加'}
          onClose={() => setEditing(null)}
          onSave={save}
        >
          {editing.kind === 'member' && (
            <>
              <Field label="名前">
                <input className={inputClass} value={val('name')} onChange={(e) => setDraft({ name: e.target.value })} />
              </Field>
              <Field label="よみがな">
                <input className={inputClass} value={val('reading')} onChange={(e) => setDraft({ reading: e.target.value })} />
              </Field>
              <Field label="担当" wide>
                <input className={inputClass} value={val('role')} onChange={(e) => setDraft({ role: e.target.value })} />
              </Field>
              <Field label="誕生日">
                <input type="date" className={inputClass} value={val('birthday')} onChange={(e) => setDraft({ birthday: e.target.value })} />
              </Field>
              <Field label="身長（cm）">
                <input type="number" className={inputClass} value={val('height')} onChange={(e) => setDraft({ height: Number(e.target.value) })} />
              </Field>
              <Field label="特徴・メモ" wide>
                <textarea rows={3} className={inputClass} value={val('note')} onChange={(e) => setDraft({ note: e.target.value })} />
              </Field>
            </>
          )}

          {editing.kind === 'live' && (
            <>
              <Field label="公演名" wide>
                <input className={inputClass} value={val('title')} onChange={(e) => setDraft({ title: e.target.value })} />
              </Field>
              <Field label="日付">
                <input type="date" className={inputClass} value={val('date')} onChange={(e) => setDraft({ date: e.target.value })} />
              </Field>
              <Field label="状態">
                <select className={inputClass} value={val('status')} onChange={(e) => setDraft({ status: e.target.value })}>
                  <option value="planned">予定</option>
                  <option value="confirmed">確定</option>
                  <option value="done">終了</option>
                  <option value="canceled">中止</option>
                </select>
              </Field>
              <Field label="会場" wide>
                <input className={inputClass} value={val('venue')} onChange={(e) => setDraft({ venue: e.target.value })} />
              </Field>
              <Field label="メモ" wide>
                <textarea rows={3} className={inputClass} value={val('note')} onChange={(e) => setDraft({ note: e.target.value })} />
              </Field>
            </>
          )}

          {editing.kind === 'song' && (
            <>
              <Field label="曲名" wide>
                <input className={inputClass} value={val('title')} onChange={(e) => setDraft({ title: e.target.value })} />
              </Field>
              <Field label="状態">
                <select className={inputClass} value={val('status')} onChange={(e) => setDraft({ status: e.target.value })}>
                  <option value="idea">構想</option>
                  <option value="writing">制作中</option>
                  <option value="recording">録音中</option>
                  <option value="mixing">ミックス</option>
                  <option value="released">公開済み</option>
                </select>
              </Field>
              <Field label="ボーカル">
                <input className={inputClass} placeholder="結衣" value={val('vocal')} onChange={(e) => setDraft({ vocal: e.target.value })} />
              </Field>
              <Field label="公開日">
                <input type="date" className={inputClass} value={val('releaseDate')} onChange={(e) => setDraft({ releaseDate: e.target.value })} />
              </Field>
              <Field label="URL">
                <input className={inputClass} placeholder="https://" value={val('url')} onChange={(e) => setDraft({ url: e.target.value })} />
              </Field>
              <Field label="メモ" wide>
                <textarea rows={3} className={inputClass} value={val('note')} onChange={(e) => setDraft({ note: e.target.value })} />
              </Field>
            </>
          )}

          {editing.kind === 'video' && (
            <>
              <Field label="タイトル" wide>
                <input className={inputClass} value={val('title')} onChange={(e) => setDraft({ title: e.target.value })} />
              </Field>
              <Field label="対応する楽曲">
                <select className={inputClass} value={val('songId')} onChange={(e) => setDraft({ songId: e.target.value })}>
                  <option value="">— 選ばない —</option>
                  {songs.items.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </Field>
              <Field label="状態">
                <select className={inputClass} value={val('status')} onChange={(e) => setDraft({ status: e.target.value })}>
                  <option value="idea">構想</option>
                  <option value="shooting">撮影中</option>
                  <option value="editing">編集中</option>
                  <option value="released">公開済み</option>
                </select>
              </Field>
              <Field label="公開日">
                <input type="date" className={inputClass} value={val('releaseDate')} onChange={(e) => setDraft({ releaseDate: e.target.value })} />
              </Field>
              <Field label="URL">
                <input className={inputClass} placeholder="https://" value={val('url')} onChange={(e) => setDraft({ url: e.target.value })} />
              </Field>
              <Field label="メモ" wide>
                <textarea rows={3} className={inputClass} value={val('note')} onChange={(e) => setDraft({ note: e.target.value })} />
              </Field>
            </>
          )}

          {editing.kind === 'sns' && (
            <>
              <Field label="サービス名">
                <input className={inputClass} value={val('platform')} onChange={(e) => setDraft({ platform: e.target.value })} />
              </Field>
              <Field label="アカウント名">
                <input className={inputClass} placeholder="@daydream" value={val('handle')} onChange={(e) => setDraft({ handle: e.target.value })} />
              </Field>
              <Field label="フォロワー数">
                <input type="number" className={inputClass} value={val('followers')} onChange={(e) => setDraft({ followers: Number(e.target.value) })} />
              </Field>
              <Field label="更新日">
                <input type="date" className={inputClass} value={val('updatedAt')} onChange={(e) => setDraft({ updatedAt: e.target.value })} />
              </Field>
              <Field label="URL" wide>
                <input className={inputClass} placeholder="https://" value={val('url')} onChange={(e) => setDraft({ url: e.target.value })} />
              </Field>
            </>
          )}

          {editing.kind === 'goal' && (
            <>
              <Field label="目標" wide>
                <input className={inputClass} placeholder="フォロワー1000人" value={val('title')} onChange={(e) => setDraft({ title: e.target.value })} />
              </Field>
              <Field label="目標値">
                <input type="number" className={inputClass} value={val('target')} onChange={(e) => setDraft({ target: Number(e.target.value) })} />
              </Field>
              <Field label="現在">
                <input type="number" className={inputClass} value={val('current')} onChange={(e) => setDraft({ current: Number(e.target.value) })} />
              </Field>
              <Field label="単位">
                <input className={inputClass} placeholder="人" value={val('unit')} onChange={(e) => setDraft({ unit: e.target.value })} />
              </Field>
              <Field label="期限">
                <input type="date" className={inputClass} value={val('deadline')} onChange={(e) => setDraft({ deadline: e.target.value })} />
              </Field>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
