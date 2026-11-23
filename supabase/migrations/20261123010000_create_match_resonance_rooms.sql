alter table public.profiles
  add column routine text check (routine is null or char_length(routine) <= 240);

create table public.prompt_questions (
  id uuid primary key default gen_random_uuid(),
  stage smallint not null check (stage in (1, 2)),
  question text not null check (char_length(btrim(question)) between 8 and 300),
  option_a text,
  option_b text,
  supplement_label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint prompt_questions_options_match_stage check (
    (stage = 1 and option_a is not null and option_b is not null)
    or (stage = 2 and option_a is null and option_b is null)
  )
);

insert into public.prompt_questions (stage, question, option_a, option_b, supplement_label) values
  (1, '週末午後突然下起大雨，你會怎麼安排？', '找間咖啡店坐下來，享受計畫外的空白', '穿上雨衣照原定計畫走走，看城市另一種樣子', '想補充的話，可以分享你喜歡的雨天行程'),
  (1, '朋友臨時取消今晚的約，你比較想？', '把晚上留給自己，做一件平常沒空做的事', '問問另一位朋友，看看能不能來場臨時小聚', '你理想中的臨時小聚是什麼樣子？'),
  (1, '旅行只剩半天，你會選哪一種節奏？', '挑一個地方慢慢待著，感受當地日常', '多走幾個街區，收集沿路的小驚喜', '分享一個你曾經喜歡的旅行片刻'),
  (1, '在夜市只剩最後一份想吃的小吃時，你會？', '問同行的人要不要一起分著吃', '先買下來，再一起找別的東西分享', '你心中最不能錯過的夜市小吃是？'),
  (1, '做重要決定時，你更常依靠哪一種方式？', '先聽聽感受，確認自己真正想要什麼', '列出選項和影響，再一步步做決定', '最近一次讓你猶豫的小決定是什麼？'),
  (2, '最近單曲循環的一首歌是什麼？它陪你度過哪個時刻？', null, null, null),
  (2, '用三個詞形容今天的心情，會是哪三個？', null, null, null),
  (2, '最近一次讓你忍不住笑出來的小事是什麼？', null, null, null),
  (2, '台灣哪個地方最讓你想再去一次？下次想和誰一起去？', null, null, null),
  (2, '最近學會或重新喜歡上的一件小事是什麼？', null, null, null);

