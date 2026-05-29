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
