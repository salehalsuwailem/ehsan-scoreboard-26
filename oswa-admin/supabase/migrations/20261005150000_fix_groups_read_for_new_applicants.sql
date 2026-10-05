-- "staff can read groups" required current_staff_role() IS NOT NULL, i.e.
-- only someone who ALREADY has an approved staff_profiles row could read
-- group names. But the group picker on the "request supervisor access"
-- form is shown to exactly the population that does NOT have a role yet
-- -- so every new applicant got zero groups back and an empty dropdown,
-- making it impossible to ever submit a request with a group selected.
-- Group names carry no sensitive data, so broaden this to any signed-in
-- user rather than gating it on already having staff access.
alter policy "staff can read groups" on public.groups
  using (auth.uid() is not null);
