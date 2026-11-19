create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.profile_status as enum (
  'draft',
  'active',
  'paused',
  'suspended'
);

create type public.age_verification_method as enum (
  'provider',
  'manual'
);

create type public.age_verification_status as enum (
  'pending',
  'verified',
  'rejected',
  'expired'
);

create type public.exploration_status as enum (
  'active',
  'passed',
  'matched',
  'expired'
);

create type public.exploration_decision as enum (
  'interested',
  'pass'
);

create type public.match_status as enum (
  'active',
  'ended'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (
    display_name is null
    or char_length(btrim(display_name)) between 1 and 50
  ),
  bio text check (bio is null or char_length(bio) <= 500),
  gender text check (
    gender is null
    or char_length(btrim(gender)) between 1 and 40
  ),
  city text check (
    city is null
    or char_length(btrim(city)) between 1 and 80
  ),
  avatar_storage_path text,
  interests text[] not null default '{}',
  status public.profile_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_interests_limit check (cardinality(interests) <= 10)
);

create table public.age_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  method public.age_verification_method not null,
  status public.age_verification_status not null default 'pending',
  provider_name text,
  provider_reference text,
  result_is_adult boolean,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_id uuid references auth.users (id) on delete set null,
  expires_at timestamptz,
  constraint age_verifications_result_matches_status check (
    (status = 'pending' and result_is_adult is null and reviewed_at is null)
    or (status = 'verified' and result_is_adult is true and reviewed_at is not null)
    or (status = 'rejected' and reviewed_at is not null)
    or status = 'expired'
  ),
  constraint age_verifications_provider_fields check (
    method = 'provider'
    or (provider_name is null and provider_reference is null)
  )
);

create unique index age_verifications_one_pending_per_user
  on public.age_verifications (user_id)
  where status = 'pending';

create table public.exploration_sessions (
  id uuid primary key default gen_random_uuid(),
  member_low uuid not null references public.profiles (id) on delete cascade,
  member_high uuid not null references public.profiles (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  stage smallint not null default 1 check (stage between 1 and 3),
  status public.exploration_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exploration_sessions_distinct_members check (member_low < member_high),
  constraint exploration_sessions_creator_is_member check (
    created_by = member_low or created_by = member_high
  ),
  constraint exploration_sessions_match_is_stage_three check (
    (status = 'matched') = (stage = 3)
  )
);

create unique index exploration_sessions_one_open_pair
  on public.exploration_sessions (member_low, member_high)
  where status in ('active', 'matched');

create table public.exploration_responses (
  session_id uuid not null references public.exploration_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  decision public.exploration_decision not null,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  exploration_session_id uuid not null unique
    references public.exploration_sessions (id) on delete cascade,
  member_low uuid not null references public.profiles (id) on delete cascade,
  member_high uuid not null references public.profiles (id) on delete cascade,
  status public.match_status not null default 'active',
  matched_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint matches_distinct_members check (member_low < member_high),
  constraint matches_end_time_matches_status check (
    (status = 'active' and ended_at is null)
    or (status = 'ended' and ended_at is not null)
  )
);

create unique index matches_one_active_pair
  on public.matches (member_low, member_high)
  where status = 'active';

create index age_verifications_user_status_idx
  on public.age_verifications (user_id, status, expires_at);

create index exploration_sessions_members_idx
  on public.exploration_sessions (member_low, member_high, created_at desc);

create index exploration_responses_user_idx
  on public.exploration_responses (user_id, created_at desc);

create index matches_members_idx
  on public.matches (member_low, member_high, matched_at desc);

create function private.is_verified_adult(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.age_verifications as verification
    where verification.user_id = p_user_id
      and verification.status = 'verified'
      and verification.result_is_adult is true
      and (
        verification.expires_at is null
        or verification.expires_at > statement_timestamp()
      )
  );
$$;

revoke all on function private.is_verified_adult(uuid)
  from public, anon, authenticated;

create function public.current_user_is_verified_adult()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_verified_adult(auth.uid());
$$;

create function public.current_user_can_explore()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.status = 'active'
      and private.is_verified_adult(profile.id)
  );
$$;

create function public.can_discover_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_can_explore()
    and exists (
      select 1
      from public.profiles as candidate
      where candidate.id = p_profile_id
        and candidate.status = 'active'
        and private.is_verified_adult(candidate.id)
    );
$$;

revoke all on function public.current_user_is_verified_adult()
    from public, anon;
revoke all on function public.current_user_can_explore()
    from public, anon;
revoke all on function public.can_discover_profile(uuid)
    from public, anon;

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create function private.guard_profile_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active'
    and not private.is_verified_adult(new.id)
  then
    raise exception using
      errcode = '23514',
      message = 'A profile requires a current adult verification before activation';
  end if;
  return new;
end;
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated;
revoke all on function private.guard_profile_activation()
  from public, anon, authenticated;
revoke all on function private.set_updated_at()
  from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

create trigger profiles_guard_activation
  before insert or update of status on public.profiles
  for each row execute function private.guard_profile_activation();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger exploration_sessions_set_updated_at
  before update on public.exploration_sessions
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.age_verifications enable row level security;
alter table public.exploration_sessions enable row level security;
alter table public.exploration_responses enable row level security;
alter table public.matches enable row level security;

create policy profiles_read_self_or_discoverable
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.can_discover_profile(id)
  );

