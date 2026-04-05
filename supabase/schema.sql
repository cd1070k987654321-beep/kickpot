-- KickPot MVP schema v2
-- Run in Supabase SQL Editor on a fresh project

create extension if not exists pgcrypto;

create type public.team_role as enum ('owner', 'member');
create type public.match_status as enum ('pending', 'requested', 'accepted', 'rejected', 'completed');
create type public.vote_type as enum ('date', 'participant');
create type public.vote_status as enum ('open', 'closed');
create type public.position_type as enum ('GK', 'DF', 'MF', 'FW', 'ALL');
create type public.record_status as enum ('draft', 'reviewing', 'rejected', 'approved');
create type public.record_event_type as enum ('goal', 'assist');
create type public.notification_type as enum ('team_joined', 'team_removed', 'team_owner_transferred', 'team_join_request');
create type public.join_request_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text default '',
  nickname text not null,
  bio text default '',
  profile_image_url text,
  cover_image_url text,
  main_position public.position_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text default '',
  logo_url text,
  cover_image_url text,
  invite_code text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.team_role not null default 'member',
  number integer,
  created_at timestamptz not null default now(),
  unique(team_id, user_id),
  unique(team_id, number)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_a_id uuid not null references public.teams(id) on delete cascade,
  team_b_id uuid references public.teams(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text,
  description text default '',
  date timestamptz not null,
  location text not null,
  status public.match_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  match_id uuid references public.matches(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  type public.vote_type not null,
  status public.vote_status not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.vote_responses (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  option_id uuid not null references public.vote_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(option_id, user_id)
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(match_id, user_id)
);

create table if not exists public.lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  position public.position_type not null,
  created_at timestamptz not null default now(),
  unique(match_id, user_id)
);

create table if not exists public.records (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  score_a integer not null default 0,
  score_b integer not null default 0,
  status public.record_status not null default 'draft',
  review_note text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.record_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.record_event_type not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text default '',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.join_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique(team_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  raw_code text;
begin
  raw_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return 'KP-' || raw_code;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.set_team_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    new.invite_code := public.generate_invite_code();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
  before update on public.teams
  for each row execute procedure public.set_updated_at();

drop trigger if exists teams_set_invite_code on public.teams;
create trigger teams_set_invite_code
  before insert on public.teams
  for each row execute procedure public.set_team_invite_code();

drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
  before update on public.matches
  for each row execute procedure public.set_updated_at();

drop trigger if exists records_set_updated_at on public.records;
create trigger records_set_updated_at
  before update on public.records
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.matches enable row level security;
alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.vote_responses enable row level security;
alter table public.participants enable row level security;
alter table public.lineups enable row level security;
alter table public.records enable row level security;
alter table public.record_events enable row level security;
alter table public.notifications enable row level security;
alter table public.team_join_requests enable row level security;

create policy "profiles_select_authenticated" on public.profiles
for select to authenticated using (true);

create policy "profiles_insert_self" on public.profiles
for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "teams_select_authenticated" on public.teams
for select to authenticated using (true);

create policy "teams_insert_authenticated" on public.teams
for insert to authenticated with check (auth.uid() = owner_id);

create policy "teams_update_owner" on public.teams
for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "teams_delete_owner" on public.teams
for delete to authenticated using (auth.uid() = owner_id);

create policy "team_members_select_authenticated" on public.team_members
for select to authenticated using (true);

create policy "team_members_insert_authenticated" on public.team_members
for insert to authenticated with check (
  auth.uid() = user_id or exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
);

create policy "team_members_update_owner" on public.team_members
for update to authenticated using (
  exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
);

create policy "team_members_delete_self_or_owner" on public.team_members
for delete to authenticated using (
  auth.uid() = user_id or exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
);

create policy "matches_select_authenticated" on public.matches
for select to authenticated using (true);

create policy "matches_insert_team_owner" on public.matches
for insert to authenticated with check (
  auth.uid() = created_by and exists (
    select 1 from public.teams t where t.id = team_a_id and t.owner_id = auth.uid()
  )
);

create policy "matches_update_related_team_owner" on public.matches
for update to authenticated using (
  exists (
    select 1 from public.teams t
    where (t.id = team_a_id or t.id = team_b_id) and t.owner_id = auth.uid()
  )
);

create policy "votes_select_authenticated" on public.votes
for select to authenticated using (true);

create policy "vote_options_select_authenticated" on public.vote_options
for select to authenticated using (true);

create policy "vote_responses_select_authenticated" on public.vote_responses
for select to authenticated using (true);

create policy "participants_select_authenticated" on public.participants
for select to authenticated using (true);

create policy "lineups_select_authenticated" on public.lineups
for select to authenticated using (true);

create policy "records_select_authenticated" on public.records
for select to authenticated using (true);

create policy "record_events_select_authenticated" on public.record_events
for select to authenticated using (true);

create policy "notifications_select_own" on public.notifications
for select to authenticated using (auth.uid() = user_id);

create policy "notifications_insert_own_or_owner" on public.notifications
for insert to authenticated with check (
  auth.uid() = user_id or auth.uid() is not null
);

create policy "notifications_update_own" on public.notifications
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_own" on public.notifications
for delete to authenticated using (auth.uid() = user_id);

create policy "team_join_requests_select_authenticated" on public.team_join_requests
for select to authenticated using (
  auth.uid() = user_id or exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
);

create policy "team_join_requests_insert_self" on public.team_join_requests
for insert to authenticated with check (auth.uid() = user_id);

create policy "team_join_requests_update_owner" on public.team_join_requests
for update to authenticated using (
  exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  )
);
