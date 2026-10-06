-- Lets a group's own supervisor add/edit/retire criteria that apply only
-- to their group, without needing manager access -- while every existing
-- criterion (group_id null) stays global/shared exactly as before.
-- sort_order becomes a float so a single row can be moved to sit between
-- any two neighbours (a midpoint reorder) without ever having to write to
-- a row the mover doesn't own -- required for a supervisor to be able to
-- reorder their own item relative to a global one they can't edit.
alter table public.criteria add column group_id uuid references public.groups(id) on delete cascade;
alter table public.criteria alter column sort_order type double precision;

alter policy "staff can read criteria" on public.criteria
  using (private.current_staff_role() = 'manager' or group_id is null or group_id = private.current_staff_group_id());

create policy "supervisor can insert own group criteria" on public.criteria for insert to authenticated
  with check (group_id = private.current_staff_group_id());

create policy "supervisor can update own group criteria" on public.criteria for update to authenticated
  using (group_id = private.current_staff_group_id())
  with check (group_id = private.current_staff_group_id());
