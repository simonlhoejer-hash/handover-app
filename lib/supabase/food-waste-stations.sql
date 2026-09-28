create table if not exists public.food_waste_station_config (
  vessel text primary key check (vessel in ('crown', 'pearl')),
  stations jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.food_waste_station_config enable row level security;
revoke all on public.food_waste_station_config from public, anon, authenticated;
