select 'community_posts table' as check_name,
  to_regclass('public.community_posts') is not null as passed;

select 'community_comments table' as check_name,
  to_regclass('public.community_comments') is not null as passed;

select 'community_reports table' as check_name,
  to_regclass('public.community_reports') is not null as passed;

select 'profile username function' as check_name,
  to_regprocedure('public.claim_harvestly_username(text)') is not null as passed;

select 'new user profile trigger' as check_name,
  exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
      and tgrelid = 'auth.users'::regclass
  ) as passed;

select 'community post columns' as check_name,
  count(*) = 13 as passed,
  string_agg(column_name, ', ' order by column_name) as found
from information_schema.columns
where table_schema = 'public'
  and table_name = 'community_posts'
  and column_name in (
    'hidden_at',
    'hidden_by',
    'scan_record_id',
    'scan_crop_id',
    'scan_condition_code',
    'scan_confidence',
    'scan_risk',
    'scan_created_at',
    'topic',
    'photo_path',
    'photo_width',
    'photo_height',
    'photo_alt'
  );

select 'profiles username column' as check_name,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'username'
  ) as passed;

select 'photo storage bucket' as check_name,
  exists (
    select 1
    from storage.buckets
    where id = 'community-post-photos'
      and public = false
      and file_size_limit = 5242880
  ) as passed;

select 'storage policies' as check_name,
  count(*) = 3 as passed,
  string_agg(policyname, ', ' order by policyname) as found
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Community members can view post photos',
    'Community members can upload own post photos',
    'Community members can delete own post photos'
  );

select 'community rls policies' as check_name,
  count(*) >= 8 as passed,
  string_agg(policyname, ', ' order by policyname) as found
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'community_posts', 'community_comments', 'community_reports')
  and policyname in (
    'Community profiles can be read by members',
    'Profiles can be inserted by owner',
    'Profiles can be updated by owner',
    'Authenticated users can read posts',
    'Authors can create posts',
    'Authors can update posts',
    'Authenticated users can read comments',
    'Authors can create comments',
    'Authors can update comments',
    'Users can read own reports',
    'Users can create reports'
  );

select 'community search indexes' as check_name,
  count(*) = 3 as passed,
  string_agg(indexname, ', ' order by indexname) as found
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'profiles_username_trgm_idx',
    'community_posts_topic_trgm_idx',
    'community_posts_body_trgm_idx'
  );

select 'community delete rpc functions' as check_name,
  count(*) = 2 as passed,
  string_agg(proname, ', ' order by proname) as found
from pg_proc
join pg_namespace on pg_namespace.oid = pg_proc.pronamespace
where pg_namespace.nspname = 'public'
  and proname in (
    'delete_community_post',
    'delete_community_comment'
  );
