-- KÃ¸r filen Ã©n gang i Supabase SQL Editor.
-- Funktionen kan kun kaldes med service_role-nÃ¸glen fra serveren.

create or replace function public.delete_handover_as_souschef(
  p_handover_id uuid,
  p_handover_department text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_handover_department not in ('crown', 'pearl') then
    raise exception 'Invalid department';
  end if;

  if not exists (
    select 1 from public.handover_notes
    where id = p_handover_id
      and department = p_handover_department
      and parti <> '__handover_folders__'
      and parti <> 'Souschef opfÃ¸lgning'
  ) then
    raise exception 'Handover not found';
  end if;

  perform set_config('app.souschef_delete', 'on', true);

  delete from public.handover_comments where handover_id = p_handover_id;
  delete from public.handover_notes
  where id = p_handover_id and department = p_handover_department;
end;
$$;

revoke all on function public.delete_handover_as_souschef(uuid, text) from public;
revoke all on function public.delete_handover_as_souschef(uuid, text) from anon;
revoke all on function public.delete_handover_as_souschef(uuid, text) from authenticated;
grant execute on function public.delete_handover_as_souschef(uuid, text) to service_role;

create or replace function public.lock_published_handover_notes()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and old.status = 'published' then
    if current_setting('app.souschef_delete', true) = 'on' then
      return old;
    end if;

    if
      current_setting('app.retention_cleanup', true) = 'on' and
      old.created_at < now() - interval '12 months'
    then
      return old;
    end if;

    raise exception 'Published handovers cannot be deleted';
  end if;

  if tg_op = 'UPDATE' and old.status = 'published' then
    if
      new.department is distinct from old.department or
      new.parti is distinct from old.parti or
      new.author_name is distinct from old.author_name or
      new.receiver_name is distinct from old.receiver_name or
      new.shift_date is distinct from old.shift_date or
      new.note is distinct from old.note or
      new.images::jsonb is distinct from old.images::jsonb or
      new.status is distinct from old.status
    then
      raise exception 'Published handovers cannot be edited';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
