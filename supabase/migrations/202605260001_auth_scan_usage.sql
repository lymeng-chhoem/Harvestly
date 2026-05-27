create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scan_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  status text not null check (status in ('reserved', 'succeeded', 'released')),
  reserved_at timestamptz not null default now(),
  completed_at timestamptz,
  hidden_at timestamptz,
  crop_id text check (crop_id in ('rice', 'cassava', 'unknown')),
  condition_code text,
  confidence double precision check (confidence between 0 and 1),
  risk text check (risk in ('high', 'medium', 'low'))
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_usage_week_status_idx on public.scan_usage (user_id, week_start, status);
create index if not exists scan_usage_history_idx on public.scan_usage (user_id, completed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists community_posts_updated_at on public.community_posts;
create trigger community_posts_updated_at before update on public.community_posts
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.scan_usage enable row level security;
alter table public.community_posts enable row level security;

drop policy if exists "Profiles can be read by owner" on public.profiles;
create policy "Profiles can be read by owner" on public.profiles
for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Profiles can be updated by owner" on public.profiles;
create policy "Profiles can be updated by owner" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can read successful scans" on public.scan_usage;
create policy "Users can read successful scans" on public.scan_usage
for select to authenticated
using ((select auth.uid()) = user_id and status = 'succeeded');

drop policy if exists "Users can hide successful scans" on public.scan_usage;
create policy "Users can hide successful scans" on public.scan_usage
for update to authenticated
using ((select auth.uid()) = user_id and status = 'succeeded')
with check ((select auth.uid()) = user_id and status = 'succeeded');

revoke insert, delete, update on public.scan_usage from anon, authenticated;
grant update (hidden_at) on public.scan_usage to authenticated;

drop policy if exists "Authenticated users can read posts" on public.community_posts;
create policy "Authenticated users can read posts" on public.community_posts
for select to authenticated using (true);

drop policy if exists "Authors can create posts" on public.community_posts;
create policy "Authors can create posts" on public.community_posts
for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can update posts" on public.community_posts;
create policy "Authors can update posts" on public.community_posts
for update to authenticated using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can delete posts" on public.community_posts;
create policy "Authors can delete posts" on public.community_posts
for delete to authenticated using ((select auth.uid()) = author_id);

create or replace function public.harvestly_week_start()
returns date
language sql
stable
as $$
  select (timezone('Asia/Phnom_Penh', now())::date
    - (extract(isodow from timezone('Asia/Phnom_Penh', now()))::integer - 1));
$$;

create or replace function public.harvestly_next_week_reset()
returns timestamptz
language sql
stable
as $$
  select ((public.harvestly_week_start() + 7)::timestamp at time zone 'Asia/Phnom_Penh');
$$;

create or replace function public.reserve_scan_slot(p_user_id uuid)
returns table (reservation_id uuid, used integer, remaining integer, resets_at timestamptz)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_week_start date := public.harvestly_week_start();
  v_count integer;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || v_week_start::text, 0));

  update public.scan_usage
    set status = 'released'
    where user_id = p_user_id
      and week_start = v_week_start
      and status = 'reserved'
      and reserved_at < now() - interval '2 minutes';

  select count(*)::integer into v_count
    from public.scan_usage
    where user_id = p_user_id
      and week_start = v_week_start
      and status in ('reserved', 'succeeded');

  if v_count >= 5 then
    return query select null::uuid, v_count, 0, public.harvestly_next_week_reset();
    return;
  end if;

  insert into public.scan_usage (user_id, week_start, status)
    values (p_user_id, v_week_start, 'reserved')
    returning id into v_id;

  return query select v_id, v_count + 1, 5 - (v_count + 1), public.harvestly_next_week_reset();
end;
$$;

create or replace function public.complete_scan_slot(
  p_user_id uuid,
  p_reservation_id uuid,
  p_crop_id text,
  p_condition_code text,
  p_confidence double precision,
  p_risk text
)
returns table (completed_id uuid, created_at timestamptz, used integer, remaining integer, resets_at timestamptz)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_completed_at timestamptz := now();
  v_used integer;
begin
  update public.scan_usage
    set status = 'succeeded',
        completed_at = v_completed_at,
        crop_id = p_crop_id,
        condition_code = p_condition_code,
        confidence = p_confidence,
        risk = p_risk
    where id = p_reservation_id
      and user_id = p_user_id
      and status = 'reserved';

  if not found then
    raise exception 'Reservation not available';
  end if;

  select count(*)::integer into v_used
    from public.scan_usage
    where user_id = p_user_id
      and week_start = public.harvestly_week_start()
      and status = 'succeeded';

  return query select p_reservation_id, v_completed_at, v_used, greatest(0, 5 - v_used), public.harvestly_next_week_reset();
end;
$$;

create or replace function public.release_scan_slot(p_user_id uuid, p_reservation_id uuid)
returns void
language sql
security definer set search_path = ''
as $$
  update public.scan_usage
  set status = 'released'
  where id = p_reservation_id and user_id = p_user_id and status = 'reserved';
$$;

create or replace function public.get_scan_allowance(p_user_id uuid)
returns table (used integer, remaining integer, resets_at timestamptz)
language sql
security definer set search_path = ''
as $$
  select
    count(*) filter (where status = 'succeeded')::integer as used,
    greatest(0, 5 - count(*) filter (where status in ('reserved', 'succeeded'))::integer) as remaining,
    public.harvestly_next_week_reset() as resets_at
  from public.scan_usage
  where user_id = p_user_id and week_start = public.harvestly_week_start();
$$;

revoke all on function public.reserve_scan_slot(uuid) from public, anon, authenticated;
revoke all on function public.complete_scan_slot(uuid, uuid, text, text, double precision, text) from public, anon, authenticated;
revoke all on function public.release_scan_slot(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_scan_allowance(uuid) from public, anon, authenticated;
grant execute on function public.reserve_scan_slot(uuid) to service_role;
grant execute on function public.complete_scan_slot(uuid, uuid, text, text, double precision, text) to service_role;
grant execute on function public.release_scan_slot(uuid, uuid) to service_role;
grant execute on function public.get_scan_allowance(uuid) to service_role;