create table public.match_stage_progress (
  match_id uuid primary key references public.matches (id) on delete cascade,
  current_stage smallint not null default 1 check (current_stage between 1 and 3),
  unlocked_puzzles smallint not null default 0 check (unlocked_puzzles between 0 and 4),
  stage1_prompt_id uuid not null references public.prompt_questions (id),
  stage2_prompt_id uuid not null references public.prompt_questions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.match_stage_answers (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  stage smallint not null check (stage in (1, 2)),
  answer jsonb not null check (jsonb_typeof(answer) = 'object'),
  submitted_at timestamptz not null default now(),
  primary key (match_id, user_id, stage)
);

create table public.match_micro_date_choices (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  choices text[] not null check (cardinality(choices) = 3),
  submitted_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table public.match_room_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index match_room_messages_match_created_idx
  on public.match_room_messages (match_id, created_at);

do $$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_catalog.pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'match_room_messages'
    ) then
    execute 'alter publication supabase_realtime add table public.match_room_messages';
  end if;
end;
$$;

alter table public.prompt_questions enable row level security;
alter table public.match_stage_progress enable row level security;
alter table public.match_stage_answers enable row level security;
alter table public.match_micro_date_choices enable row level security;
alter table public.match_room_messages enable row level security;

revoke all on public.prompt_questions,
  public.match_stage_progress,
  public.match_stage_answers,
  public.match_micro_date_choices,
  public.match_room_messages
from public, anon, authenticated;

grant select on public.prompt_questions, public.match_stage_progress,
  public.match_stage_answers, public.match_micro_date_choices,
  public.match_room_messages to authenticated;
grant insert on public.match_room_messages to authenticated;
grant all on public.prompt_questions, public.match_stage_progress,
  public.match_stage_answers, public.match_micro_date_choices,
  public.match_room_messages to service_role;

create policy prompt_questions_read_for_match_members
  on public.prompt_questions for select to authenticated
  using (exists (
    select 1 from public.matches as match_row
    where match_row.status = 'active'
      and public.current_user_can_explore()
      and (match_row.member_low = (select auth.uid()) or match_row.member_high = (select auth.uid()))
  ));

create policy match_stage_progress_read_participant
  on public.match_stage_progress for select to authenticated
  using (exists (
    select 1 from public.matches as match_row
    where match_row.id = match_id and match_row.status = 'active'
      and public.current_user_can_explore()
      and (match_row.member_low = (select auth.uid()) or match_row.member_high = (select auth.uid()))
  ));

create function private.can_read_match_stage_answer(
  p_match_id uuid,
  p_stage smallint,
  p_answer_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_can_explore()
    and (p_answer_user_id = auth.uid()
    or (
      exists (
        select 1 from public.matches as match_row
        where match_row.id = p_match_id and match_row.status = 'active'
          and (match_row.member_low = auth.uid() or match_row.member_high = auth.uid())
      )
      and (select count(*) = 2 from public.match_stage_answers as answer
        where answer.match_id = p_match_id and answer.stage = p_stage)
    ));
$$;
revoke all on function private.can_read_match_stage_answer(uuid, smallint, uuid)
  from public, anon, authenticated;
grant execute on function private.can_read_match_stage_answer(uuid, smallint, uuid)
  to authenticated;

create policy match_stage_answers_read_after_both_submit
  on public.match_stage_answers for select to authenticated
  using (private.can_read_match_stage_answer(match_id, stage, user_id));

create policy match_room_messages_read_after_unlock
  on public.match_room_messages for select to authenticated
  using (exists (
    select 1 from public.matches as match_row
    where match_row.id = match_id and match_row.status = 'active'
      and exists (
        select 1 from public.match_stage_progress as progress
        where progress.match_id = match_row.id and progress.unlocked_puzzles = 4
      )
      and public.current_user_can_explore()
      and (match_row.member_low = (select auth.uid()) or match_row.member_high = (select auth.uid()))
  ));

create policy match_room_messages_insert_after_unlock
  on public.match_room_messages for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and char_length(btrim(body)) between 1 and 1000
    and exists (
      select 1 from public.matches as match_row
      where match_row.id = match_id and match_row.status = 'active'
        and exists (
          select 1 from public.match_stage_progress as progress
          where progress.match_id = match_row.id and progress.unlocked_puzzles = 4
        )
        and public.current_user_can_explore()
        and (match_row.member_low = (select auth.uid()) or match_row.member_high = (select auth.uid()))
    )
  );

-- Keep private profile columns behind RPCs so the web client cannot bypass stage unlocks.
revoke select (bio, interests, avatar_storage_path, routine)
  on public.profiles from authenticated;
grant update (routine) on public.profiles to authenticated;

create or replace function public.get_current_member_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles%rowtype;
begin
  select profile.* into v_profile
  from public.profiles as profile
  where profile.id = auth.uid();
  if not found then
    raise exception using errcode = 'P0002', message = 'Member profile not found';
  end if;
  return jsonb_build_object(
    'id', v_profile.id,
    'displayName', v_profile.display_name,
    'bio', v_profile.bio,
    'city', v_profile.city,
    'interests', v_profile.interests,
    'routine', v_profile.routine,
    'avatarStoragePath', v_profile.avatar_storage_path
  );
end;
$$;

create or replace function public.list_exploration_candidates()
returns table (id uuid, display_name text, city text)
language sql
stable
security definer
set search_path = ''
as $$
  select profile.id, profile.display_name, profile.city
  from public.profiles as profile
  where auth.uid() is not null
    and public.current_user_can_explore()
    and profile.id <> auth.uid()
    and profile.status = 'active'
    and private.is_verified_adult(profile.id)
    and not exists (
      select 1
      from public.exploration_sessions as session
      join public.exploration_responses as response on response.session_id = session.id
      where ((session.member_low = auth.uid() and session.member_high = profile.id)
         or (session.member_high = auth.uid() and session.member_low = profile.id))
        and response.user_id = auth.uid()
    )
    and not exists (
      select 1 from public.matches as match_row
      where ((match_row.member_low = auth.uid() and match_row.member_high = profile.id)
          or (match_row.member_high = auth.uid() and match_row.member_low = profile.id))
    )
  order by profile.created_at desc
  limit 24;
$$;

create or replace function public.list_user_matches()
returns table (
  match_id uuid,
  partner_id uuid,
  partner_display_name text,
  partner_city text,
  matched_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select match_row.id,
    case when match_row.member_low = auth.uid() then match_row.member_high else match_row.member_low end,
    partner.display_name,
    partner.city,
    match_row.matched_at
  from public.matches as match_row
  join public.profiles as partner
    on partner.id = case when match_row.member_low = auth.uid() then match_row.member_high else match_row.member_low end
  where auth.uid() is not null
    and public.current_user_can_explore()
    and match_row.status = 'active'
    and (match_row.member_low = auth.uid() or match_row.member_high = auth.uid())
  order by match_row.matched_at desc;
$$;

grant execute on function public.get_current_member_profile() to authenticated;
grant execute on function public.list_exploration_candidates() to authenticated;
grant execute on function public.list_user_matches() to authenticated;
revoke all on function public.get_current_member_profile() from public, anon;
revoke all on function public.list_exploration_candidates() from public, anon;
revoke all on function public.list_user_matches() from public, anon;

create or replace function public.get_match_room_state(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_partner_id uuid;
  v_match public.matches%rowtype;
  v_progress public.match_stage_progress%rowtype;
  v_own_profile public.profiles%rowtype;
  v_partner_profile public.profiles%rowtype;
  v_partner_intention text;
  v_stage1 jsonb;
  v_stage2 jsonb;
  v_my_choices text[];
  v_partner_choice_count integer;
  v_consensus text[];
  v_messages jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select * into v_match from public.matches as match_row
  where match_row.id = p_match_id and match_row.status = 'active'
    and (match_row.member_low = v_user_id or match_row.member_high = v_user_id)
    and public.current_user_can_explore();
  if not found then
    raise exception using errcode = '42501', message = 'Active match not found for this user';
  end if;
  v_partner_id := case when v_match.member_low = v_user_id then v_match.member_high else v_match.member_low end;

  insert into public.match_stage_progress (match_id, stage1_prompt_id, stage2_prompt_id)
  select p_match_id,
    (select question.id from public.prompt_questions as question where question.stage = 1 and question.active order by random() limit 1),
    (select question.id from public.prompt_questions as question where question.stage = 2 and question.active order by random() limit 1)
  on conflict (match_id) do nothing;

  select * into v_progress from public.match_stage_progress as progress where progress.match_id = p_match_id;
  if not found then
    raise exception using errcode = '55000', message = 'No active prompts are available';
  end if;

  select * into v_own_profile from public.profiles as profile where profile.id = v_user_id;
  select * into v_partner_profile from public.profiles as profile where profile.id = v_partner_id;
  select details.intention into v_partner_intention
  from public.member_private_details as details where details.user_id = v_partner_id;

  select jsonb_build_object(
    'myAnswer', (select answer.answer from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.user_id = v_user_id and answer.stage = 1),
    'partnerSubmitted', exists (select 1 from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.user_id = v_partner_id and answer.stage = 1),
    'revealedAnswers', case when (
      select count(*) = 2 from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.stage = 1
    ) then (
      select jsonb_agg(jsonb_build_object('userId', answer.user_id, 'answer', answer.answer) order by answer.submitted_at)
      from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.stage = 1
    ) else null end
  ) into v_stage1;

  select jsonb_build_object(
    'myAnswer', (select answer.answer from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.user_id = v_user_id and answer.stage = 2),
    'partnerSubmitted', exists (select 1 from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.user_id = v_partner_id and answer.stage = 2),
    'revealedAnswers', case when (
      select count(*) = 2 from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.stage = 2
    ) then (
      select jsonb_agg(jsonb_build_object('userId', answer.user_id, 'answer', answer.answer) order by answer.submitted_at)
      from public.match_stage_answers as answer where answer.match_id = p_match_id and answer.stage = 2
    ) else null end
  ) into v_stage2;

  select choice.choices into v_my_choices from public.match_micro_date_choices as choice
  where choice.match_id = p_match_id and choice.user_id = v_user_id;
  select count(*)::integer into v_partner_choice_count from public.match_micro_date_choices as choice
  where choice.match_id = p_match_id and choice.user_id = v_partner_id;
  if v_partner_choice_count = 1 and v_my_choices is not null then
    select coalesce(array_agg(item.choice), '{}') into v_consensus
    from unnest(v_my_choices) as item(choice)
    where item.choice = any (select unnest(partner.choices) from public.match_micro_date_choices as partner where partner.match_id = p_match_id and partner.user_id = v_partner_id);
  else
    v_consensus := '{}';
  end if;

  select coalesce(jsonb_agg(message_row order by message_row->>'createdAt'), '[]'::jsonb) into v_messages
  from (
    select jsonb_build_object('id', message.id, 'userId', message.user_id, 'body', message.body, 'createdAt', message.created_at) as message_row
    from public.match_room_messages as message
    where message.match_id = p_match_id
    order by message.created_at asc
    limit 100
  ) as recent_messages;

  return jsonb_build_object(
    'matchId', p_match_id,
    'currentStage', v_progress.current_stage,
    'unlockedPuzzles', v_progress.unlocked_puzzles,
    'stage1Prompt', (select jsonb_build_object('question', question.question, 'optionA', question.option_a, 'optionB', question.option_b, 'supplementLabel', question.supplement_label) from public.prompt_questions as question where question.id = v_progress.stage1_prompt_id),
    'stage2Prompt', (select jsonb_build_object('question', question.question) from public.prompt_questions as question where question.id = v_progress.stage2_prompt_id),
    'stage1', v_stage1,
    'stage2', v_stage2,
    'myDateChoices', to_jsonb(v_my_choices),
    'partnerDateSubmitted', v_partner_choice_count = 1,
    'dateConsensus', to_jsonb(v_consensus),
    'opponent', jsonb_build_object(
      'id', v_partner_id,
      'displayName', v_partner_profile.display_name,
      'city', v_partner_profile.city,
      'interests', case when v_progress.unlocked_puzzles >= 2 then to_jsonb(v_partner_profile.interests) else null end,
      'routine', case when v_progress.unlocked_puzzles >= 2 then to_jsonb(v_partner_profile.routine) else null end,
      'deepBio', case when v_progress.unlocked_puzzles >= 3 then to_jsonb(v_partner_profile.bio) else null end,
      'relationshipExpectations', case when v_progress.unlocked_puzzles >= 3 then to_jsonb(v_partner_intention) else null end,
      'avatarPath', case when v_progress.unlocked_puzzles >= 4 then to_jsonb(v_partner_profile.avatar_storage_path) else null end
    ),
    'messages', case when v_progress.unlocked_puzzles = 4 then v_messages else '[]'::jsonb end
  );
end;
$$;

create or replace function public.submit_match_stage_answer(p_match_id uuid, p_answer jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.match_stage_progress%rowtype;
  v_answer_count integer;
begin
  perform public.get_match_room_state(p_match_id);
  select * into v_progress from public.match_stage_progress as progress where progress.match_id = p_match_id for update;
  if v_progress.current_stage not in (1, 2) then
    raise exception using errcode = '55000', message = 'There is no answer step open';
  end if;
  if v_progress.current_stage = 1 and (
    coalesce(p_answer->>'choice', '') not in ('a', 'b')
    or char_length(coalesce(p_answer->>'supplement', '')) > 300
  ) then
    raise exception using errcode = '22023', message = 'Stage one needs a valid choice and a short optional supplement';
  end if;
  if v_progress.current_stage = 2 and (
    jsonb_typeof(p_answer->'answer') <> 'string'
    or char_length(btrim(coalesce(p_answer->>'answer', ''))) not between 1 and 500
  ) then
    raise exception using errcode = '22023', message = 'Stage two needs an answer between 1 and 500 characters';
  end if;

  insert into public.match_stage_answers (match_id, user_id, stage, answer)
  values (p_match_id, v_user_id, v_progress.current_stage, p_answer);
  select count(*)::integer into v_answer_count from public.match_stage_answers as answer
  where answer.match_id = p_match_id and answer.stage = v_progress.current_stage;
  if v_answer_count = 2 then
    update public.match_stage_progress
    set current_stage = v_progress.current_stage + 1,
        unlocked_puzzles = case when v_progress.current_stage = 1 then 2 else 3 end,
        updated_at = statement_timestamp()
    where match_id = p_match_id;
  end if;
  return jsonb_build_object('bothSubmitted', v_answer_count = 2, 'stage', v_progress.current_stage);
end;
$$;

create or replace function public.submit_micro_date_choices(p_match_id uuid, p_choices text[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_progress public.match_stage_progress%rowtype;
  v_match public.matches%rowtype;
  v_choice_count integer;
  v_partner_id uuid;
  v_partner_choices text[];
  v_consensus text[];
begin
  perform public.get_match_room_state(p_match_id);
  select * into v_progress from public.match_stage_progress as progress where progress.match_id = p_match_id for update;
  if v_progress.current_stage <> 3 or v_progress.unlocked_puzzles <> 3 then
    raise exception using errcode = '55000', message = 'Complete the first two stages before choosing a micro-date';
  end if;
  if cardinality(p_choices) <> 3 or (select count(distinct item.choice) from unnest(p_choices) as item(choice)) <> 3
    or exists (select 1 from unnest(p_choices) as item(choice) where item.choice not in (
      '散步逛街區', '咖啡店聊天', '逛書店選書', '河濱騎腳踏車',
      '夜市分食小吃', '看展覽或博物館', '公園野餐', '一起做甜點'
    )) then
    raise exception using errcode = '22023', message = 'Choose exactly three available micro-date options';
  end if;

  insert into public.match_micro_date_choices (match_id, user_id, choices)
  values (p_match_id, v_user_id, p_choices);
  select count(*)::integer into v_choice_count from public.match_micro_date_choices as choice
  where choice.match_id = p_match_id;
  if v_choice_count = 2 then
    select * into v_match from public.matches as match_row where match_row.id = p_match_id;
    v_partner_id := case when v_match.member_low = v_user_id then v_match.member_high else v_match.member_low end;
    select choice.choices into v_partner_choices from public.match_micro_date_choices as choice
    where choice.match_id = p_match_id and choice.user_id = v_partner_id;
    select coalesce(array_agg(item.choice), '{}') into v_consensus from unnest(p_choices) as item(choice) where item.choice = any(v_partner_choices);
    update public.match_stage_progress set unlocked_puzzles = 4, updated_at = statement_timestamp()
    where match_id = p_match_id;
  else
    v_consensus := '{}';
  end if;
  return jsonb_build_object('bothSubmitted', v_choice_count = 2, 'consensus', to_jsonb(v_consensus));
end;
$$;

revoke all on function public.get_match_room_state(uuid) from public, anon;
revoke all on function public.submit_match_stage_answer(uuid, jsonb) from public, anon;
revoke all on function public.submit_micro_date_choices(uuid, text[]) from public, anon;
grant execute on function public.get_match_room_state(uuid) to authenticated;
grant execute on function public.submit_match_stage_answer(uuid, jsonb) to authenticated;
grant execute on function public.submit_micro_date_choices(uuid, text[]) to authenticated;

create policy member_avatars_read_match_after_unlock
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = owner_id
    and exists (
      select 1 from public.matches as match_row
      join public.match_stage_progress as progress on progress.match_id = match_row.id
      where match_row.status = 'active' and progress.unlocked_puzzles = 4
        and public.current_user_can_explore()
        and (
          (match_row.member_low = (select auth.uid()) and match_row.member_high::text = owner_id)
          or (match_row.member_high = (select auth.uid()) and match_row.member_low::text = owner_id)
        )
    )
  );

create policy match_micro_date_choices_self_read
  on public.match_micro_date_choices for select to authenticated
  using (user_id = (select auth.uid()) and public.current_user_can_explore());
