alter table public.community_posts
drop constraint if exists community_posts_photo_path_check;

alter table public.community_posts
add constraint community_posts_photo_path_check
check (
  photo_path is null
  or (
    split_part(photo_path, '/', 1) = author_id::text
    and photo_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  )
);

alter table public.community_posts
drop constraint if exists community_posts_scan_snapshot_shape_check;

alter table public.community_posts
add constraint community_posts_scan_snapshot_shape_check
check (
  (
    scan_record_id is null
    and scan_crop_id is null
    and scan_condition_code is null
    and scan_confidence is null
    and scan_risk is null
    and scan_created_at is null
  )
  or (
    scan_record_id is not null
    and scan_crop_id is not null
    and scan_condition_code is not null
    and scan_confidence is not null
    and scan_risk is not null
    and scan_created_at is not null
  )
);

grant insert, update on public.community_posts to authenticated;
grant insert, update on public.community_comments to authenticated;
grant insert on public.community_reports to authenticated;
revoke update on public.community_reports from authenticated;

create or replace function public.protect_community_post_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if old.author_id is distinct from new.author_id
    or old.photo_path is distinct from new.photo_path
    or old.photo_width is distinct from new.photo_width
    or old.photo_height is distinct from new.photo_height
    or old.photo_alt is distinct from new.photo_alt
    or old.scan_record_id is distinct from new.scan_record_id
    or old.scan_crop_id is distinct from new.scan_crop_id
    or old.scan_condition_code is distinct from new.scan_condition_code
    or old.scan_confidence is distinct from new.scan_confidence
    or old.scan_risk is distinct from new.scan_risk
    or old.scan_created_at is distinct from new.scan_created_at
    or old.created_at is distinct from new.created_at
    or old.id is distinct from new.id
  then
    raise exception 'Protected community post fields cannot be changed' using errcode = '42501';
  end if;

  if new.hidden_at is null and new.hidden_by is not null then
    raise exception 'Hidden author requires hidden timestamp' using errcode = '42501';
  end if;

  if new.hidden_at is not null and new.hidden_by is distinct from (select auth.uid()) then
    raise exception 'Deleted posts must be deleted by the current user' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_community_post_update on public.community_posts;
create trigger protect_community_post_update before update on public.community_posts
for each row execute function public.protect_community_post_update();

create or replace function public.protect_community_comment_update()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if old.post_id is distinct from new.post_id
    or old.author_id is distinct from new.author_id
    or old.created_at is distinct from new.created_at
    or old.id is distinct from new.id
  then
    raise exception 'Protected community comment fields cannot be changed' using errcode = '42501';
  end if;

  if new.hidden_at is null and new.hidden_by is not null then
    raise exception 'Hidden author requires hidden timestamp' using errcode = '42501';
  end if;

  if new.hidden_at is not null and new.hidden_by is distinct from (select auth.uid()) then
    raise exception 'Deleted comments must be deleted by the current user' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_community_comment_update on public.community_comments;
create trigger protect_community_comment_update before update on public.community_comments
for each row execute function public.protect_community_comment_update();

drop policy if exists "Authors can create posts" on public.community_posts;
create policy "Authors can create posts" on public.community_posts
for insert to authenticated with check (
  (select auth.uid()) = author_id
  and hidden_at is null
  and hidden_by is null
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.username ~ '^[a-z0-9_]{3,24}$'
  )
);

drop policy if exists "Authors can create comments" on public.community_comments;
create policy "Authors can create comments" on public.community_comments
for insert to authenticated with check (
  (select auth.uid()) = author_id
  and hidden_at is null
  and hidden_by is null
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.username ~ '^[a-z0-9_]{3,24}$'
  )
  and exists (
    select 1
    from public.community_posts
    where community_posts.id = community_comments.post_id
      and community_posts.hidden_at is null
  )
);

drop policy if exists "Users can create reports" on public.community_reports;
create policy "Users can create reports" on public.community_reports
for insert to authenticated with check (
  (select auth.uid()) = reporter_id
  and (
    (
      target_type = 'post'
      and exists (
        select 1
        from public.community_posts
        where community_posts.id = community_reports.target_id
          and community_posts.hidden_at is null
      )
    )
    or (
      target_type = 'comment'
      and exists (
        select 1
        from public.community_comments
        where community_comments.id = community_reports.target_id
          and community_comments.hidden_at is null
      )
    )
  )
);
