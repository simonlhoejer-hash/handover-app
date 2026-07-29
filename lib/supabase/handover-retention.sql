-- Automatisk sletning af overleveringsdata efter 12 måneder.
-- Kør filen én gang i Supabase SQL Editor.

create extension if not exists pg_cron with schema extensions;

-- Bevar låsen på publicerede overleveringer, men tillad den interne
-- oprydningsfunktion at slette rækker, når de faktisk er over 12 måneder.
create or replace function public.lock_published_handover_notes()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.status = 'published' then
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

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.delete_expired_handovers()
returns void
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  image_url text;
  object_name text;
begin
  perform set_config('app.retention_cleanup', 'on', true);

  -- Slet billederne fra den offentlige storage-bucket.
  for image_url in
    select jsonb_array_elements_text(coalesce(images::jsonb, '[]'::jsonb))
    from public.handover_notes
    where created_at < now() - interval '12 months'
  loop
    object_name := split_part(
      image_url,
      '/storage/v1/object/public/handover-images/',
      2
    );

    if object_name <> '' then
      delete from storage.objects
      where bucket_id = 'handover-images'
        and name = object_name;
    end if;
  end loop;

  -- Slet kommentarer før overleveringer, så det også virker uden ON DELETE CASCADE.
  delete from public.handover_comments
  where handover_id in (
    select id
    from public.handover_notes
    where created_at < now() - interval '12 months'
  );

  delete from public.handover_notes
  where created_at < now() - interval '12 months';
end;
$$;

revoke all on function public.delete_expired_handovers() from public;
revoke all on function public.delete_expired_handovers() from anon;
revoke all on function public.delete_expired_handovers() from authenticated;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'delete-expired-handovers'
  ) then
    perform cron.unschedule('delete-expired-handovers');
  end if;
end;
$$;

select cron.schedule(
  'delete-expired-handovers',
  '15 3 * * *',
  $$select public.delete_expired_handovers();$$
);
