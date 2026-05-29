do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('community_posts', 'community_comments', 'community_reports')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

grant select, insert, update on public.community_posts to authenticated;
grant select, insert, update on public.community_comments to authenticated;
grant select, insert on public.community_reports to authenticated;
grant select, insert, update on public.profiles to authenticated;

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

drop policy if exists "Users can read own reports" on public.community_reports;
create policy "Users can read own reports" on public.community_reports
for select to authenticated using ((select auth.uid()) = reporter_id);

drop policy if exists "Users can create reports" on public.community_reports;
create policy "Users can create reports" on public.community_reports
for insert to authenticated with check ((select auth.uid()) = reporter_id);

create or replace function public.delete_community_post(p_post_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer := 0;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  update public.community_posts
  set hidden_at = now(),
      hidden_by = v_user_id
  where id = p_post_id
    and author_id = v_user_id
    and hidden_at is null;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

create or replace function public.delete_community_comment(p_comment_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_rows integer := 0;
begin
  if v_user_id is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  update public.community_comments
  set hidden_at = now(),
      hidden_by = v_user_id
  where id = p_comment_id
    and author_id = v_user_id
    and hidden_at is null;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.delete_community_post(uuid) from public, anon, authenticated;
revoke all on function public.delete_community_comment(uuid) from public, anon, authenticated;
grant execute on function public.delete_community_post(uuid) to authenticated;
grant execute on function public.delete_community_comment(uuid) to authenticated;

notify pgrst, 'reload schema';
