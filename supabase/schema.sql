-- Run once in the Supabase SQL editor. One row per (user, storage key): the same key/value
-- shape that src/lib/storage.ts already uses, so no store or aggregate code needs to know about tables.

create table if not exists public.user_data (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  key        text        not null check (key in ('tags', 'sessions', 'settings', 'dashboard')),
  value      jsonb       not null,
  device_id  text,                       -- which browser tab wrote it, so it can ignore its own realtime echo
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Row-level security: a signed-in user can only touch their own rows. This is what makes
-- the public anon key safe to ship in the browser bundle.
alter table public.user_data enable row level security;

create policy "read own data" on public.user_data
  for select using (auth.uid() = user_id);
create policy "insert own data" on public.user_data
  for insert with check (auth.uid() = user_id);
create policy "update own data" on public.user_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own data" on public.user_data
  for delete using (auth.uid() = user_id);

-- Lets other devices receive changes live.
alter publication supabase_realtime add table public.user_data;
