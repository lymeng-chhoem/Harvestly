create extension if not exists pg_trgm;

create index if not exists profiles_username_trgm_idx
on public.profiles
using gin (username gin_trgm_ops)
where username is not null;

create index if not exists community_posts_topic_trgm_idx
on public.community_posts
using gin (topic gin_trgm_ops)
where topic is not null and hidden_at is null;

create index if not exists community_posts_body_trgm_idx
on public.community_posts
using gin (body gin_trgm_ops)
where hidden_at is null;
