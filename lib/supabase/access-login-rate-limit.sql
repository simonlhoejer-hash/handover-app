create table if not exists public.access_login_attempts (
  attempt_key text primary key,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  last_attempt_at timestamptz not null default now(),
  locked_until timestamptz
);

create index if not exists access_login_attempts_last_attempt_at_idx
on public.access_login_attempts (last_attempt_at);

alter table public.access_login_attempts enable row level security;
revoke all on public.access_login_attempts from public, anon, authenticated;

comment on table public.access_login_attempts is
'Server-only counters used to temporarily block repeated failed ship login attempts.';
