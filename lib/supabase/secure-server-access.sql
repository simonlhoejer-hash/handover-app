-- Lås Supabase, så browserens offentlige anon-nøgle ikke kan læse eller ændre data.
-- VIGTIG RÆKKEFØLGE:
-- 1. Udgiv først appens sikre API-ruter og serverhemmelighed.
-- 2. Test Crown og Pearl.
-- 3. Kør derefter denne fil én gang i Supabase SQL Editor.

begin;

revoke all on table public.handover_notes from public, anon, authenticated;
revoke all on table public.handover_comments from public, anon, authenticated;
revoke all on table public.food_waste_entries from public, anon, authenticated;
revoke all on table public.food_waste_guest_counts from public, anon, authenticated;

alter table public.handover_notes enable row level security;
alter table public.handover_comments enable row level security;
alter table public.food_waste_entries enable row level security;
alter table public.food_waste_guest_counts enable row level security;

-- Fjern gamle offentlige policies. Serverens secret/service-role omgår RLS.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'handover_notes',
        'handover_comments',
        'food_waste_entries',
        'food_waste_guest_counts'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end;
$$;

-- Overleveringsbilleder leveres nu gennem appens beskyttede billedrute.
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png']
where id = 'handover-images';

-- Gamle, ikke-anvendte buckets skal heller ikke være offentlige.
update storage.buckets
set public = false
where id in ('afdelingsmoeder', 'materials');

-- Fjern storage-policies, der gav offentlig adgang til de tre buckets.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        coalesce(qual, '') ~ '(handover-images|afdelingsmoeder|materials)'
        or coalesce(with_check, '') ~ '(handover-images|afdelingsmoeder|materials)'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', policy_row.policyname);
  end loop;
end;
$$;

-- Triggerfunktioner skal have fast search_path og må ikke kaldes direkte.
-- Ældre projektversioner har ikke nødvendigvis begge funktioner.
do $$
begin
  if to_regprocedure('public.set_handover_note_updated_at()') is not null then
    execute 'alter function public.set_handover_note_updated_at() set search_path = public';
    execute 'revoke all on function public.set_handover_note_updated_at() from public, anon, authenticated';
  end if;

  if to_regprocedure('public.lock_published_handover_notes()') is not null then
    execute 'alter function public.lock_published_handover_notes() set search_path = public';
    execute 'revoke all on function public.lock_published_handover_notes() from public, anon, authenticated';
  end if;
end;
$$;

commit;

-- Kontrol: der bør ikke stå anon/authenticated i policies eller privileges.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in (
  'handover_notes',
  'handover_comments',
  'food_waste_entries',
  'food_waste_guest_counts'
)) or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'handover_notes',
    'handover_comments',
    'food_waste_entries',
    'food_waste_guest_counts'
  )
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
