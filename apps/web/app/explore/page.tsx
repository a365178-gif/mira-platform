import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@mira/ui';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { getSupabasePublicConfig } from '../../lib/supabase/config';
import { ExplorationActions } from './ExplorationActions';
import styles from '../members/member.module.css';

export const dynamic = 'force-dynamic';

type CandidateSummary = {
  id: string;
  display_name: string | null;
  city: string | null;
};

type MatchSummary = {
  match_id: string;
  partner_id: string;
  partner_display_name: string | null;
  partner_city: string | null;
  matched_at: string;
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;
  const supabase = await createSupabaseServerClient();
  if (!getSupabasePublicConfig() || !supabase) {
    return <main className={styles.page}><div className={styles.shell}>
      <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link></header>
      <p className={styles.notice} role="alert"><strong>探索服務尚未設定</strong><br />請先設定網站端 Supabase URL 與 Publishable Key。</p>
    </div></main>;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: canExplore, error: accessError } = await supabase.rpc('current_user_can_explore');
  if (accessError) {
    return <main className={styles.page}><div className={styles.shell}>
      <PageHeader />
      <p className={styles.notice} role="alert"><strong>探索資格暫時無法確認</strong><br />請稍後再試，或返回會員中心確認帳號狀態。</p>
      <Link className={styles.inlineLink} href="/members">前往會員中心</Link>
    </div></main>;
  }
  if (canExplore !== true) {
    return <main className={styles.page}><div className={styles.shell}>
      <PageHeader />
      <p className={styles.notice} role="status"><strong>探索功能尚未開放</strong><br />帳號須完成有效的成年驗證，且會員資料狀態為已啟用。</p>
      <Link className={styles.exploreLink} href="/members">返回會員中心</Link>
    </div></main>;
  }

  const [matchesResult, candidatesResult] = await Promise.all([
    supabase.rpc('list_user_matches'),
    supabase.rpc('list_exploration_candidates'),
  ]);

  if (matchesResult.error || candidatesResult.error) {
    return <main className={styles.page}><div className={styles.shell}>
      <PageHeader />
      <p className={styles.notice} role="alert"><strong>探索資料暫時無法載入</strong><br />請確認 migrations 已套用，並稍後再試。</p>
    </div></main>;
  }

  const candidates = (candidatesResult.data ?? []) as CandidateSummary[];
  const matches = (matchesResult.data ?? []) as MatchSummary[];

  return <main className={styles.page}><div className={styles.shell}>
    <PageHeader />
    <section className={styles.intro}>
      <p className={styles.eyebrow}>MIRA｜覓然 · 探索</p>
      <h1 className={styles.title}>慢一點，遇見多一點。</h1>
      <p className={styles.description}>瀏覽已完成成年驗證並啟用探索的會員。</p>
    </section>
    {result === 'matched' ? <p className={styles.success} role="status">配對成功！你們都選擇了有興趣。</p> : null}
    {result === 'passed' ? <p className={styles.success} role="status">已略過此對象。</p> : null}
    {result === 'interested' ? <p className={styles.success} role="status">已記錄你的有興趣回覆。</p> : null}

    <section aria-labelledby="matches-heading">
      <h2 className={styles.sectionTitle} id="matches-heading">已配對成功</h2>
      {matches.length ? <div className={styles.candidateList}>
        {matches.map((match) => <article className={styles.candidateCard} key={match.match_id}>
          <h3 className={styles.sectionTitle}>{match.partner_display_name || 'MIRA 會員'}</h3>
          {match.partner_city ? <p className={styles.help}>{match.partner_city}</p> : null}
          <Link className={styles.exploreLink} href={`/matches/${match.match_id}`}>進入共鳴解鎖房間</Link>
        </article>)}
      </div> : <p className={styles.help}>尚無配對紀錄。</p>}
    </section>

    <section aria-labelledby="candidates-heading">
      <h2 className={styles.sectionTitle} id="candidates-heading">探索會員</h2>
      {candidates.length ? <div className={styles.candidateList}>
        {candidates.map((candidate) => <article className={styles.candidateCard} key={candidate.id}>
          <h3 className={styles.sectionTitle}>{candidate.display_name || 'MIRA 會員'}</h3>
          {candidate.city ? <p className={styles.help}>{candidate.city}</p> : null}
          <ExplorationActions candidateId={candidate.id} />
        </article>)}
      </div> : <p className={styles.notice} role="status"><strong>目前沒有新的探索對象</strong><br />符合資格的新會員會在此顯示。</p>}
    </section>
  </div></main>;
}

function PageHeader() {
  return <header className={styles.header}>
    <Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link>
    <Link className={styles.backLink} href="/members/me">會員中心</Link>
  </header>;
}
