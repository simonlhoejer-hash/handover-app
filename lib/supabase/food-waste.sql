create table if not exists public.food_waste_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  waste_date date not null default current_date,
  location_name text not null,
  quantity_kg numeric not null,
  comment text,
  vessel text not null default 'crown'
);

create table if not exists public.food_waste_guest_counts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  service_date date not null default current_date,
  guest_count integer not null,
  comment text,
  vessel text not null default 'crown',
  unique (vessel, service_date)
);

-- Safe migration for databases created before Pearl was added.
alter table public.food_waste_entries
add column if not exists vessel text not null default 'crown';

alter table public.food_waste_guest_counts
add column if not exists vessel text not null default 'crown';

alter table public.food_waste_guest_counts
drop constraint if exists food_waste_guest_counts_service_date_key;

create unique index if not exists food_waste_guest_counts_vessel_service_date_key
on public.food_waste_guest_counts (vessel, service_date);

alter table public.food_waste_entries enable row level security;

drop policy if exists "Food waste entries are readable"
on public.food_waste_entries;

create policy "Food waste entries are readable"
on public.food_waste_entries
for select
using (true);

drop policy if exists "Food waste entries can be created"
on public.food_waste_entries;

create policy "Food waste entries can be created"
on public.food_waste_entries
for insert
with check (true);

drop policy if exists "Food waste entries can be deleted"
on public.food_waste_entries;

create policy "Food waste entries can be deleted"
on public.food_waste_entries
for delete
using (true);

alter table public.food_waste_guest_counts enable row level security;

drop policy if exists "Food waste guest counts are readable"
on public.food_waste_guest_counts;

create policy "Food waste guest counts are readable"
on public.food_waste_guest_counts
for select
using (true);

drop policy if exists "Food waste guest counts can be created"
on public.food_waste_guest_counts;

create policy "Food waste guest counts can be created"
on public.food_waste_guest_counts
for insert
with check (true);

drop policy if exists "Food waste guest counts can be updated"
on public.food_waste_guest_counts;

create policy "Food waste guest counts can be updated"
on public.food_waste_guest_counts
for update
using (true)
with check (true);

drop policy if exists "Food waste guest counts can be deleted"
on public.food_waste_guest_counts;

create policy "Food waste guest counts can be deleted"
on public.food_waste_guest_counts
for delete
using (true);
