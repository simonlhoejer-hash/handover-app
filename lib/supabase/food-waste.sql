create table if not exists public.food_waste_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  waste_date date not null default current_date,
  location_name text not null,
  quantity_kg numeric not null,
  comment text
);

alter table public.food_waste_entries enable row level security;

create policy "Food waste entries are readable"
on public.food_waste_entries
for select
using (true);

create policy "Food waste entries can be created"
on public.food_waste_entries
for insert
with check (true);

create policy "Food waste entries can be deleted"
on public.food_waste_entries
for delete
using (true);
