create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_users (id, firebase_uid, email, created_at, updated_at)
select id, id::text, email, created_at, now()
from auth.users
on conflict (firebase_uid) do update
set email = excluded.email,
    updated_at = now();

drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_users_updated_at on public.app_users;
create trigger app_users_updated_at before update on public.app_users
for each row execute function public.set_updated_at();

do $$
declare
  fk record;
begin
  for fk in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'f'
      and connamespace = 'public'::regnamespace
      and confrelid = 'auth.users'::regclass
  loop
    execute format('alter table %s drop constraint if exists %I', fk.table_name, fk.conname);
  end loop;
end $$;

alter table public.profiles
  drop constraint if exists profiles_id_app_users_fkey;

alter table public.scan_usage
  drop constraint if exists scan_usage_user_id_app_users_fkey;

alter table public.community_posts
  drop constraint if exists community_posts_author_id_app_users_fkey,
  drop constraint if exists community_posts_hidden_by_app_users_fkey;

alter table public.community_comments
  drop constraint if exists community_comments_author_id_app_users_fkey,
  drop constraint if exists community_comments_hidden_by_app_users_fkey;

alter table public.community_reports
  drop constraint if exists community_reports_reporter_id_app_users_fkey;

alter table public.profiles
  add constraint profiles_id_app_users_fkey
  foreign key (id) references public.app_users(id) on delete cascade;

alter table public.scan_usage
  add constraint scan_usage_user_id_app_users_fkey
  foreign key (user_id) references public.app_users(id) on delete cascade;

alter table public.community_posts
  add constraint community_posts_author_id_app_users_fkey
  foreign key (author_id) references public.app_users(id) on delete cascade;

alter table public.community_posts
  add constraint community_posts_hidden_by_app_users_fkey
  foreign key (hidden_by) references public.app_users(id) on delete set null;

alter table public.community_comments
  add constraint community_comments_author_id_app_users_fkey
  foreign key (author_id) references public.app_users(id) on delete cascade;

alter table public.community_comments
  add constraint community_comments_hidden_by_app_users_fkey
  foreign key (hidden_by) references public.app_users(id) on delete set null;

alter table public.community_reports
  add constraint community_reports_reporter_id_app_users_fkey
  foreign key (reporter_id) references public.app_users(id) on delete cascade;

alter table public.app_users enable row level security;
revoke all on public.app_users from anon, authenticated;
grant select, insert, update, delete on public.app_users to service_role;
