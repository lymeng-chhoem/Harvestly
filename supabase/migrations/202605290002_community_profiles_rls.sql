alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;

drop policy if exists "Community profiles can be read by members" on public.profiles;
create policy "Community profiles can be read by members" on public.profiles
for select to authenticated using (true);
