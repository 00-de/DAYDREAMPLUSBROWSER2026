/**
 * ============================================================
 *  Appearance — 見た目の設定
 * ------------------------------------------------------------
 *  背景を、単色24色・グラデーション・画像から選べます。
 * ============================================================
 */

import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBackground } from '../hooks/useBackground';
import { GRADIENT_THEMES, SOLID_THEMES, type Background } from '../lib/themes';
import { inputClass } from '../lib/status';
import { Section } from './DashboardParts';

type TabId = 'gradient' | 'solid' | 'image';

const TABS: { id: TabId; label: string }[] = [
  { id: 'gradient', label: 'グラデーション' },
  { id: 'solid', label: '単色（24色）' },
  { id: 'image', label: '画像' },
];

/** 画像として受け付ける形式 */
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** PC 内の画像を読み込むときの上限（15MB） */
const MAX_BYTES = 15 * 1024 * 1024;

export default function Appearance() {
  const { user } = useAuth();
  const { bg, change } = useBackground(user);

  const [tab, setTab] = useState<TabId>(bg.kind === 'solid' ? 'solid' : bg.kind === 'image' ? 'image' : 'gradient');
  const [urlInput, setUrlInput] = useState(bg.imageUrl?.startsWith('http') ? bg.imageUrl : '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---------- 画像を PC から読み込む ---------- */
  const readFile = (file: File) => {
    setError(null);

    if (!ALLOWED.includes(file.type)) {
      setError('JPEG・PNG・WebP・GIF のいずれかを選んでください。');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('ファイルが大きすぎます（15MB まで）。');
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = () => {
      change({ ...bg, kind: 'image', id: 'custom', imageUrl: String(reader.result) });
      setUrlInput('');
      setLoading(false);
    };
    reader.onerror = () => {
      setError('画像を読み込めませんでした。');
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  /* ---------- 画像を URL で指定する ---------- */
  const applyUrl = () => {
    const u = urlInput.trim();
    setError(null);

    if (!/^https?:\/\//i.test(u)) {
      setError('https:// から始まる URL を入力してください。');
      return;
    }
    change({ ...bg, kind: 'image', id: 'custom', imageUrl: u });
  };

  const setImageOption = (patch: Partial<Background>) => {
    change({ ...bg, ...patch });
  };

  return (
    <div className="mx-auto w-full max-w-4xl animate-rise px-8 pb-28 pt-8">
      {/* ---------- 見出し ---------- */}
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-dd-accent to-dd-accent2 text-xl shadow-[0_8px_28px_rgba(91,140,255,.4)]">
          ◐
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-extrabold">見た目の設定</h1>
          <p className="text-[11px] text-dd-muted">
            選ぶとすぐ反映されます。
            {user ? '画像以外は別の PC にも同期されます。' : ''}
          </p>
        </div>
      </div>

      {/* ---------- 種類のタブ ---------- */}
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

      {/* ============ グラデーション ============ */}
      {tab === 'gradient' && (
        <>
          {[
            { title: '暗いグラデーション', light: false },
            { title: '明るいグラデーション', light: true },
          ].map((group) => (
        <Section
          key={group.title}
          title={group.title}
          count={GRADIENT_THEMES.filter((t) => !!t.light === group.light).length}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GRADIENT_THEMES.filter((t) => !!t.light === group.light).map((t) => {
              const on = bg.kind === 'gradient' && bg.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => change({ ...bg, kind: 'gradient', id: t.id })}
                  className={`overflow-hidden rounded-2xl border transition hover:-translate-y-0.5 ${
                    on ? 'border-dd-accent ring-2 ring-dd-accent/40' : 'border-white/10'
                  }`}
                >
                  <div
                    className="h-16 w-full"
                    style={{ backgroundColor: t.base, backgroundImage: t.css }}
                  />
                  <div className="flex items-center gap-1.5 bg-white/[0.05] px-2.5 py-2">
                    <span className="flex-1 text-left text-[11px]">{t.name}</span>
                    {on && <span className="text-[10px] text-dd-accent">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
          ))}
        </>
      )}

      {/* ============ 単色 ============ */}
      {tab === 'solid' && (
        <>
          {[
            { title: '暗い色', light: false },
            { title: '明るい色', light: true },
          ].map((group) => (
        <Section
          key={group.title}
          title={group.title}
          count={SOLID_THEMES.filter((t) => !!t.light === group.light).length}
        >
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {SOLID_THEMES.filter((t) => !!t.light === group.light).map((t) => {
              const on = bg.kind === 'solid' && bg.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => change({ ...bg, kind: 'solid', id: t.id })}
                  title={t.name}
                  className={`overflow-hidden rounded-xl border transition hover:-translate-y-0.5 ${
                    on ? 'border-dd-accent ring-2 ring-dd-accent/40' : 'border-white/10'
                  }`}
                >
                  <div
                    className="h-12 w-full border-b border-black/10"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="flex items-center gap-1 bg-white/[0.05] px-2 py-1.5">
                    <span className="flex-1 truncate text-left text-[10px]">{t.name}</span>
                    {on && <span className="text-[9px] text-dd-accent">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>
          ))}
        </>
      )}

      {/* ============ 画像 ============ */}
      {tab === 'image' && (
        <>
          <Section title="画像を選ぶ">
            {/* PC から読み込む */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) readFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className="mb-4 cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center transition hover:border-dd-accent/50 hover:bg-white/[0.06]"
            >
              <div className="mb-2 text-3xl opacity-30">▤</div>
              <p className="mb-1 text-[12.5px] font-semibold">
                {loading ? '読み込んでいます…' : '画像をここにドラッグ、またはクリック'}
              </p>
              <p className="text-[10.5px] text-dd-muted">
                JPEG・PNG・WebP・GIF ／ 15MB まで
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
                e.target.value = '';
              }}
            />

            {/* URL で指定する */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <h3 className="mb-2 text-[12.5px] font-bold">URL で指定する</h3>
              <p className="mb-3 text-[10.5px] leading-relaxed text-dd-muted">
                ファンサイトなどに置いた画像を指定できます。
                この方法なら、別の PC でも同じ背景になります。
              </p>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyUrl()}
                  placeholder="https://example.com/background.jpg"
                />
                <button
                  onClick={applyUrl}
                  className="flex-none rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 px-4 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                >
                  適用
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-xl border border-dd-ng/30 bg-dd-ng/10 px-4 py-3 text-[11.5px] text-dd-ng">
                {error}
              </div>
            )}
          </Section>

          {/* 画像を選んでいるときの調整 */}
          {bg.kind === 'image' && bg.imageUrl && (
            <Section title="画像の調整">
              <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <label className="flex-1 text-[11.5px]">暗さ</label>
                    <span className="font-mono text-[11px] text-dd-muted">{bg.dim ?? 40}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={bg.dim ?? 40}
                    onChange={(e) => setImageOption({ dim: Number(e.target.value) })}
                    className="w-full accent-[#5b8cff]"
                  />
                  <p className="mt-1 text-[10px] text-dd-muted">
                    文字が読みにくいときは、暗さを上げてください。
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-baseline gap-2">
                    <label className="flex-1 text-[11.5px]">ぼかし</label>
                    <span className="font-mono text-[11px] text-dd-muted">{bg.blur ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={bg.blur ?? 0}
                    onChange={(e) => setImageOption({ blur: Number(e.target.value) })}
                    className="w-full accent-[#5b8cff]"
                  />
                  <p className="mt-1 text-[10px] text-dd-muted">
                    ぼかすと、手前の内容が見やすくなります。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <button
                    onClick={() => change({ ...bg, kind: 'gradient', id: 'dawn', imageUrl: '' })}
                    className="rounded-lg border border-white/10 px-4 py-2 text-[11.5px] transition hover:bg-white/10"
                  >
                    画像をやめる
                  </button>
                  <button
                    onClick={() => setImageOption({ dim: 40, blur: 0 })}
                    className="rounded-lg border border-white/10 px-4 py-2 text-[11.5px] transition hover:bg-white/10"
                  >
                    調整を戻す
                  </button>
                </div>

                {bg.imageUrl.startsWith('data:') && (
                  <p className="text-[10.5px] leading-relaxed text-dd-muted">
                    この画像は、この PC の中だけに保存されています。
                    別の PC でも同じ背景にしたい場合は、URL での指定をご利用ください。
                  </p>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      {/* ---------- 今の設定 ---------- */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <h3 className="mb-2 text-[12.5px] font-bold">いまの背景</h3>
        <p className="text-[11.5px] text-dd-muted">
          {bg.kind === 'solid' &&
            `単色：${SOLID_THEMES.find((t) => t.id === bg.id)?.name ?? bg.id}`}
          {bg.kind === 'gradient' &&
            `グラデーション：${GRADIENT_THEMES.find((t) => t.id === bg.id)?.name ?? bg.id}`}
          {bg.kind === 'image' &&
            (bg.imageUrl?.startsWith('data:')
              ? 'この PC に保存した画像'
              : `画像：${bg.imageUrl ?? '未設定'}`)}
        </p>
      </div>
    </div>
  );
}
