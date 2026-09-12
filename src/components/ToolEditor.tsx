/**
 * ============================================================
 *  ToolEditor — ツールの追加と編集
 * ------------------------------------------------------------
 *  アプリを作り直さなくても、ここからツールを増やせます。
 *  グループに参加していれば、全員の画面にすぐ反映されます。
 * ============================================================
 */

import { useEffect, useState } from 'react';
import { CATEGORIES, COLOR_CHOICES, ICON_CHOICES } from '../lib/tools';
import { inputClass } from '../lib/status';
import type { Tool } from '../types';

interface Props {
  /** 編集する対象。null なら新規追加。 */
  target: Tool | null;
  onClose: () => void;
  onSave: (value: Omit<Tool, 'id'>) => void;
}

export default function ToolEditor({ target, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Tool['category']>('service');
  const [icon, setIcon] = useState('★');
  const [color, setColor] = useState(COLOR_CHOICES[12].value);
  const [error, setError] = useState<string | null>(null);

  /* 編集の場合は、いまの内容を読み込みます */
  useEffect(() => {
    if (target) {
      setName(target.name);
      setUrl(target.url);
      setCategory(target.category);
      setIcon(target.icon);
      setColor(target.color);
    } else {
      setName('');
      setUrl('');
      setCategory('service');
      setIcon('★');
      setColor(COLOR_CHOICES[12].value);
    }
    setError(null);
  }, [target]);

  const submit = () => {
    const n = name.trim();
    let u = url.trim();

    if (!n) {
      setError('名前を入力してください。');
      return;
    }

    // http が無い場合は補います
    if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;

    if (u && !/^https?:\/\/[^\s.]+\.[^\s]+/.test(u)) {
      setError('URL の形式をご確認ください。');
      return;
    }

    onSave({ name: n, url: u, category, icon, color });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[10000] grid place-items-center bg-black/60 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-[min(520px,94vw)] overflow-y-auto rounded-2xl border border-white/10 bg-dd-panel p-6"
      >
        <h3 className="mb-5 text-[15px] font-bold">
          {target ? 'ツールを編集' : '新しいツールを追加'}
        </h3>

        {/* 見た目の確認 */}
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <span
            className={`grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br text-[19px] text-white shadow-lg ${color}`}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{name || '（名前なし）'}</div>
            <div className="truncate text-[10.5px] text-dd-muted">{url || '（URL なし）'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">名前</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：動画圧縮"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">URL</label>
            <input
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="https://example.com"
            />
            <p className="mt-1 text-[10px] text-dd-muted">
              空欄にすると「準備中」として表示されます。
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10.5px] text-dd-muted">分類</label>
            <select
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as Tool['category'])}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 記号を選ぶ */}
          <div>
            <label className="mb-1.5 block text-[10.5px] text-dd-muted">記号</label>
            <div className="grid max-h-32 grid-cols-10 gap-1 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.04] p-2">
              {ICON_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => setIcon(c)}
                  className={`grid h-8 place-items-center rounded text-[14px] transition ${
                    icon === c ? 'bg-dd-accent text-white' : 'hover:bg-white/10'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              className={`${inputClass} mt-2`}
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              placeholder="好きな文字を直接入れることもできます"
              maxLength={2}
            />
          </div>

          {/* 色を選ぶ */}
          <div>
            <label className="mb-1.5 block text-[10.5px] text-dd-muted">色</label>
            <div className="grid grid-cols-7 gap-1.5">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  className={`h-9 rounded-lg bg-gradient-to-br transition ${c.value} ${
                    color === c.value ? 'ring-2 ring-white' : 'hover:brightness-110'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-dd-ng/30 bg-dd-ng/10 px-3.5 py-2.5 text-[11.5px] text-dd-ng">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={submit}
            className="flex-1 rounded-lg bg-gradient-to-br from-dd-accent to-dd-accent2 py-2.5 text-[12.5px] font-semibold text-white transition hover:brightness-110"
          >
            {target ? '保存する' : '追加する'}
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
