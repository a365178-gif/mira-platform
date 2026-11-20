import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@mira/ui';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { getSupabasePublicConfig } from '../../lib/supabase/config';
import { ExplorationActions } from './ExplorationActions';
import { ExplorationLobby } from './ExplorationLobby';
import styles from '../members/member.module.css';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const supabase = await createSupabaseServerClient();
  if (!getSupabasePublicConfig() || !supabase) {
    return <ExplorationLobby />;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: canExplore, error: accessError } = await supabase.rpc('current_user_can_explore');
  if (accessError) {
    return <main className={styles.page}><div className={styles.shell}><p className={styles.notice} role="alert"><strong>探索資格暫時無法確認</strong><br />請稍後再試，或返回會員中心確認帳號狀態。</p><Link className={styles.inlineLink} href="/members">前往會員中心</Link></div></main>;
  }
  if (canExplore !== true) {
    return <main className={styles.page}><div className={styles.shell}><header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/members">會員中心</Link></header><section className={styles.notice} role="status"><strong>探索功能尚未開放</strong><br />帳號須完成可信任的成年驗證並經授權啟用，才能查看其他會員。</section><Link className={styles.exploreLink} href="/members">返回會員中心</Link></div></main>;
  }

  const { data: candidates, error } = await supabase.from('profiles')
    .select('id, display_name, bio, city, interests')
    .eq('status', 'active').neq('id', user.id).limit(24);

  if (error) {
    console.error('[explore] Candidate profile query failed', {
      code: error.code,
      message: error.message,
      hint: error.hint,
    });
  }

  return (
    <main className={styles.page}><div className={styles.shell}>
      <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/members/me">會員中心</Link></header>
      <section className={styles.intro}><p className={styles.eyebrow}>MIRA｜覓然 · 探索</p><h1 className={styles.title}>慢一點，遇見多一點。</h1><p className={styles.description}>僅顯示符合探索資格且已啟用的會員資料。</p></section>
      {error ? <p className={styles.notice} role="alert"><strong>會員資料暫時無法載入</strong><br />請確認資料庫 migrations 已全部套用及 RLS 設定正確後再試。（錯誤代碼：{error.code || '未知'}）</p> : candidates?.length ? <div className={styles.candidateList}>
        {candidates.map((candidate) => <article className={styles.candidateCard} key={candidate.id}>
          <h2 className={styles.sectionTitle}>{candidate.display_name || 'MIRA 會員'}</h2>
          {candidate.city ? <p className={styles.help}>{candidate.city}</p> : null}
          {candidate.bio ? <p className={styles.description}>{candidate.bio}</p> : null}
          {candidate.interests?.length ? <p className={styles.help}>興趣：{candidate.interests.join('・')}</p> : null}
          <ExplorationActions candidateId={candidate.id} />
        </article>)}
      </div> : <p className={styles.notice} role="status"><strong>目前沒有可探索的會員</strong><br />有符合條件的會員加入後，會在此顯示。</p>}
    </div></main>
  );
}
