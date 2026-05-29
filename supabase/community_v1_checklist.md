# Community V1 Verification

Run these checks after applying the community migrations through
`202605290006_community_search_indexes.sql`, then
`202605290010_community_delete_repair.sql`.

`202605290007_community_mutation_hardening.sql` is optional extra safety. If
your existing SQL already works, you do not need to run it for Community V1.

If delete/edit/report suddenly stops working after a failed hardening attempt,
rerun `202605290010_community_delete_repair.sql`. It restores the Community V1
policies and creates the delete RPC functions used by the app.

## Supabase SQL

1. Run `supabase/community_v1_verify.sql` in the Supabase SQL Editor.
2. Every returned row should have `passed = true`.
3. Confirm `photo storage bucket` returns true for the private
   `community-post-photos` bucket with `file_size_limit = 5242880`.
4. Confirm `community delete rpc functions` returns true.

## Guest Browser Flow

1. Open `/community` while signed out.
2. Confirm the page shows the signup/login gate.
3. Confirm `/api/community/posts` returns `401` while signed out.

## Authenticated Browser Flow

1. Sign in with a registered account.
2. If sent to `/complete-profile?next=/community`, claim a unique username.
3. Return to `/community` and confirm the composer is visible.
4. Create a post with a topic and body.
5. Create a post with a topic, body, and one JPG/PNG/WebP photo under 5MB.
6. Attach one saved scan summary to a post and confirm only crop, finding,
   confidence, risk, and scan date are shown.
7. Confirm posts and comments show `@username`, not `Harvestly member`.
8. Add a reply under a post.
9. Edit your own post topic/body and your own reply.
10. Delete your own post and your own reply.
11. From another account, report someone else's post and comment.
12. Search by topic text, post body text, and `@username`.
13. Confirm another authenticated user can see signed photo URLs in the feed,
    but signed-out users cannot read community APIs.

## Expected Result

The community page is ready when all SQL checks pass and the authenticated
browser flow works without overlapping mobile UI, broken photo previews,
missing usernames, or unexpected authorization errors.
