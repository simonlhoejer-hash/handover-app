-- Kør filen én gang i Supabase SQL Editor.
-- Funktionen kan kun kaldes med service_role-nøglen fra serveren.

create or replace function public.edit_handover_as_souschef(
  p_handover_id uuid,
  p_handover_department text,
  p_author_name text,
  p_receiver_name text,
  p_note text
)
returns setof public.handover_notes
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_handover_department not in ('crown', 'pearl') then
    raise exception 'Invalid department';
  end if;

  if nullif(trim(p_author_name), '') is null
    or nullif(trim(p_receiver_name), '') is null
    or nullif(trim(regexp_replace(p_note, '<[^>]*>', '', 'g')), '') is null then
    raise exception 'Sender, recipient and note are required';
  end if;

  perform set_config('app.souschef_edit', 'on', true);

  return query
  update public.handover_notes
  set author_name = trim(p_author_name),
      receiver_name = trim(p_receiver_name),
      note = p_note
  where id = p_handover_id
    and department = p_handover_department
    and parti <> '__handover_folders__'
    and parti <> 'Souschef opfølgning'
  returning *;
end;
$$;

revoke all on function public.edit_handover_as_souschef(uuid, text, text, text, text) from public;
revoke all on function public.edit_handover_as_souschef(uuid, text, text, text, text) from anon;
revoke all on function public.edit_handover_as_souschef(uuid, text, text, text, text) from authenticated;
grant execute on function public.edit_handover_as_souschef(uuid, text, text, text, text) to service_role;

create or replace function public.lock_published_handover_notes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.status = 'published' then
    if current_setting('app.souschef_delete', true) = 'on' then return old; end if;
    if current_setting('app.retention_cleanup', true) = 'on'
      and old.created_at < now() - interval '12 months' then return old; end if;
    raise exception 'Published handovers cannot be deleted';
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    if current_setting('app.souschef_edit', true) = 'on' then return new; end if;
    if new.department is distinct from old.department
      or new.parti is distinct from old.parti
      or new.author_name is distinct from old.author_name
      or new.receiver_name is distinct from old.receiver_name
      or new.shift_date is distinct from old.shift_date
      or new.note is distinct from old.note
      or new.images::jsonb is distinct from old.images::jsonb
      or new.status is distinct from old.status then
      raise exception 'Published handovers cannot be edited';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
