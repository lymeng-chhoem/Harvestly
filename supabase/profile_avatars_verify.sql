select 'profiles avatar_path column' as check_name,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'avatar_path'
  ) as passed;

select 'profile avatar bucket' as check_name,
  exists (
    select 1
    from storage.buckets
    where id = 'profile-avatars'
      and public = true
      and file_size_limit = 2097152
  ) as passed;

select 'profile avatar storage policies' as check_name,
  count(*) = 3 as passed
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Anyone can view profile avatars',
    'Users can upload own profile avatars',
    'Users can delete own profile avatars'
  );
