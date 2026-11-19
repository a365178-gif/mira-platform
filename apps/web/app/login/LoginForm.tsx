'use client';

import { useState, type FormEvent } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';
import styles from '../members/member.module.css';

interface LoginFormProps { configured: boolean; notice?: string }

export function LoginForm({ configured, notice }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('Supabase 尚未設定，登入資料沒有送出。'); return; }

    setBusy(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) { setError('登入未完成，請確認電子郵件與密碼，並先完成信箱驗證。'); return; }
    window.location.assign('/members/me');
  }

  return (
    <form className={styles.card} onSubmit={submit}>
      {!configured ? <p className={styles.notice} role="status"><strong>尚未連接正式服務</strong><br />目前沒有 Supabase 專案 URL 與公開金鑰設定。登入停用中，資料不會送出。</p> : null}
      {notice === 'verification' ? <p className={styles.feedback} role="alert">信箱驗證連結無效或已過期，請重新註冊或聯絡客服。</p> : null}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-email">電子郵件</label>
        <input autoComplete="email" className={styles.input} disabled={!configured || busy} id="login-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">密碼</label>
        <input autoComplete="current-password" className={styles.input} disabled={!configured || busy} id="login-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
      </div>
      {error ? <p className={styles.feedback} role="alert">{error}</p> : null}
      <button className={styles.submit} disabled={!configured || busy} type="submit">{busy ? '正在登入…' : '登入 MIRA'}</button>
      <p className={styles.help}>還沒有帳號？ <a className={styles.inlineLink} href="/sign-up">建立會員帳號</a></p>
    </form>
  );
}
