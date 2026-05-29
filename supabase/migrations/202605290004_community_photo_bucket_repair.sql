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
