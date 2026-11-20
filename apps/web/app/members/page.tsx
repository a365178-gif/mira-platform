import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@mira/ui';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { getSupabasePublicConfig } from '../../lib/supabase/config';
import styles from './member.module.css';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createSupabaseServerClient();
  if (!getSupabasePublicConfig() || !supabase) redirect('/members/me');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: canExplore, error } = await supabase.rpc('current_user_can_explore');

  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/">返回首頁</Link></header>
    <section className={styles.intro}><p className={styles.eyebrow}>MIRA｜覓然 · 會員中心</p><h1 className={styles.title}>歡迎回來</h1><p className={styles.description}>管理你的會員資料與探索資格。</p></section>
    {error ? <p className={styles.notice} role="alert">目前無法確認探索資格，請稍後再試。</p> : canExplore === true ? <Link className={styles.exploreLink} href="/explore">前往探索</Link> : <p className={styles.notice} role="status"><strong>探索功能尚未開放</strong><br />完成可信任的成年驗證並經授權啟用後，即可開始探索。</p>}
    <p><Link className={styles.inlineLink} href="/members/me">查看及編輯個人資料</Link></p>
  </div></main>;
}
