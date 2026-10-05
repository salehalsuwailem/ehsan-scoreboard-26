-- "manager can manage staff profiles" is an ALL policy. For INSERT,
-- Postgres only evaluates WITH CHECK (never USING) — so its old
-- with_check, (role = 'manager') OR (group_id IS NOT NULL), never actually
-- required the caller to BE a manager. Any authenticated user (who holds
-- a plain INSERT grant on this table) could insert a row for themselves
-- with role='manager', bypassing claim_first_manager()'s "only when no
-- manager exists yet" guard entirely — a real self-escalation hole,
-- confirmed by direct test (rolled back, no residue). The USING clause
-- was only ever enforced for UPDATE/DELETE/SELECT, not INSERT, which is
-- exactly the gap. This re-adds the actual authorization check to
-- WITH CHECK, so every INSERT and UPDATE under this policy requires the
-- caller to already be a manager, same as the policy's name always implied.
alter policy "manager can manage staff profiles" on public.staff_profiles
  with check (
    private.current_staff_role() = 'manager'
    and ((role = 'manager') or (group_id is not null))
  );
