// @vitest-environment node

import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

const migration = readFileSync(
  new URL('../supabase/migrations/20261118010000_create_core_schema.sql', import.meta.url),
  'utf8',
);

const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const unverifiedUser = '00000000-0000-4000-8000-000000000003';
const privateUserA = '00000000-0000-4000-8000-000000000004';
const privateUserB = '00000000-0000-4000-8000-000000000005';
const legacyUser = '00000000-0000-4000-8000-000000000006';

let database: PGlite;

async function asUser<T extends Record<string, unknown>>(
  userId: string,
  statement: string,
  parameters: unknown[] = [],
) {
  await database.exec('set role authenticated');
  await database.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  try {
    return await database.query<T>(statement, parameters);
  } finally {
    await database.exec('reset role');
    await database.query("select set_config('request.jwt.claim.sub', '', false)");
  }
}

describe('MIRA Supabase schema migration', () => {
  beforeAll(async () => {
    database = new PGlite();
    await database.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create schema storage;
      create table auth.users (
        id uuid primary key,
        raw_user_meta_data jsonb not null default '{}'::jsonb
      );
      create function auth.uid()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      create table storage.buckets (
        id text primary key,
        name text not null unique,
        public boolean not null default false,
        file_size_limit bigint,
        allowed_mime_types text[]
      );
      create table storage.objects (
        id uuid primary key,
        bucket_id text not null references storage.buckets (id),
        name text not null,
        owner_id text
      );
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated;
      grant select, insert, update, delete on storage.objects to authenticated;
      create function storage.foldername(object_name text)
      returns text[]
      language sql
      immutable
      as $$
        select (string_to_array(object_name, '/'))[1:cardinality(string_to_array(object_name, '/')) - 1];
      $$;
    `);
    await database.exec(migration);
    await database.query('insert into auth.users (id) values ($1)', [legacyUser]);
    await database.query("update public.profiles set gender = '女性' where id = $1", [legacyUser]);
    await database.exec(
      readFileSync(
        new URL('../supabase/migrations/20261118020000_create_member_privacy_and_avatars.sql', import.meta.url),
        'utf8',
      ),
    );
    await database.exec(
      readFileSync(
        new URL('../supabase/migrations/20261118030000_grant_profile_status_for_discovery.sql', import.meta.url),
        'utf8',
      ),
    );
    await database.exec(
      readFileSync(
        new URL('../supabase/migrations/20261123010000_create_match_resonance_rooms.sql', import.meta.url),
        'utf8',
      ),
    );
    await database.exec(
      readFileSync(
        new URL('../supabase/migrations/20261123020000_stabilize_current_member_profile_rpc.sql', import.meta.url),
        'utf8',
      ),
    );
  });

  afterAll(async () => {
    await database.close();
  });

  it('enforces adult-only exploration and records mutual interest as a match', async () => {
    await database.query(
      'insert into auth.users (id) values ($1), ($2), ($3)',
      [userA, userB, unverifiedUser],
    );

    const createdProfiles = await database.query<{ id: string; status: string }>(
      'select id, status from public.profiles order by id',
    );
    expect(createdProfiles.rows).toHaveLength(4);
    expect(createdProfiles.rows[0]).toMatchObject({ id: userA, status: 'draft' });

    await expect(
      database.query(
        "update public.profiles set status = 'active' where id = $1",
        [unverifiedUser],
      ),
    ).rejects.toThrow('requires a current adult verification');

    const request = await asUser<{ status: string }>(
      userA,
      `insert into public.age_verifications (user_id, method)
       values ($1, 'provider')
       returning status`,
      [userA],
    );
    expect(request.rows[0].status).toBe('pending');
    await asUser(
      userB,
      `insert into public.age_verifications (user_id, method)
       values ($1, 'provider')`,
      [userB],
    );

    await expect(
      asUser(
        userA,
        "update public.age_verifications set status = 'verified' where user_id = $1",
        [userA],
      ),
    ).rejects.toThrow();

    await database.query(
      `update public.age_verifications
       set status = 'verified',
           result_is_adult = true,
           provider_name = 'test-provider',
           provider_reference = 'opaque-reference',
           reviewed_at = now()
       where user_id in ($1, $2)`,
      [userA, userB],
    );
    await database.query(
      `update public.profiles
       set display_name = case id when $1 then 'Mira A' else 'Mira B' end,
           bio = case id when $1 then '喜歡雨天散步' else '最近喜歡咖啡和書店' end,
           interests = case id when $1 then array['登山','咖啡'] else array['閱讀','散步'] end,
           routine = case id when $1 then '平日早起' else '週末慢慢吃早餐' end,
           status = 'active'
       where id in ($1, $2)`,
      [userA, userB],
    );

    const discoverableProfiles = await asUser<{ id: string }>(
      userA,
      'select id from public.profiles order by id',
    );
    expect(discoverableProfiles.rows.map(({ id }) => id)).toEqual([userA, userB]);
    await expect(asUser(userA, 'select bio from public.profiles where id = $1', [userB]))
      .rejects.toThrow('permission denied for table profiles');

    await expect(
      asUser(unverifiedUser, 'select public.start_exploration($1)', [userB]),
    ).rejects.toThrow('verified, active adult profile is required');

    const started = await asUser<{ start_exploration: string }>(
      userA,
      'select public.start_exploration($1)',
      [userB],
    );
    const sessionId = started.rows[0].start_exploration;

    const firstResponse = await asUser<{
      stage: number;
      status: string;
      match_id: string | null;
    }>(
      userA,
      "select * from public.record_exploration_response($1, 'interested')",
      [sessionId],
    );
    expect(firstResponse.rows[0]).toMatchObject({
      stage: 2,
      status: 'active',
      match_id: null,
    });

    const secondResponse = await asUser<{
      stage: number;
      status: string;
      match_id: string;
    }>(
      userB,
      "select * from public.record_exploration_response($1, 'interested')",
      [sessionId],
    );
    expect(secondResponse.rows[0].stage).toBe(3);
    expect(secondResponse.rows[0].status).toBe('matched');
    expect(secondResponse.rows[0].match_id).toBeTruthy();

    const matches = await database.query<{ count: number }>(
      'select count(*)::int as count from public.matches where exploration_session_id = $1',
      [sessionId],
    );
    expect(matches.rows[0].count).toBe(1);

    const roomStart = await asUser<{ state: Record<string, unknown> }>(
      userA,
      'select public.get_match_room_state((select id from public.matches where exploration_session_id = $1)) as state',
      [sessionId],
    );
    expect(roomStart.rows[0].state).toMatchObject({ currentStage: 1, unlockedPuzzles: 0 });
    const matchId = await database.query<{ id: string }>(
      'select id from public.matches where exploration_session_id = $1',
      [sessionId],
    );
    const activeMatchId = matchId.rows[0].id;
    await database.query(
      `insert into storage.objects (id, bucket_id, name, owner_id)
       values ('20000000-0000-4000-8000-000000000001', 'member-avatars', $1, $2)`,
      [`${userB}/avatar`, userB],
    );
    const hiddenAvatar = await asUser<{ id: string }>(
      userA,
      'select id from storage.objects where name = $1',
      [`${userB}/avatar`],
    );
    expect(hiddenAvatar.rows).toHaveLength(0);
    await expect(asUser(userA, "insert into public.match_room_messages (match_id, user_id, body) values ($1, $2, '太早的留言')", [activeMatchId, userA]))
      .rejects.toThrow();

    await asUser(
      userA,
      "select public.submit_match_stage_answer($1, '{\"choice\":\"a\",\"supplement\":\"喜歡雨天散步\"}'::jsonb)",
      [activeMatchId],
    );
    const hiddenPartnerAnswer = await asUser<{ user_id: string }>(
      userB,
      'select user_id from public.match_stage_answers where match_id = $1',
      [activeMatchId],
    );
    expect(hiddenPartnerAnswer.rows).toHaveLength(0);
    const onePuzzleState = await asUser<{ state: Record<string, unknown> }>(
      userA,
      'select public.get_match_room_state($1) as state',
      [activeMatchId],
    );
    expect(onePuzzleState.rows[0].state).toMatchObject({ currentStage: 1, unlockedPuzzles: 0 });

    await asUser(
      userB,
      "select public.submit_match_stage_answer($1, '{\"choice\":\"b\",\"supplement\":\"也喜歡雨天\"}'::jsonb)",
      [activeMatchId],
    );
    const revealedAnswers = await asUser<{ user_id: string }>(
      userA,
      'select user_id from public.match_stage_answers where match_id = $1 and stage = 1',
      [activeMatchId],
    );
    expect(revealedAnswers.rows).toHaveLength(2);
    const stageTwoState = await asUser<{ state: Record<string, unknown> }>(
      userA,
      'select public.get_match_room_state($1) as state',
      [activeMatchId],
    );
    expect(stageTwoState.rows[0].state).toMatchObject({ currentStage: 2, unlockedPuzzles: 2 });
    expect(stageTwoState.rows[0].state).toMatchObject({
      opponent: { interests: ['閱讀', '散步'], routine: '週末慢慢吃早餐', deepBio: null },
    });

    await asUser(userA, "select public.submit_match_stage_answer($1, '{\"answer\":\"最近常聽的歌\"}'::jsonb)", [activeMatchId]);
    await asUser(userB, "select public.submit_match_stage_answer($1, '{\"answer\":\"今天心情很好\"}'::jsonb)", [activeMatchId]);
    const stageThreeState = await asUser<{ state: Record<string, unknown> }>(
      userA,
      'select public.get_match_room_state($1) as state',
      [activeMatchId],
    );
    expect(stageThreeState.rows[0].state).toMatchObject({ currentStage: 3, unlockedPuzzles: 3 });
    expect(stageThreeState.rows[0].state).toMatchObject({
      opponent: { deepBio: '最近喜歡咖啡和書店', relationshipExpectations: null },
    });

    await asUser(userA, "select public.submit_micro_date_choices($1, array['散步逛街區','咖啡店聊天','逛書店選書'])", [activeMatchId]);
    await asUser(userB, "select public.submit_micro_date_choices($1, array['咖啡店聊天','逛書店選書','公園野餐'])", [activeMatchId]);
    const completedRoom = await asUser<{ state: Record<string, unknown> }>(
      userA,
      'select public.get_match_room_state($1) as state',
      [activeMatchId],
    );
    expect(completedRoom.rows[0].state).toMatchObject({
      currentStage: 3,
      unlockedPuzzles: 4,
      dateConsensus: ['咖啡店聊天', '逛書店選書'],
    });
    const revealedAvatar = await asUser<{ id: string }>(
      userA,
      'select id from storage.objects where name = $1',
      [`${userB}/avatar`],
    );
    expect(revealedAvatar.rows).toHaveLength(1);

    await asUser(userA, "insert into public.match_room_messages (match_id, user_id, body) values ($1, $2, '你好')", [activeMatchId, userA]);
    const roomMessage = await asUser<{ body: string }>(
      userB,
      'select body from public.match_room_messages where match_id = $1',
      [activeMatchId],
    );
    expect(roomMessage.rows[0].body).toBe('你好');

    const ownAgeStatus = await asUser<{ status: string }>(
      userA,
      'select status from public.age_verifications where user_id = $1',
      [userA],
    );
    expect(ownAgeStatus.rows[0].status).toBe('verified');

    await expect(
      asUser(userA, 'select provider_reference from public.age_verifications'),
    ).rejects.toThrow('permission denied for table age_verifications');

    const verificationColumns = await database.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'age_verifications'`,
    );
    expect(verificationColumns.rows.map(({ column_name }) => column_name)).not.toContain(
      'date_of_birth',
    );
    expect(verificationColumns.rows.map(({ column_name }) => column_name)).not.toContain(
      'identity_document_path',
    );
  });

  it('keeps member preferences private and avatar storage owner-scoped', async () => {
    const migratedLegacyDetails = await asUser<{ gender: string }>(
      legacyUser,
      'select gender from public.member_private_details where user_id = $1',
      [legacyUser],
    );
    expect(migratedLegacyDetails.rows[0].gender).toBe('女性');

    await database.query(
      `insert into auth.users (id, raw_user_meta_data) values
        ($1, '{"nickname":"嘉禾","gender":"女性","interested_in":"男性","intention":"認真交往"}'),
        ($2, '{"nickname":"以珩","gender":"男性","interested_in":"女性"}')`,
      [privateUserA, privateUserB],
    );

    const ownDetails = await asUser<{ gender: string; interested_in: string }>(
      privateUserA,
      'select gender, interested_in from public.member_private_details where user_id = $1',
      [privateUserA],
    );
    expect(ownDetails.rows[0]).toMatchObject({ gender: '女性', interested_in: '男性' });

    const ownProfile = await asUser<{ profile: Record<string, unknown> }>(
      privateUserA,
      'select public.get_current_member_profile() as profile',
    );
    expect(ownProfile.rows[0].profile).toMatchObject({
      displayName: '嘉禾',
      gender: '女性',
      interestedIn: '男性',
      intention: '認真交往',
    });

    const otherDetails = await asUser<{ user_id: string }>(
      privateUserA,
      'select user_id from public.member_private_details where user_id = $1',
      [privateUserB],
    );
    expect(otherDetails.rows).toHaveLength(0);
    await expect(asUser(privateUserA, 'select gender from public.profiles')).rejects.toThrow(
      'permission denied for table profiles',
    );

    const personalColumns = await database.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name in ('profiles', 'member_private_details')`,
    );
    const personalColumnNames = personalColumns.rows.map(({ column_name }) => column_name);
    expect(personalColumnNames).not.toContain('email');
    expect(personalColumnNames).not.toContain('date_of_birth');

    await asUser(
      privateUserA,
      `insert into storage.objects (id, bucket_id, name, owner_id)
       values ('10000000-0000-4000-8000-000000000001', 'member-avatars', $1, $2)`,
      [`${privateUserA}/avatar.webp`, privateUserA],
    );
    const ownAvatar = await asUser<{ name: string }>(
      privateUserA,
      'select name from storage.objects where bucket_id = $1',
      ['member-avatars'],
    );
    expect(ownAvatar.rows).toHaveLength(1);
    const privateAvatar = await asUser<{ name: string }>(
      privateUserB,
      'select name from storage.objects where bucket_id = $1',
      ['member-avatars'],
    );
    expect(privateAvatar.rows).toHaveLength(0);
    await expect(
      asUser(
        privateUserB,
        `insert into storage.objects (id, bucket_id, name, owner_id)
         values ('10000000-0000-4000-8000-000000000002', 'member-avatars', $1, $2)`,
        [`${privateUserA}/other.webp`, privateUserB],
      ),
    ).rejects.toThrow();

    const bucket = await database.query<{ public: boolean; file_size_limit: number }>(
      "select public, file_size_limit from storage.buckets where id = 'member-avatars'",
    );
    expect(bucket.rows[0]).toMatchObject({ public: false, file_size_limit: 5242880 });
  });
});
