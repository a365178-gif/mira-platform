create table public.member_private_details (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  gender text check (
    gender is null
    or gender in ('女性', '男性', '非二元性別', '暫不透露')
  ),
  interested_in text check (
    interested_in is null
    or interested_in in ('女性', '男性', '不限性別')
  ),
  intention text check (
    intention is null
    or intention in ('認真交往', '先從朋友開始', '拓展社交', '尚未確定')
  ),
  updated_at timestamptz not null default now()
);

insert into public.member_private_details (user_id, gender)
select id, gender
from public.profiles
on conflict (user_id) do update set gender = excluded.gender;

update public.profiles set gender = null where gender is not null;
revoke select (gender) on public.profiles from authenticated;
revoke update (gender) on public.profiles from authenticated;

alter table public.member_private_details enable row level security;
revoke all on public.member_private_details from public, anon, authenticated;
grant select (user_id, gender, interested_in, intention, updated_at)
  on public.member_private_details to authenticated;
grant update (gender, interested_in, intention)
  on public.member_private_details to authenticated;
grant all on public.member_private_details to service_role;

create policy member_private_details_read_self
  on public.member_private_details
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy member_private_details_update_self
  on public.member_private_details
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger member_private_details_set_updated_at
  before update on public.member_private_details
  for each row execute function private.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nickname text := left(btrim(coalesce(v_metadata ->> 'nickname', '')), 50);
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(v_nickname, ''))
  on conflict (id) do nothing;

  insert into public.member_private_details (
    user_id,
    gender,
    interested_in,
    intention
  )
  values (
    new.id,
    case when v_metadata ->> 'gender' in ('女性', '男性', '非二元性別', '暫不透露')
      then v_metadata ->> 'gender' end,
    case when v_metadata ->> 'interested_in' in ('女性', '男性', '不限性別')
      then v_metadata ->> 'interested_in' end,
    case when v_metadata ->> 'intention' in ('認真交往', '先從朋友開始', '拓展社交', '尚未確定')
      then v_metadata ->> 'intention' end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user()
  from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-avatars', 'member-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

create policy member_avatars_read_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy member_avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'member-avatars'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy member_avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'member-avatars'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy member_avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'member-avatars'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
