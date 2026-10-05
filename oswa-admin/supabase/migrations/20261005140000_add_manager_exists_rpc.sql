-- The frontend needs to tell apart "no manager exists yet anywhere" (show
-- the one-click claim-manager button) from "this particular signed-in user
-- has no staff_profiles row yet" (every legitimate new supervisor applicant,
-- always true for them even after a manager already exists). A plain client
-- query can't answer "does any manager exist" because RLS on staff_profiles
-- only lets a user read their own row (or all rows, if THEY are the
-- manager) -- a brand-new applicant gets 0 rows back either way, so the
-- frontend was defaulting to "no manager yet" for every new signup
-- regardless of reality, incorrectly showing the claim button to supervisor
-- applicants after a manager already existed (harmless server-side --
-- claim_first_manager_impl's own exists() guard would still correctly
-- return false -- but the UI never offered the actual request-access form).
create or replace function private.manager_exists_impl()
returns boolean
language sql
security definer
set search_path to 'public'
as $$
  select exists(select 1 from staff_profiles where role = 'manager')
$$;

create or replace function public.manager_exists()
returns boolean
language sql
security definer
set search_path to 'pg_catalog'
as $$
  select private.manager_exists_impl()
$$;

-- CREATE FUNCTION grants EXECUTE to PUBLIC by default; match the same
-- least-privilege pattern as the sibling staff RPCs (authenticated only).
revoke execute on function public.manager_exists() from public;
grant execute on function public.manager_exists() to authenticated;
