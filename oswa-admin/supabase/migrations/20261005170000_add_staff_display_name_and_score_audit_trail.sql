-- Multiple supervisors can edit the same group's scores, so "who entered
-- this" needs a real answer. staff_profiles had no human-readable name at
-- all (just user_id/role/group_id), and scores had no actor column.

-- 1. A display name for each staff member, shown instead of a raw id/email.
alter table public.staff_profiles add column display_name text;

-- 2. Carry the applicant's display_name (already captured on their
-- request) onto their staff_profiles row when a manager approves them.
create or replace function private.review_staff_access_request_impl(p_request_id uuid, p_action text, p_group_id uuid default null)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare r public.staff_access_requests%rowtype;
begin
  if not private.is_manager() then raise exception 'manager access required'; end if;
  select * into r from public.staff_access_requests where id = p_request_id for update;
  if r.id is null or r.status <> 'pending' then raise exception 'request is not pending'; end if;
  if p_action = 'approve' then
    if p_group_id is null then raise exception 'group required'; end if;
    if not exists(select 1 from public.groups where id = p_group_id) then raise exception 'invalid group'; end if;
    insert into public.staff_profiles(user_id, role, group_id, display_name)
      values (r.user_id, 'supervisor', p_group_id, r.display_name)
      on conflict (user_id) do update
        set role = 'supervisor', group_id = excluded.group_id, display_name = excluded.display_name, updated_at = now();
    update public.staff_access_requests set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() where id = r.id;
  elsif p_action = 'reject' then
    update public.staff_access_requests set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() where id = r.id;
  else
    raise exception 'invalid action';
  end if;
  return true;
end
$$;

-- 3. Self-service rename (manager included -- they never go through the
-- request flow, so they'd otherwise have no way to set their own name).
-- Scoped hard to auth.uid()'s own row; cannot touch role/group_id/anyone else.
create or replace function private.update_own_display_name_impl(p_display_name text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  update public.staff_profiles
    set display_name = nullif(trim(p_display_name), ''), updated_at = now()
    where user_id = auth.uid();
end
$$;

create or replace function public.update_own_display_name(p_display_name text)
returns void
language sql
security definer
set search_path to 'pg_catalog'
as $$ select private.update_own_display_name_impl(p_display_name) $$;

revoke execute on function public.update_own_display_name(text) from public;
grant execute on function public.update_own_display_name(text) to authenticated;

-- 4. Any staff member (not just the manager) can read the staff directory
-- now that it's just names/roles/groups -- needed so a supervisor sees
-- who the OTHER editors in their group are, not just themselves.
alter policy "staff can read own profile" on public.staff_profiles
  using (private.current_staff_role() is not null);

-- 5. scores.updated_by: who last touched this exact score. Set by a
-- trigger from auth.uid(), never trusted from the client -- the upsert
-- payload the frontend sends never includes it, and even if it did, the
-- trigger overwrites it unconditionally on every insert/update.
alter table public.scores add column updated_by uuid references auth.users(id);

create or replace function private.scores_set_updated_by()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  new.updated_by := auth.uid();
  return new;
end
$$;

create trigger scores_set_updated_by
  before insert or update on public.scores
  for each row execute function private.scores_set_updated_by();

-- 6. Backfill: one real approval went through between submitting this
-- request and this migration landing, so its staff_profiles row never
-- got the display_name copy from step 2 above.
update public.staff_profiles sp
set display_name = sar.display_name
from public.staff_access_requests sar
where sar.user_id = sp.user_id
  and sar.status = 'approved'
  and sp.display_name is null
  and sar.display_name is not null;
