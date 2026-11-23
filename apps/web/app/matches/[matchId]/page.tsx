import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getSupabasePublicConfig } from '../../../lib/supabase/config';
import { MatchRoom, type MatchRoomState } from './MatchRoom';
import styles from './match-room.module.css';

export const dynamic = 'force-dynamic';

export default async function MatchRoomPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const supabase = await createSupabaseServerClient();
  if (!getSupabasePublicConfig() || !supabase) {
    return <main className={styles.page}><div className={styles.shell}>
      <p className={styles.notice} role="alert">共鳴房間尚未連接 Supabase。</p>
      <Link href="/explore">返回探索</Link>
    </div></main>;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data, error } = await supabase.rpc('get_match_room_state', { p_match_id: matchId });
  if (error || !data) notFound();

  return <MatchRoom initial={data as unknown as MatchRoomState} userId={user.id} />;
}
