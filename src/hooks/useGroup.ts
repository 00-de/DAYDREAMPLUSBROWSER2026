/**
 * ============================================================
 *  useGroup — グループ（データ共有）の管理
 * ------------------------------------------------------------
 *  グループを作ると、参加した人どうしで
 *  メンバー・ライブ・曲・連絡先などを共有できます。
 *
 *  保存先：
 *    個人用   users/{uid}/daydream/{種類}
 *    グループ groups/{groupId}/daydream/{種類}
 * ============================================================
 */

import { useCallback, useEffect, useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { loadLocal, saveLocal } from '../lib/storage';
import type { Group, GroupMember } from '../types';

/** 参加用の合言葉を作ります（紛らわしい文字は避けます） */
function makeInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

/** グループの id を作ります */
function makeGroupId(): string {
  return 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function useGroup(user: User | null) {
  const [group, setGroup] = useState<Group | null>(null);
  /** グループのデータを使うかどうか */
  const [useGroupData, setUseGroupData] = useState<boolean>(() =>
    loadLocal<boolean>('useGroupData', true),
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  /* ---------- 参加しているグループを探します ---------- */
  useEffect(() => {
    if (!db || !user) {
      setGroup(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let stopWatch: (() => void) | null = null;

    const find = async () => {
      try {
        const q = query(
          collection(db!, 'groups'),
          where('memberUids', 'array-contains', user.uid),
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setGroup(null);
          setLoading(false);
          return;
        }

        // 最初に見つかったグループを使います
        const id = snap.docs[0].id;

        stopWatch = onSnapshot(
          doc(db!, 'groups', id),
          (d) => {
            if (d.exists()) {
              setGroup({ id: d.id, ...(d.data() as Omit<Group, 'id'>) });
            } else {
              setGroup(null);
            }
            setLoading(false);
          },
          () => setLoading(false),
        );
      } catch {
        setGroup(null);
        setLoading(false);
      }
    };

    find();
    return () => {
      if (stopWatch) stopWatch();
    };
  }, [user]);

  /* ---------- グループを作ります ---------- */
  const createGroup = useCallback(
    async (name: string, displayName: string) => {
      if (!db || !user) return false;

      setBusy(true);
      setMessage(null);

      try {
        const id = makeGroupId();
        const me: GroupMember = {
          uid: user.uid,
          email: user.email ?? '',
          name: displayName.trim() || user.email?.split('@')[0] || '名前未設定',
          owner: true,
          joinedAt: Date.now(),
        };

        const rec = {
          name: name.trim() || 'DayDream➕ チーム',
          inviteCode: makeInviteCode(),
          ownerUid: user.uid,
          memberUids: [user.uid],
          members: [me],
          createdAt: Date.now(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'groups', id), rec);
        setMessage('グループを作成しました。');
        return true;
      } catch {
        setMessage('作成に失敗しました。Firestore のルールをご確認ください。');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  /* ---------- 合言葉でグループに参加します ---------- */
  const joinGroup = useCallback(
    async (code: string, displayName: string) => {
      if (!db || !user) return false;

      const c = code.trim().toUpperCase();
      if (c.length !== 6) {
        setMessage('合言葉は6文字です。');
        return false;
      }

      setBusy(true);
      setMessage(null);

      try {
        const q = query(collection(db, 'groups'), where('inviteCode', '==', c));
        const snap = await getDocs(q);

        if (snap.empty) {
          setMessage('その合言葉のグループが見つかりませんでした。');
          return false;
        }

        const d = snap.docs[0];
        const g = d.data() as Omit<Group, 'id'>;

        if (g.memberUids.includes(user.uid)) {
          setMessage('すでに参加しています。');
          return true;
        }

        const me: GroupMember = {
          uid: user.uid,
          email: user.email ?? '',
          name: displayName.trim() || user.email?.split('@')[0] || '名前未設定',
          owner: false,
          joinedAt: Date.now(),
        };

        await updateDoc(doc(db, 'groups', d.id), {
          memberUids: arrayUnion(user.uid),
          members: arrayUnion(me),
          updatedAt: serverTimestamp(),
        });

        setMessage('グループに参加しました。');
        return true;
      } catch {
        setMessage('参加に失敗しました。');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  /* ---------- グループから抜けます ---------- */
  const leaveGroup = useCallback(async () => {
    if (!db || !user || !group) return false;

    setBusy(true);
    setMessage(null);

    try {
      const me = group.members.find((m) => m.uid === user.uid);
      await updateDoc(doc(db, 'groups', group.id), {
        memberUids: arrayRemove(user.uid),
        ...(me ? { members: arrayRemove(me) } : {}),
        updatedAt: serverTimestamp(),
      });

      setGroup(null);
      setMessage('グループから抜けました。');
      return true;
    } catch {
      setMessage('処理に失敗しました。');
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, group]);

  /* ---------- 他の人をグループから外します（作成者のみ） ---------- */
  const removeMember = useCallback(
    async (target: GroupMember) => {
      if (!db || !user || !group) return false;
      if (group.ownerUid !== user.uid) {
        setMessage('メンバーを外せるのは、グループを作った人だけです。');
        return false;
      }
      if (target.uid === user.uid) {
        setMessage('ご自身を外すことはできません。「グループから抜ける」をお使いください。');
        return false;
      }

      setBusy(true);
      try {
        await updateDoc(doc(db, 'groups', group.id), {
          memberUids: arrayRemove(target.uid),
          members: arrayRemove(target),
          updatedAt: serverTimestamp(),
        });
        setMessage(`${target.name} さんを外しました。`);
        return true;
      } catch {
        setMessage('処理に失敗しました。');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [user, group],
  );

  /* ---------- 合言葉を作り直します（作成者のみ） ---------- */
  const regenerateCode = useCallback(async () => {
    if (!db || !user || !group) return false;
    if (group.ownerUid !== user.uid) {
      setMessage('合言葉を変えられるのは、グループを作った人だけです。');
      return false;
    }

    setBusy(true);
    try {
      await updateDoc(doc(db, 'groups', group.id), {
        inviteCode: makeInviteCode(),
        updatedAt: serverTimestamp(),
      });
      setMessage('新しい合言葉を作りました。以前のものは使えなくなります。');
      return true;
    } catch {
      setMessage('処理に失敗しました。');
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, group]);

  /* ---------- 個人用の内容をグループへ移します ---------- */
  const copyToGroup = useCallback(async () => {
    if (!db || !user || !group) return false;

    setBusy(true);
    setMessage(null);

    const kinds = [
      'members', 'lives', 'songs', 'videos', 'sns', 'goals',
      'contacts', 'templates', 'sentMails', 'mailLogs',
    ];

    try {
      let copied = 0;
      for (const kind of kinds) {
        const from = await getDoc(doc(db, 'users', user.uid, 'daydream', kind));
        if (!from.exists()) continue;

        await setDoc(doc(db, 'groups', group.id, 'daydream', kind), from.data(), {
          merge: true,
        });
        copied += 1;
      }

      setMessage(`${copied} 件の内容をグループへ移しました。`);
      return true;
    } catch {
      setMessage('移動に失敗しました。');
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, group]);

  /* ---------- 個人用とグループ用の切り替え ---------- */
  const toggleScope = useCallback((next: boolean) => {
    setUseGroupData(next);
    saveLocal('useGroupData', next);
  }, []);

  /** いま使っている保存先の道 */
  const scopePath: string[] | null = (() => {
    if (!user) return null;
    if (group && useGroupData) return ['groups', group.id, 'daydream'];
    return ['users', user.uid, 'daydream'];
  })();

  return {
    group,
    loading,
    busy,
    message,
    setMessage,
    useGroupData,
    toggleScope,
    scopePath,
    isOwner: !!(group && user && group.ownerUid === user.uid),
    createGroup,
    joinGroup,
    leaveGroup,
    removeMember,
    regenerateCode,
    copyToGroup,
  };
}
