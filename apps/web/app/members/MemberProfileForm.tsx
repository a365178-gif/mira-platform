'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import styles from './member.module.css';

export interface MemberProfileInitial {
  userId: string;
  email: string;
  nickname: string;
  bio: string;
  gender: string;
  interestedIn: string;
  intention: string;
  avatarPath: string | null;
  avatarUrl: string | null;
  canExplore: boolean;
}

export function MemberProfileForm({ initial }: { initial: MemberProfileInitial }) {
  const [nickname, setNickname] = useState(initial.nickname);
  const [bio, setBio] = useState(initial.bio);
  const [gender, setGender] = useState(initial.gender);
  const [interestedIn, setInterestedIn] = useState(initial.interestedIn);
  const [intention, setIntention] = useState(initial.intention);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      setError('暱稱請輸入 2 至 20 個字。');
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('Supabase 尚未設定，資料沒有送出。'); return; }

    setBusy(true);
    const profileResult = await supabase.from('profiles').update({
      display_name: nickname.trim(),
      bio: bio.trim() || null,
    }).eq('id', initial.userId);
    if (profileResult.error) {
      setBusy(false);
      setError('個人介紹更新失敗，請稍後再試。');
      return;
    }

    const privateResult = await supabase.from('member_private_details').update({
      gender,
      interested_in: interestedIn,
      intention,
    }).eq('user_id', initial.userId);
    setBusy(false);
    if (privateResult.error) { setError('交友偏好更新失敗，請重新載入後確認資料。'); return; }
    setMessage('個人資料已更新。電子郵件與生日不會公開；生日也不會保存。');
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setMessage('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('頭像請使用 JPG、PNG 或 WebP 圖片。');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setError('頭像檔案不可超過 5 MB。'); return; }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('Supabase 尚未設定，頭像沒有上傳。'); return; }
    setBusy(true);
    const path = `${initial.userId}/avatar`;
    const { error: uploadError } = await supabase.storage.from('member-avatars').upload(path, file, {
      cacheControl: '300',
      contentType: file.type,
      upsert: true,
    });
    if (uploadError) {
      setBusy(false);
      setError('頭像上傳失敗，請確認資料庫 migration 已套用後再試。');
      return;
    }
    const { error: profileError } = await supabase.from('profiles')
      .update({ avatar_storage_path: path }).eq('id', initial.userId);
    if (profileError) {
      setBusy(false);
      setError('頭像已私密上傳，但個人資料連結更新失敗。請聯絡客服協助。');
      return;
    }
    const { data: signedAvatar, error: signedUrlError } = await supabase.storage
      .from('member-avatars').createSignedUrl(path, 300);
    setBusy(false);
    if (signedUrlError) { setError('頭像已上傳，但目前無法顯示預覽。'); return; }
    setAvatarUrl(signedAvatar.signedUrl);
    setMessage('頭像已存入私人儲存空間，只有你可以讀取。');
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('Supabase 尚未設定。'); return; }
    setBusy(true);
    const { error: signOutError } = await supabase.auth.signOut();
    setBusy(false);
    if (signOutError) { setError('登出失敗，請稍後再試。'); return; }
    window.location.assign('/');
  }

  return (
    <>
      <form className={styles.card} onSubmit={saveProfile}>
        <div className={styles.profileTop}>
          <div aria-label="會員頭像" className={styles.avatar} role="img">
            {avatarUrl ? <img alt="你的會員頭像" src={avatarUrl} /> : <span aria-hidden="true">✦</span>}
          </div>
          <div>
            <p className={styles.sectionTitle}>個人頭像</p>
            <p className={styles.help}>私有儲存 · JPG、PNG 或 WebP · 最大 5 MB</p>
            <input accept="image/jpeg,image/png,image/webp" className={styles.fileInput} disabled={busy} id="avatar-upload" onChange={uploadAvatar} type="file" />
            <label className={styles.uploadButton} htmlFor="avatar-upload">{busy ? '處理中…' : '選擇並上傳頭像'}</label>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="member-email">電子郵件（私人）</label>
          <input className={styles.input} id="member-email" readOnly value={initial.email} />
          <p className={styles.help}>只顯示給已登入的本人，不會出現在公開個人資料。</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="member-nickname">暱稱</label>
          <input autoComplete="nickname" className={styles.input} disabled={busy} id="member-nickname" maxLength={20} minLength={2} onChange={(event) => setNickname(event.target.value)} required value={nickname} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="member-bio">個人介紹</label>
          <textarea className={styles.textarea} disabled={busy} id="member-bio" maxLength={500} onChange={(event) => setBio(event.target.value)} rows={4} value={bio} />
          <p className={styles.help}>{bio.length}/500</p>
        </div>
        <h2 className={styles.sectionTitle}>交友資料</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="member-gender">性別（私人設定）</label>
            <select className={styles.select} disabled={busy} id="member-gender" onChange={(event) => setGender(event.target.value)} value={gender}>
              <option value="">尚未設定</option><option value="女性">女性</option><option value="男性">男性</option><option value="非二元性別">非二元性別</option><option value="暫不透露">暫不透露</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="member-interest">希望認識（私人設定）</label>
            <select className={styles.select} disabled={busy} id="member-interest" onChange={(event) => setInterestedIn(event.target.value)} value={interestedIn}>
              <option value="">尚未設定</option><option value="女性">女性</option><option value="男性">男性</option><option value="不限性別">不限性別</option>
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="member-intention">交友意向（私人設定）</label>
          <select className={styles.select} disabled={busy} id="member-intention" onChange={(event) => setIntention(event.target.value)} value={intention}>
            <option value="">尚未設定</option><option value="認真交往">認真交往</option><option value="先從朋友開始">先從朋友開始</option><option value="拓展社交">拓展社交</option><option value="尚未確定">尚未確定</option>
          </select>
        </div>
        <p className={styles.help}>生日不會保存。正式探索服務僅對完成可信任成年驗證並啟用的帳號開放。</p>
        {error ? <p className={styles.feedback} role="alert">{error}</p> : null}
        {message ? <p className={styles.success} role="status">{message}</p> : null}
        <div className={styles.formActions}>
          <button className={styles.submit} disabled={busy} type="submit">儲存個人資料</button>
          <button className={styles.signOut} disabled={busy} onClick={signOut} type="button">登出</button>
        </div>
      </form>
      <p className={styles.notice} role="status">
        <strong>{initial.canExplore ? '成年驗證已完成' : '正式會員服務尚未啟用'}</strong><br />
        {initial.canExplore
          ? '目前帳號已通過資料庫成年資格與啟用檢查。'
          : '帳號資料不代表成年驗證已完成。完成可信任的成年驗證並經授權啟用前，配對探索功能不會開放。'}
      </p>
    </>
  );
}
