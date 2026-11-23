create or replace function public.test_activate_adult_member(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception using errcode = '42501', message = 'Service role required';
  end if;

  if p_user_id is null or not exists (
    select 1 from auth.users where id = p_user_id
  ) then
    raise exception using errcode = 'P0002', message = 'User not found';
  end if;

  if not exists (
    select 1 from public.age_verifications
    where user_id = p_user_id
      and status = 'verified'
      and result_is_adult is true
      and (expires_at is null or expires_at > statement_timestamp())
  ) then
    insert into public.age_verifications (
      user_id, method, status, result_is_adult, submitted_at, reviewed_at
    ) values (
      p_user_id, 'self_attested_test', 'verified', true,
      statement_timestamp(), statement_timestamp()
    );
  end if;

  update public.profiles
  set status = 'active', updated_at = statement_timestamp()
  where id = p_user_id;

  return jsonb_build_object('verified', true, 'active', true, 'test_only', true);
end;
$$;

revoke all on function public.test_activate_adult_member(uuid) from public, anon, authenticated;
grant execute on function public.test_activate_adult_member(uuid) to service_role;
