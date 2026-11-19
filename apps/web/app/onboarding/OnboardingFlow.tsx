'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Logo } from '@mira/ui';
import { DEMO_PROFILE_KEY, isAtLeast18, type DemoProfile } from '../../lib/demo-profile';
import styles from '../flow.module.css';

const isLocalDemoMode = !(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type FormErrors = Partial<
  Record<'nickname' | 'dateOfBirth' | 'gender' | 'interestedIn' | 'intention' | 'safety', string>
>;

export function OnboardingFlow() {
  const router = useRouter();
  const [today, setToday] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [intention, setIntention] = useState('');
  const [safetyCommitment, setSafetyCommitment] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const currentYear = today ? Number(today.slice(0, 4)) : new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, index) => currentYear - index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const daysInMonth = birthYear && birthMonth
    ? new Date(Number(birthYear), Number(birthMonth), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const dateOfBirth = birthYear && birthMonth && birthDay
    ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
    : '';

  useEffect(() => {
    const now = new Date();
    const localDate = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    setToday(localDate);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');

    if (!isLocalDemoMode) {
      setSubmitError('已偵測到 Supabase 設定，但正式註冊與驗證服務尚未接通，請勿提交真實個資。');
      return;
    }

    const nextErrors: FormErrors = {};
    const normalizedNickname = nickname.trim();
    if (normalizedNickname.length < 2 || normalizedNickname.length > 20) {
      nextErrors.nickname = '暱稱請輸入 2 至 20 個字。';
    }
    if (!dateOfBirth) {
      nextErrors.dateOfBirth = '請選擇出生年月日。';
    } else if (today && dateOfBirth > today) {
      nextErrors.dateOfBirth = '出生年月日不可晚於今天。';
    } else if (!isAtLeast18(dateOfBirth)) {
      nextErrors.dateOfBirth = 'MIRA 僅開放年滿 18 歲的使用者。';
    }
    if (!gender) nextErrors.gender = '請選擇性別。';
    if (!interestedIn) nextErrors.interestedIn = '請選擇希望認識的對象。';
    if (!intention) nextErrors.intention = '請選擇交友意向。';
    if (!safetyCommitment) nextErrors.safety = '請先確認成年與友善社群安全承諾。';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const profile: DemoProfile = {
      mode: 'local-demo',
      nickname: normalizedNickname,
      gender,
      interestedIn,
      intention,
      adultConfirmed: true,
      safetyCommitment: true,
      completedAt: new Date().toISOString(),
    };

    try {
      window.sessionStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      setSubmitError('瀏覽器無法保存本機示範狀態，請調整儲存權限後再試。');
      return;
    }

    router.replace('/explore');
  }

  function handleBirthYearChange(value: string) {
    setBirthYear(value);
    if (value && birthMonth && birthDay) {
      const maxDay = new Date(Number(value), Number(birthMonth), 0).getDate();
      if (Number(birthDay) > maxDay) setBirthDay('');
    }
  }

  function handleBirthMonthChange(value: string) {
    setBirthMonth(value);
    if (birthYear && value && birthDay) {
      const maxDay = new Date(Number(birthYear), Number(value), 0).getDate();
      if (Number(birthDay) > maxDay) setBirthDay('');
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Logo size={48} variant="horizontal" />
          <Link className={styles.homeLink} href="/">
            返回首頁
          </Link>
        </header>

        <div className={styles.intro}>
          <p className={styles.eyebrow}>MIRA｜覓然 · 開始探索</p>
          <h1 className={styles.title}>先認識你，再開始相遇。</h1>
          <p className={styles.description}>
            完成成年門檻與基本交友設定後，即可進入三階探索配對大廳。
          </p>
        </div>

        {isLocalDemoMode ? (
          <p className={styles.modeBanner} role="status">
            <strong>本機示範模式</strong>：目前未設定完整 Supabase 公開環境變數。資料只保存在這個分頁的
            sessionStorage；生日只用於本次年齡計算，不會保存。這不是正式身份或年齡驗證。
          </p>
        ) : (
          <p className={styles.modeBanner} role="status">
            已偵測 Supabase 設定，但正式註冊／驗證整合尚未完成；表單不會送出或保存資料。
          </p>
        )}

        <Card>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="nickname">
                暱稱
              </label>
              <input
                autoComplete="nickname"
                className={styles.input}
                disabled={!isLocalDemoMode}
                id="nickname"
                maxLength={20}
                minLength={2}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="輸入你想使用的暱稱"
                required
                value={nickname}
              />
              {errors.nickname ? <p className={styles.error} role="alert">{errors.nickname}</p> : null}
            </div>

            <fieldset className={`${styles.field} ${styles.birthDateField}`}>
              <legend className={styles.label}>
                出生年月日
              </legend>
              <div className={styles.birthDateSelects}>
                <select
                  aria-label="出生年份"
                  className={styles.select}
                  disabled={!isLocalDemoMode}
                  id="birthYear"
                  onChange={(event) => handleBirthYearChange(event.target.value)}
                  required
                  value={birthYear}
                >
                  <option value="">年份</option>
                  {years.map((year) => <option key={year} value={year}>{year} 年</option>)}
                </select>
                <select
                  aria-label="出生月份"
                  className={styles.select}
                  disabled={!isLocalDemoMode}
                  id="birthMonth"
                  onChange={(event) => handleBirthMonthChange(event.target.value)}
                  required
                  value={birthMonth}
                >
                  <option value="">月份</option>
                  {months.map((month) => <option key={month} value={month}>{month} 月</option>)}
                </select>
                <select
                  aria-label="出生日期"
                  className={styles.select}
                  disabled={!isLocalDemoMode}
                  id="birthDay"
                  onChange={(event) => setBirthDay(event.target.value)}
                  required
                  value={birthDay}
                >
                  <option value="">日期</option>
                  {days.map((day) => <option key={day} value={day}>{day} 日</option>)}
                </select>
              </div>
              <p className={styles.help}>僅用來計算是否年滿 18 歲，不會寫入本機示範資料。</p>
              {errors.dateOfBirth ? (
                <p className={styles.error} role="alert">{errors.dateOfBirth}</p>
              ) : null}
            </fieldset>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="gender">
                  性別
                </label>
                <select
                  className={styles.select}
                  disabled={!isLocalDemoMode}
                  id="gender"
                  onChange={(event) => setGender(event.target.value)}
                  required
                  value={gender}
                >
                  <option value="">請選擇</option>
                  <option value="女性">女性</option>
                  <option value="男性">男性</option>
                  <option value="非二元性別">非二元性別</option>
                  <option value="暫不透露">暫不透露</option>
                </select>
                {errors.gender ? <p className={styles.error} role="alert">{errors.gender}</p> : null}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="interestedIn">
                  希望認識
                </label>
                <select
                  className={styles.select}
                  disabled={!isLocalDemoMode}
                  id="interestedIn"
                  onChange={(event) => setInterestedIn(event.target.value)}
                  required
                  value={interestedIn}
                >
                  <option value="">請選擇</option>
                  <option value="女性">女性</option>
                  <option value="男性">男性</option>
                  <option value="不限性別">不限性別</option>
                </select>
                {errors.interestedIn ? (
                  <p className={styles.error} role="alert">{errors.interestedIn}</p>
                ) : null}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="intention">
                交友意向
              </label>
              <select
                className={styles.select}
                disabled={!isLocalDemoMode}
                id="intention"
                onChange={(event) => setIntention(event.target.value)}
                required
                value={intention}
              >
                <option value="">請選擇</option>
                <option value="認真交往">認真交往</option>
                <option value="先從朋友開始">先從朋友開始</option>
                <option value="拓展社交">拓展社交</option>
                <option value="尚未確定">尚未確定</option>
              </select>
              {errors.intention ? <p className={styles.error} role="alert">{errors.intention}</p> : null}
            </div>

            <div className={styles.commitment}>
              <label className={styles.checkLabel} htmlFor="safetyCommitment">
                <input
                  checked={safetyCommitment}
                  className={styles.checkbox}
                  disabled={!isLocalDemoMode}
                  id="safetyCommitment"
                  onChange={(event) => setSafetyCommitment(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  我確認已年滿 18 歲，並承諾尊重他人、拒絕騷擾與詐騙，共同維護友善社群。
                </span>
              </label>
              {errors.safety ? <p className={styles.error} role="alert">{errors.safety}</p> : null}
            </div>

            {submitError ? <p className={styles.error} role="alert">{submitError}</p> : null}

            <button className={styles.submit} disabled={!isLocalDemoMode} type="submit">
              完成設定並前往探索大廳
            </button>
            <p className={styles.footnote}>
              本機示範不會連接 Supabase、進行身份查核或建立真實配對。
            </p>
          </form>
        </Card>
      </div>
    </main>
  );
}
