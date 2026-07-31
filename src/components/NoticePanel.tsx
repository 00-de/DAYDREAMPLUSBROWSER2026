/**
 * ============================================================
 *  NoticePanel — 通知エリア
 * ------------------------------------------------------------
 *  開発スケジュールから「今日の作業」を自動で表示します。
 * ============================================================
 */

import { useMemo, useState } from 'react';
import { isFirebaseReady } from '../lib/firebase';
import type { Notice } from '../types';

/** 開発スケジュール（月は0始まりではなく実際の月） */
const SCHEDULE: Record<string, { title: string; items: string[] }> = {
  '7-31': { title: 'プロジェクト開始', items: ['Electron環境構築', 'React + TypeScript + Vite', 'Tailwind CSS', 'GitHub / Firebase / Vercel 作成'] },
  '8-1':  { title: 'ホーム画面',       items: ['DayDreamロゴ', '検索バー', '時計表示', '通知エリア', '最近使用したツール', 'お気に入り'] },
  '8-2':  { title: 'Workspace',        items: ['ドラッグ移動', 'サイズ変更', 'スナップ配置', 'レイアウト保存'] },
  '8-3':  { title: 'Dock',             items: ['Dock作成', 'アイコン拡大', 'ドラッグ並び替え', 'クイック起動'] },
  '8-4':  { title: 'AIツール連携',      items: ['ChatGPT', 'Claude', 'Genspark', 'SUNO', 'Canva'] },
  '8-5':  { title: 'GitHub・Vercel・Firebase', items: ['Authentication', 'Firestore', 'Storage', 'Hosting設定'] },
  '8-6':  { title: 'プロジェクト管理',   items: ['フォルダ管理', 'タグ管理', '検索', '音楽/MV/アプリ管理'] },
  '8-7':  { title: 'DayDream専用機能',  items: ['Dashboard', 'メンバー管理', 'ライブ予定', 'SNS管理'] },
  '8-8':  { title: 'メーリングアプリ ①', items: ['3ペインUI', 'Firestore設計', 'メール作成エディタ'] },
  '8-9':  { title: 'メーリングアプリ ②', items: ['宛先リスト', '一斉配信', '差し込み文字', '予約送信'] },
  '8-10': { title: 'デザイン・ショートカット', items: ['ガラスUI', 'ダーク/ライト', 'Ctrl+1〜9', 'Ctrl+Space'] },
  '8-11': { title: '総合テスト・完成',   items: ['バグ修正', 'インストーラー作成', 'リリースノート'] },
};

export default function NoticePanel() {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const notices = useMemo<Notice[]>(() => {
    const now = new Date();
    const key = `${now.getMonth() + 1}-${now.getDate()}`;
    const today = SCHEDULE[key];
    const list: Notice[] = [];

    if (today) {
      list.push({
        id: 'today',
        type: 'task',
        title: `本日の作業：${today.title}`,
        detail: today.items.join('、'),
      });
    }

    // 8月11日までの残り日数
    const goal = new Date(now.getFullYear(), 7, 11); // 7 = 8月
    const days = Math.ceil((goal.getTime() - now.getTime()) / 86400000);
    if (days >= 0) {
      list.push({
        id: 'countdown',
        type: 'info',
        title: `完成まで あと ${days} 日`,
        detail: '目標完成日 2026年8月11日 ／ 公開予定日 8月14日',
      });
    }

    if (!isFirebaseReady) {
      list.push({
        id: 'firebase',
        type: 'warn',
        title: 'Firebase が未設定です',
        detail: 'src/lib/firebase.ts に設定を入力してください（8月5日の作業）',
      });
    }

    return list;
  }, []);

  const visible = notices.filter((n) => !dismissed.includes(n.id));

  const style = {
    task: 'border-dd-accent/30 bg-dd-accent/10',
    info: 'border-white/10 bg-white/[0.05]',
    warn: 'border-dd-warn/30 bg-dd-warn/10',
  };

  const mark = { task: '◆', info: '●', warn: '▲' };

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold text-dd-muted">
        <span>通知</span>
        <span className="h-px flex-1 bg-white/10" />
        {visible.length > 0 && <span className="text-[10px]">{visible.length} 件</span>}
      </h2>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-[11.5px] text-dd-muted">
          新しい通知はありません
        </p>
      ) : (
        <div className="space-y-2.5">
          {visible.map((n) => (
            <div key={n.id} className={`relative rounded-2xl border px-4 py-3 ${style[n.type]}`}>
              <div className="mb-1 flex items-start gap-2 pr-5">
                <span className="mt-[3px] text-[9px] text-dd-muted">{mark[n.type]}</span>
                <h3 className="text-[12.5px] font-semibold leading-snug">{n.title}</h3>
              </div>
              <p className="pl-4 text-[11px] leading-relaxed text-dd-muted">{n.detail}</p>

              <button
                onClick={() => setDismissed((d) => [...d, n.id])}
                title="閉じる"
                className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded text-[11px] text-dd-muted transition hover:bg-white/10 hover:text-dd-text"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
