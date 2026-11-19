'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import { buildRegistrationMetadata, latestAdultBirthDate, validateRegistration } from '../../lib/members/registration';
import styles from '../members/member.module.css';

interface SignUpFormProps { configured: boolean }

export function SignUpForm({ configured }: SignUpFormProps) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [intention, setIntention] = useState('');
  const [adultCommitment, setAdultCommitment] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const validationError = validateRegistration({ nickname, dateOfBirth, gender, interestedIn, intention });
    if (validationError) { setError(validationError); return; }
    if (!adultCommitment) { setError('請先確認已年滿 18 歲。'); return; }
    if (password.length < 12) { setError('密碼至少需要 12 個字元。'); return; }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('Supabase 尚未設定，註冊資料沒有送出。'); return; }

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/members/me`,
        data: buildRegistrationMetadata({ nickname, dateOfBirth, gender, interestedIn, intention }),
      },
    });
    setBusy(false);

    if (signUpError) { setError('註冊未完成，請確認資料後再試。'); return; }
    if (data.session) {
      window.location.assign('/members/me');
      return;
    }
    setMessage('註冊資料已送交 Supabase Auth。請至信箱完成確認；完成後仍須通過可信任的成年驗證，才能使用探索服務。');
  }

  return (
    <form className={styles.card} onSubmit={submit} noValidate>
      {!configured ? (
        <p className={styles.notice} role="status"><strong>尚未連接正式服務</strong><br />目前沒有 Supabase 專案 URL 與公開金鑰設定。表單停用中，不會送出或保存資料。</p>
      ) : (
        <p className={styles.notice} role="status"><strong>成年資格提醒</strong><br />生日只在本頁檢查是否年滿 18 歲，不會送出或保存。帳號建立後仍須完成可信任的成年驗證，才能啟用會員功能。</p>
      )}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="nickname">暱稱</label>
        <input autoComplete="nickname" className={styles.input} disabled={!configured || busy} id="nickname" maxLength={20} minLength={2} onChange={(event) => setNickname(event.target.value)} required value={nickname} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-email">電子郵件</label>
        <input autoComplete="email" className={styles.input} disabled={!configured || busy} id="signup-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-password">密碼</label>
        <input autoComplete="new-password" className={styles.input} disabled={!configured || busy} id="signup-password" minLength={12} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        <p className={styles.help}>至少 12 個字元。密碼會由 Supabase Auth 處理，不會寫入會員資料表。</p>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="birth-date">出生年月日</label>
        <input autoComplete="bday" className={styles.input} disabled={!configured || busy} id="birth-date" max={latestAdultBirthDate()} onChange={(event) => setDateOfBirth(event.target.value)} required type="date" value={dateOfBirth} />
        <p className={styles.help}>只在此頁確認年齡，不會傳送至 Supabase 或保存為會員資料。</p>
      </div>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-gender">性別</label>
          <select className={styles.select} disabled={!configured || busy} id="signup-gender" onChange={(event) => setGender(event.target.value)} required value={gender}>
            <option value="">請選擇</option><option value="女性">女性</option><option value="男性">男性</option><option value="非二元性別">非二元性別</option><option value="暫不透露">暫不透露</option>
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-interest">希望認識</label>
          <select className={styles.select} disabled={!configured || busy} id="signup-interest" onChange={(event) => setInterestedIn(event.target.value)} required value={interestedIn}>
            <option value="">請選擇</option><option value="女性">女性</option><option value="男性">男性</option><option value="不限性別">不限性別</option>
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-intention">交友意向</label>
        <select className={styles.select} disabled={!configured || busy} id="signup-intention" onChange={(event) => setIntention(event.target.value)} required value={intention}>
          <option value="">請選擇</option><option value="認真交往">認真交往</option><option value="先從朋友開始">先從朋友開始</option><option value="拓展社交">拓展社交</option><option value="尚未確定">尚未確定</option>
        </select>
      </div>
      <label className={styles.checkLabel}>
        <input checked={adultCommitment} disabled={!configured || busy} onChange={(event) => setAdultCommitment(event.target.checked)} type="checkbox" />
        <span>我確認已年滿 18 歲，並了解正式會員功能須通過可信任的成年驗證。</span>
      </label>
      {error ? <p className={styles.feedback} role="alert">{error}</p> : null}
      {message ? <p className={styles.success} role="status">{message}</p> : null}
      <button className={styles.submit} disabled={!configured || busy} type="submit">{busy ? '正在送出…' : '建立會員帳號'}</button>
      <p className={styles.help}>已有帳號？ <a className={styles.inlineLink} href="/login">登入</a></p>
    </form>
  );
}
