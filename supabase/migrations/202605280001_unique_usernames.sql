alter table public.profiles
add column if not exists username text;

alter table public.profiles
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_username_format_check
check (username is null or username ~ '^[a-z0-9_]{3,24}$');

with valid_usernames as (
  select
    u.id,
    lower(trim(u.raw_user_meta_data ->> 'harvestly_username')) as username,
    row_number() over (
      partition by lower(trim(u.raw_user_meta_data ->> 'harvestly_username'))
      order by p.created_at, u.created_at, u.id
    ) as username_rank
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(trim(coalesce(u.raw_user_meta_data ->> 'harvestly_username', ''))) ~ '^[a-z0-9_]{3,24}$'
),
claimed_usernames as (
  update public.profiles p
  set username = valid_usernames.username
  from valid_usernames
  where p.id = valid_usernames.id
    and valid_usernames.username_rank = 1
    and p.username is null
  returning p.id, p.username
)
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('harvestly_username', claimed_usernames.username),
  updated_at = now()
from claimed_usernames
where u.id = claimed_usernames.id;

with duplicate_usernames as (
  select id
  from (
    select
      u.id,
      row_number() over (
        partition by lower(trim(u.raw_user_meta_data ->> 'harvestly_username'))
        order by p.created_at, u.created_at, u.id
      ) as username_rank
    from auth.users u
    join public.profiles p on p.id = u.id
    where lower(trim(coalesce(u.raw_user_meta_data ->> 'harvestly_username', ''))) ~ '^[a-z0-9_]{3,24}$'
  ) ranked_usernames
  where username_rank > 1
)
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) - 'harvestly_username',
  updated_at = now()
from duplicate_usernames
where u.id = duplicate_usernames.id;

create unique index if not exists profiles_username_unique_idx
on public.profiles (username)
where username is not null;

grant select on public.profiles to authenticated;

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
