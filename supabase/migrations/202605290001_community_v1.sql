create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts
add column if not exists hidden_at timestamptz,
add column if not exists hidden_by uuid references auth.users(id) on delete set null,
add column if not exists scan_record_id text,
add column if not exists scan_crop_id text,
add column if not exists scan_condition_code text,
add column if not exists scan_confidence double precision,
add column if not exists scan_risk text,
add column if not exists scan_created_at timestamptz;

alter table public.community_posts
drop constraint if exists community_posts_scan_crop_id_check;

alter table public.community_posts
add constraint community_posts_scan_crop_id_check
check (scan_crop_id is null or scan_crop_id in ('rice', 'cassava', 'unknown'));

alter table public.community_posts
drop constraint if exists community_posts_scan_confidence_check;

alter table public.community_posts
add constraint community_posts_scan_confidence_check
check (scan_confidence is null or scan_confidence between 0 and 1);

alter table public.community_posts
drop constraint if exists community_posts_scan_risk_check;

alter table public.community_posts
add constraint community_posts_scan_risk_check
check (scan_risk is null or scan_risk in ('high', 'medium', 'low'));

create index if not exists community_posts_visible_created_idx
on public.community_posts (created_at desc)
where hidden_at is null;

drop trigger if exists community_posts_updated_at on public.community_posts;
create trigger community_posts_updated_at before update on public.community_posts
for each row execute function public.set_updated_at();

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden_at timestamptz,
  hidden_by uuid references auth.users(id) on delete set null
);

create index if not exists community_comments_post_created_idx
on public.community_comments (post_id, created_at)
where hidden_at is null;

drop trigger if exists community_comments_updated_at on public.community_comments;
create trigger community_comments_updated_at before update on public.community_comments
for each row execute function public.set_updated_at();

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  reason text check (reason is null or char_length(trim(reason)) <= 300),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists community_reports_target_idx
on public.community_reports (target_type, target_id, created_at desc);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

grant select, insert, update on public.community_posts to authenticated;
grant select, insert, update on public.community_comments to authenticated;
grant select, insert on public.community_reports to authenticated;

drop policy if exists "Community profiles can be read by members" on public.profiles;
create policy "Community profiles can be read by members" on public.profiles
for select to authenticated using (true);

drop policy if exists "Authenticated users can read posts" on public.community_posts;
create policy "Authenticated users can read posts" on public.community_posts
for select to authenticated using (hidden_at is null);

drop policy if exists "Authors can create posts" on public.community_posts;
create policy "Authors can create posts" on public.community_posts
for insert to authenticated with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can update posts" on public.community_posts;
create policy "Authors can update posts" on public.community_posts
for update to authenticated using ((select auth.uid()) = author_id and hidden_at is null)
with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can delete posts" on public.community_posts;

drop policy if exists "Authenticated users can read comments" on public.community_comments;
create policy "Authenticated users can read comments" on public.community_comments
for select to authenticated using (
  hidden_at is null
  and exists (
    select 1
    from public.community_posts
    where community_posts.id = community_comments.post_id
      and community_posts.hidden_at is null
  )
);

drop policy if exists "Authors can create comments" on public.community_comments;
create policy "Authors can create comments" on public.community_comments
for insert to authenticated with check (
  (select auth.uid()) = author_id
  and exists (
    select 1
    from public.community_posts
    where community_posts.id = community_comments.post_id
      and community_posts.hidden_at is null
  )
);

drop policy if exists "Authors can update comments" on public.community_comments;
create policy "Authors can update comments" on public.community_comments
for update to authenticated using ((select auth.uid()) = author_id and hidden_at is null)
with check ((select auth.uid()) = author_id);

drop policy if exists "Authors can delete comments" on public.community_comments;

drop policy if exists "Users can read own reports" on public.community_reports;
create policy "Users can read own reports" on public.community_reports
for select to authenticated using ((select auth.uid()) = reporter_id);

drop policy if exists "Users can create reports" on public.community_reports;
create policy "Users can create reports" on public.community_reports
for insert to authenticated with check ((select auth.uid()) = reporter_id);
