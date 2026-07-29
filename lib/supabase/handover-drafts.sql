alter table public.handover_notes
  add column if not exists status text not null default 'published';

alter table public.handover_notes
  add column if not exists draft_saved_at timestamptz;

alter table public.handover_notes
  add column if not exists updated_at timestamptz not null default now();

alter table public.handover_notes
  drop constraint if exists handover_notes_status_check;

alter table public.handover_notes
  add constraint handover_notes_status_check
  check (status in ('draft', 'published'));

update public.handover_notes
set status = 'published'
where status is null;

create unique index if not exists handover_notes_one_active_draft
on public.handover_notes (department, parti)
where status = 'draft';

create or replace function public.set_handover_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_handover_notes_updated_at on public.handover_notes;

create trigger set_handover_notes_updated_at
before update on public.handover_notes
for each row
execute function public.set_handover_notes_updated_at();

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

drop trigger if exists lock_published_handover_notes_update on public.handover_notes;
drop trigger if exists lock_published_handover_notes_delete on public.handover_notes;

create trigger lock_published_handover_notes_update
before update on public.handover_notes
for each row
execute function public.lock_published_handover_notes();

create trigger lock_published_handover_notes_delete
before delete on public.handover_notes
for each row
execute function public.lock_published_handover_notes();
