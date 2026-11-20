-- Discovery filters profiles by status. Column-level SELECT grants must
-- include every column referenced by the query; RLS still limits visible rows.
grant select (status)
  on public.profiles
  to authenticated;
