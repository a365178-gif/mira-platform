insert into public.member_private_details (user_id)
select profile.id
from public.profiles as profile
on conflict (user_id) do nothing;

create or replace function public.get_current_member_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile jsonb;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select jsonb_build_object(
    'id', profile.id,
    'displayName', profile.display_name,
    'bio', profile.bio,
    'city', profile.city,
    'interests', profile.interests,
    'routine', profile.routine,
    'avatarStoragePath', profile.avatar_storage_path,
    'gender', private_details.gender,
    'interestedIn', private_details.interested_in,
    'intention', private_details.intention
  )
  into v_profile
  from public.profiles as profile
  left join public.member_private_details as private_details
    on private_details.user_id = profile.id
  where profile.id = auth.uid();

  if v_profile is null then
    raise exception using errcode = 'P0002', message = 'Member profile not found';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.get_current_member_profile() from public, anon;
grant execute on function public.get_current_member_profile() to authenticated;
