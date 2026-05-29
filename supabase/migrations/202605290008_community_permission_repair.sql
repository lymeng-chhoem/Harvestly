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
