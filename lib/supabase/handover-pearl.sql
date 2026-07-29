-- Overleveringer er allerede adskilt via department:
-- Crown Galley = 'galley'
-- Pearl Galley = 'pearl'

-- Fjern en eventuel ældre constraint, som kun tillader galley/shop/admin.
alter table public.handover_notes
drop constraint if exists handover_notes_department_check;

alter table public.handover_notes
add constraint handover_notes_department_check
check (department in ('galley', 'shop', 'admin', 'pearl'));

-- Sikrer fortsat kun én aktiv kladde pr. skib/afdeling og parti.
-- Den eksisterende indeksdefinition er allerede korrekt, fordi department indgår.
create unique index if not exists handover_notes_one_active_draft
on public.handover_notes (department, parti)
where status = 'draft';
