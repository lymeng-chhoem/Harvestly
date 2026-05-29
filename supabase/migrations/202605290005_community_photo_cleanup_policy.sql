drop policy if exists "Community members can delete own post photos" on storage.objects;
create policy "Community members can delete own post photos" on storage.objects
for delete to authenticated
using (
  bucket_id = 'community-post-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