create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy age_verifications_read_self
  on public.age_verifications
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy age_verifications_request_self
  on public.age_verifications
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and result_is_adult is null
    and provider_reference is null
    and reviewer_id is null
    and reviewed_at is null
  );

create policy exploration_sessions_read_participant
  on public.exploration_sessions
  for select
  to authenticated
  using (
    (member_low = (select auth.uid()) or member_high = (select auth.uid()))
    and public.current_user_is_verified_adult()
  );

create policy exploration_responses_read_own
  on public.exploration_responses
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy matches_read_participant
  on public.matches
  for select
  to authenticated
  using (
    (member_low = (select auth.uid()) or member_high = (select auth.uid()))
    and public.current_user_is_verified_adult()
  );

revoke all on table
  public.profiles,
  public.age_verifications,
  public.exploration_sessions,
  public.exploration_responses,
  public.matches
from public, anon, authenticated;

grant select (
  id,
  display_name,
  bio,
  gender,
  city,
  avatar_storage_path,
  interests,
  created_at
) on public.profiles to authenticated;

grant update (
  display_name,
  bio,
  gender,
  city,
  avatar_storage_path,
  interests
) on public.profiles to authenticated;

grant select (
  id,
  user_id,
  method,
  status,
  submitted_at,
  reviewed_at,
  expires_at
) on public.age_verifications to authenticated;

grant insert (user_id, method)
  on public.age_verifications to authenticated;

grant select on public.exploration_sessions to authenticated;
grant select on public.exploration_responses to authenticated;
grant select on public.matches to authenticated;

grant all on table
  public.profiles,
  public.age_verifications,
  public.exploration_sessions,
  public.exploration_responses,
  public.matches
to service_role;

grant execute on function public.current_user_is_verified_adult()
  to authenticated;
grant execute on function public.current_user_can_explore()
  to authenticated;
grant execute on function public.can_discover_profile(uuid)
  to authenticated;

create function public.start_exploration(p_candidate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null or not public.current_user_can_explore() then
    raise exception using
      errcode = '42501',
      message = 'A verified, active adult profile is required to explore';
  end if;

  if p_candidate_id is null or p_candidate_id = v_user_id then
    raise exception using
      errcode = '22023',
      message = 'The candidate must be another user';
  end if;

  if not public.can_discover_profile(p_candidate_id) then
    raise exception using
      errcode = '42501',
      message = 'The candidate is not available for exploration';
  end if;

  insert into public.exploration_sessions (
    member_low,
    member_high,
    created_by
  )
  values (
    least(v_user_id, p_candidate_id),
    greatest(v_user_id, p_candidate_id),
    v_user_id
  )
  on conflict (member_low, member_high)
    where status in ('active', 'matched')
  do update set updated_at = statement_timestamp()
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create function public.record_exploration_response(
  p_session_id uuid,
  p_decision public.exploration_decision
)
returns table (
  stage smallint,
  status public.exploration_status,
  match_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.exploration_sessions%rowtype;
  v_other_member uuid;
  v_stage smallint;
  v_status public.exploration_status;
  v_match_id uuid;
begin
  if v_user_id is null or not public.current_user_can_explore() then
    raise exception using
      errcode = '42501',
      message = 'A verified, active adult profile is required to respond';
  end if;

  select session.*
  into v_session
  from public.exploration_sessions as session
  where session.id = p_session_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Exploration session not found';
  end if;

  if v_user_id <> v_session.member_low
    and v_user_id <> v_session.member_high
  then
    raise exception using
      errcode = '42501',
      message = 'Only session participants may respond';
  end if;

  if v_session.status <> 'active' then
    raise exception using
      errcode = '55000',
      message = 'Exploration session is no longer active';
  end if;

  v_other_member := case
    when v_user_id = v_session.member_low then v_session.member_high
    else v_session.member_low
  end;

  insert into public.exploration_responses (session_id, user_id, decision)
  values (p_session_id, v_user_id, p_decision)
  on conflict (session_id, user_id)
  do update set
    decision = excluded.decision,
    created_at = statement_timestamp();

  if p_decision = 'pass' then
    update public.exploration_sessions
    set stage = 2,
        status = 'passed'
    where id = p_session_id;

    return query select 2::smallint, 'passed'::public.exploration_status, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.exploration_responses as response
    where response.session_id = p_session_id
      and response.user_id = v_other_member
      and response.decision = 'interested'
  ) then
    update public.exploration_sessions
    set stage = 3,
        status = 'matched'
    where id = p_session_id;

    insert into public.matches (
      exploration_session_id,
      member_low,
      member_high
    )
    values (
      p_session_id,
      v_session.member_low,
      v_session.member_high
    )
    on conflict (exploration_session_id) do nothing;

    select match_row.id
    into v_match_id
    from public.matches as match_row
    where match_row.exploration_session_id = p_session_id;

    v_stage := 3;
    v_status := 'matched';
  else
    update public.exploration_sessions
    set stage = 2
    where id = p_session_id;

    v_stage := 2;
    v_status := 'active';
  end if;

  return query select v_stage, v_status, v_match_id;
end;
$$;

revoke all on function public.start_exploration(uuid)
  from public, anon;
revoke all on function public.record_exploration_response(
  uuid,
  public.exploration_decision
) from public, anon;

grant execute on function public.start_exploration(uuid)
  to authenticated;
grant execute on function public.record_exploration_response(
  uuid,
  public.exploration_decision
) to authenticated;
