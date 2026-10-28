-- UUID Walls: saved walls and collections.
-- FILE ONLY. Not applied by the redesign. The owner applies it after approving the PR; until then the
-- app keeps the library on the device (lib/library/remote.ts treats missing tables as "unavailable").
-- Safe to re-run. Stores the wall token (look parameters), never a device UUID.

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  created_at  timestamptz not null default now()
);
create index if not exists collections_user_idx on public.collections (user_id, created_at desc);

create table if not exists public.saved_walls (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  wall_token    text not null check (char_length(wall_token) = 18),
  family        text not null check (family in ('flowfield','voronoi','geometric','ascii','mandala','wave')),
  algo_version  smallint not null default 1,
  label         text check (label is null or char_length(label) <= 80),
  is_favorite   boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (user_id, wall_token)
);
create index if not exists saved_walls_user_idx on public.saved_walls (user_id, created_at desc);
create index if not exists saved_walls_collection_idx on public.saved_walls (collection_id);

alter table public.collections enable row level security;
alter table public.saved_walls enable row level security;

drop policy if exists "collections: owner all" on public.collections;
create policy "collections: owner all" on public.collections
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "saved_walls: owner all" on public.saved_walls;
create policy "saved_walls: owner all" on public.saved_walls
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- A collection can only hold the owner's own walls (a client could otherwise point collection_id at someone else's collection).
create or replace function public.enforce_saved_wall_collection_owner() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.collection_id is not null and not exists (
    select 1 from public.collections c where c.id = new.collection_id and c.user_id = new.user_id
  ) then
    raise exception 'collection does not belong to this user';
  end if;
  return new;
end $$;
drop trigger if exists saved_walls_collection_owner on public.saved_walls;
create trigger saved_walls_collection_owner before insert or update of collection_id on public.saved_walls
  for each row execute function public.enforce_saved_wall_collection_owner();

-- Abuse caps: 500 saved walls and 50 collections per user.
create or replace function public.enforce_library_caps() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'saved_walls' and (select count(*) from public.saved_walls where user_id = new.user_id) >= 500 then
    raise exception 'saved_walls limit reached';
  end if;
  if tg_table_name = 'collections' and (select count(*) from public.collections where user_id = new.user_id) >= 50 then
    raise exception 'collections limit reached';
  end if;
  return new;
end $$;
drop trigger if exists saved_walls_cap on public.saved_walls;
create trigger saved_walls_cap before insert on public.saved_walls for each row execute function public.enforce_library_caps();
drop trigger if exists collections_cap on public.collections;
create trigger collections_cap before insert on public.collections for each row execute function public.enforce_library_caps();
