-- Lets the manager pull a previously-approved supervisor's access, so
-- granting staff_profiles access isn't a one-way door. Expressed as a
-- single SQL (not plpgsql) function with the authorization checks inside
-- the DELETE's own WHERE clause -- guards a manager can't revoke
-- themselves, can't revoke another manager, and a non-manager caller
-- deletes nothing at all.
create or replace function private.revoke_staff_access_impl(p_user_id uuid)
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  delete from public.staff_profiles
  where user_id = p_user_id
    and private.is_manager()
    and user_id <> auth.uid()
    and role <> 'manager'
  returning true
$$;

create or replace function public.revoke_staff_access(p_user_id uuid)
returns boolean
language sql
security definer
set search_path to 'pg_catalog'
as $$ select private.revoke_staff_access_impl(p_user_id) $$;

revoke all on function public.revoke_staff_access(uuid) from public;
grant execute on function public.revoke_staff_access(uuid) to authenticated;
revoke all on function private.revoke_staff_access_impl(uuid) from public;
