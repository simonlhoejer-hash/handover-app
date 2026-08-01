-- Gyldige afdelinger i den nuværende Crown/Pearl-opsætning.
-- Filen ændrer ikke eksisterende overleveringer.

alter table public.handover_notes
drop constraint if exists handover_notes_department_check;

alter table public.handover_notes
add constraint handover_notes_department_check
check (department in ('crown', 'shop', 'admin', 'pearl'));

create unique index if not exists handover_notes_one_active_draft
on public.handover_notes (department, parti)
where status = 'draft';
