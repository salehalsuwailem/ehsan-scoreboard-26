-- Group names moved from the terse "3+4"/"5+6"/"7+8" shorthand to the
-- descriptive form the manager asked for. Every screen already reads the
-- name from this table dynamically (board filter, access-request picker,
-- results list) so this is a pure data change, no code change needed.
alter table public.groups drop constraint groups_name_check;

update public.groups set name = 'الصف الثالث والرابع' where name = '3+4';
update public.groups set name = 'الصف الخامس والسادس' where name = '5+6';
update public.groups set name = 'الصف السابع والثامن' where name = '7+8';

alter table public.groups add constraint groups_name_check
  check (name = any (array['الصف الثالث والرابع','الصف الخامس والسادس','الصف السابع والثامن']));
