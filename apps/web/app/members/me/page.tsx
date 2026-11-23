import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@mira/ui';
import { createSupabaseServerClient } from '../../../lib/supabase/server';
import { getSupabasePublicConfig } from '../../../lib/supabase/config';
import { MemberProfileForm, type MemberProfileInitial } from '../MemberProfileForm';
import styles from '../member.module.css';

export const dynamic = 'force-dynamic';

export default async function MemberProfilePage() {
  const configured = Boolean(getSupabasePublicConfig());
  const testAgeVerificationEnabled = process.env.NODE_ENV === 'development' && process.env.MIRA_TEST_MODE === 'true';
  const supabase = await createSupabaseServerClient();

  if (!configured || !supabase) {
    return (
      <main className={styles.page}><div className={styles.shell}>
        <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/">返回首頁</Link></header>
        <p className={styles.notice} role="status"><strong>會員服務尚未連接</strong><br />目前沒有 Supabase 專案設定，無法讀取或建立會員資料。</p>
      </div></main>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileResult, accessResult] = await Promise.all([
    supabase.rpc('get_current_member_profile'),
    supabase.rpc('current_user_can_explore'),
  ]);

  if (profileResult.error || !profileResult.data) {
    const profileReadError = profileResult.error?.message ?? 'get_current_member_profile() returned no profile row.';
    return (
      <main className={styles.page}><div className={styles.shell}>
        <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/">返回首頁</Link></header>
        <p className={styles.notice} role="alert"><strong>會員資料暫時無法讀取</strong><br />請確認會員資料 RPC 與相關 migrations 已套用。</p>
        <p className={styles.help}>Supabase error.message：<code>{profileReadError}</code></p>
      </div></main>
    );
  }

  let avatarUrl: string | null = null;
  const profile = profileResult.data as {
    displayName: string | null;
    bio: string | null;
    interests: string[];
    routine: string | null;
    avatarStoragePath: string | null;
    gender: string | null;
    interestedIn: string | null;
    intention: string | null;
  };
  if (profile.avatarStoragePath) {
    const { data } = await supabase.storage.from('member-avatars')
      .createSignedUrl(profile.avatarStoragePath, 300);
    avatarUrl = data?.signedUrl ?? null;
  }

  const initial: MemberProfileInitial = {
    userId: user.id,
    email: user.email ?? '',
    nickname: profile.displayName ?? '',
    bio: profile.bio ?? '',
    interests: profile.interests ?? [],
    routine: profile.routine ?? '',
    gender: profile.gender ?? '',
    interestedIn: profile.interestedIn ?? '',
    intention: profile.intention ?? '',
    avatarPath: profile.avatarStoragePath,
    avatarUrl,
    canExplore: accessResult.error ? null : accessResult.data === true,
    accessError: accessResult.error?.message ?? null,
    testAgeVerificationEnabled,
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}><Link href="/" aria-label="返回 MIRA 首頁"><Logo size={48} variant="horizontal" /></Link><Link className={styles.backLink} href="/">回到首頁</Link></header>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>MIRA｜覓然 · 會員中心</p>
          <h1 className={styles.title}>個人資料</h1>
          <p className={styles.description}>只讀取你自己的會員資料。電子郵件與生日不會出現在公開個人介紹中。</p>
        </section>
        <MemberProfileForm initial={initial} />
      </div>
    </main>
  );
}
