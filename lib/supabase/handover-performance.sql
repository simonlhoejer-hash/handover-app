-- Gør statusopslag på Galley- og Pearl-forsiderne hurtigere.
-- Kan køres flere gange uden at ændre eksisterende data.

create index if not exists handover_notes_department_status_dates_idx
on public.handover_notes (
  department,
  status,
  shift_date desc,
  updated_at desc,
  created_at desc
);
