import Link from 'next/link';
import { Logo } from '@mira/ui';
import { getSupabasePublicConfig } from '../../lib/supabase/config';
import styles from '../members/member.module.css';
import { SignUpForm } from './SignUpForm';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/">返回首頁</Link></header>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>MIRA｜覓然 · 會員註冊</p>
          <h1 className={styles.title}>為相遇，準備一個開始。</h1>
          <p className={styles.description}>建立帳號並設定交友偏好。生日只用於本頁年齡檢查，不會保存。</p>
        </section>
        <SignUpForm configured={Boolean(getSupabasePublicConfig())} />
      </div>
    </main>
  );
}
