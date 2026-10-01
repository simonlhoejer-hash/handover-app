-- Fjern personnavne uden at slette overleveringer eller kommentarer.
update public.handover_notes
set author_name = 'Anonym',
    receiver_name = 'Anonym',
    read_by = case when read_by is null then null else 'confirmed' end;

update public.handover_comments
set author_name = 'Anonym';
