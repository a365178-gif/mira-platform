import Link from 'next/link';
import { Logo } from '@mira/ui';
import { getSupabasePublicConfig } from '../../lib/supabase/config';
import styles from '../members/member.module.css';
import { LoginForm } from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { notice } = await searchParams;
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/">返回首頁</Link></header>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>MIRA｜覓然 · 會員登入</p>
          <h1 className={styles.title}>歡迎回來。</h1>
          <p className={styles.description}>使用註冊時的電子郵件與密碼登入。</p>
        </section>
        <LoginForm configured={Boolean(getSupabasePublicConfig())} notice={notice} />
      </div>
    </main>
  );
}
