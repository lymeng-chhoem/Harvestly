create extension if not exists pgcrypto;

alter table public.profiles
add column if not exists username text;

alter table public.profiles
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_username_format_check
check (username is null or username ~ '^[a-z0-9_]{3,24}$');

insert into public.profiles (id, display_name, avatar_url, username)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url',
  case
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'harvestly_username', ''))) ~ '^[a-z0-9_]{3,24}$'
    then lower(trim(u.raw_user_meta_data ->> 'harvestly_username'))
    else null
  end
from auth.users u
on conflict (id) do update
set display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    username = coalesce(public.profiles.username, excluded.username),
    updated_at = now();

with duplicate_usernames as (
  select id
  from (
    select
      id,
      row_number() over (
        partition by username
        order by created_at, id
      ) as username_rank
    from public.profiles
    where username is not null
  ) ranked
  where username_rank > 1
)
update public.profiles p
set username = null,
    updated_at = now()
from duplicate_usernames
where p.id = duplicate_usernames.id;

create unique index if not exists profiles_username_unique_idx on public.profiles (username) where username is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    case
      when lower(trim(coalesce(new.raw_user_meta_data ->> 'harvestly_username', ''))) ~ '^[a-z0-9_]{3,24}$'
      then lower(trim(new.raw_user_meta_data ->> 'harvestly_username'))
      else null
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.claim_harvestly_username(p_username text)
returns table (username text)
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_username text := lower(trim(p_username));
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if v_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'Invalid username' using errcode = '22023';
  end if;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    v_user_id,
    v_username,
    (
      select coalesce(
        auth.users.raw_user_meta_data ->> 'full_name',
        auth.users.raw_user_meta_data ->> 'name'
      )
      from auth.users
      where auth.users.id = v_user_id
    ),
    (
      select auth.users.raw_user_meta_data ->> 'avatar_url'
      from auth.users
      where auth.users.id = v_user_id
    )
  )
  on conflict (id) do update
  set username = excluded.username,
      updated_at = now();

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('harvestly_username', v_username),
      updated_at = now()
  where id = v_user_id;

  return query select v_username;
exception
  when unique_violation then
    raise exception 'Username unavailable' using errcode = '23505';
end;
$$;

revoke all on function public.claim_harvestly_username(text) from public, anon, authenticated;
grant execute on function public.claim_harvestly_username(text) to authenticated;

alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "Profiles can be inserted by owner" on public.profiles;
create policy "Profiles can be inserted by owner" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "Profiles can be updated by owner" on public.profiles;
create policy "Profiles can be updated by owner" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Community profiles can be read by members" on public.profiles;
create policy "Community profiles can be read by members" on public.profiles
for select to authenticated using (true);

alter table public.community_posts
add column if not exists topic text,
add column if not exists photo_path text,
add column if not exists photo_width integer,
add column if not exists photo_height integer,
add column if not exists photo_alt text;

alter table public.community_posts
drop constraint if exists community_posts_topic_length_check;

alter table public.community_posts
add constraint community_posts_topic_length_check
check (topic is null or char_length(trim(topic)) between 2 and 80);

alter table public.community_posts
drop constraint if exists community_posts_photo_dimensions_check;

alter table public.community_posts
add constraint community_posts_photo_dimensions_check
check (
  (photo_width is null and photo_height is null)
  or (photo_width between 1 and 12000 and photo_height between 1 and 12000)
);

alter table public.community_posts
drop constraint if exists community_posts_photo_alt_check;

alter table public.community_posts
add constraint community_posts_photo_alt_check
check (photo_alt is null or char_length(trim(photo_alt)) <= 160);

create index if not exists community_posts_topic_idx on public.community_posts (lower(topic)) where topic is not null and hidden_at is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-post-photos',
  'community-post-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Community members can view post photos" on storage.objects;
create policy "Community members can view post photos" on storage.objects
for select to authenticated
using (bucket_id = 'community-post-photos');

drop policy if exists "Community members can upload own post photos" on storage.objects;
create policy "Community members can upload own post photos" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'community-post-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
