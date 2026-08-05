/**
 * ============================================================
 *  MemberPhoto — メンバーの顔写真
 * ------------------------------------------------------------
 *  写真があれば表示し、無ければ頭文字を丸で表示します。
 *  編集できる状態のときは、クリックまたはドラッグ＆ドロップで
 *  写真を差し替えられます。
 * ============================================================
 */

import { useRef, useState } from 'react';

interface Props {
  /** 写真の URL（未登録なら空） */
  photo?: string;
  /** 頭文字に使う名前 */
  name: string;
  /** 背景のグラデーション */
  color: string;
  /** 表示の大きさ（ピクセル） */
  size?: number;
  /** 写真を選んだときの処理。渡さなければ表示のみ */
  onPick?: (file: File) => void;
  /** 写真を消すときの処理 */
  onClear?: () => void;
  /** アップロード中 */
  busy?: boolean;
}

export default function MemberPhoto({
  photo,
  name,
  color,
  size = 44,
  onPick,
  onClear,
  busy,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const editable = !!onPick;

  const handleFile = (file: File | undefined) => {
    if (file && onPick) onPick(file);
  };

  return (
    <div
      className="group relative flex-none"
      style={{ width: size, height: size }}
      onDragOver={(e) => {
        if (!editable) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!editable) return;
        e.preventDefault();
        setOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <button
        onClick={() => editable && inputRef.current?.click()}
        disabled={!editable || busy}
        title={editable ? '写真を選ぶ（ドラッグでも登録できます）' : undefined}
        className={`grid h-full w-full place-items-center overflow-hidden rounded-full transition
          ${photo ? '' : `bg-gradient-to-br ${color}`}
          ${editable ? 'cursor-pointer' : 'cursor-default'}
          ${over ? 'ring-2 ring-dd-accent' : ''}
          ${busy ? 'opacity-50' : ''}`}
      >
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <span
            className="font-bold text-white"
            style={{ fontSize: Math.round(size * 0.36) }}
          >
            {name.replace(/\s/g, '').slice(0, 1)}
          </span>
        )}
      </button>

      {/* 変更を促す覆い */}
      {editable && !busy && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/55 text-[9px] text-white opacity-0 transition group-hover:opacity-100">
          変更
        </div>
      )}

      {/* 処理中 */}
      {busy && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/60">
          <span className="animate-pulse text-[9px] text-white">送信中</span>
        </div>
      )}

      {/* 写真を消す */}
      {editable && photo && !busy && onClear && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          title="写真を消す"
          className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-dd-panel text-[9px] text-dd-muted opacity-0 transition hover:bg-dd-ng hover:text-white group-hover:opacity-100"
        >
          ✕
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
