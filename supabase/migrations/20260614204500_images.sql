-- images catalog — one row per published image.
-- Bytes live in Backblaze B2 (ARCH §5); this table points at them + holds the
-- capture metadata and the editor's parametric op-stack (the non-destructive edit).

create extension if not exists pg_trgm;

create table if not exists public.images (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  filename    text not null,
  b2_key      text not null unique,           -- object key in the kolkrabbi bucket
  cdn_url     text,                            -- public CDN URL for the derivative
  width       integer,
  height      integer,
  bytes       bigint,
  camera      text,
  lens        text,
  iso         integer,
  shutter     real,
  aperture    real,
  focal_len   real,
  shot_at     timestamptz,                     -- capture time from EXIF
  edit        jsonb not null default '{}'::jsonb,   -- the parametric op-stack
  tags        text[] not null default '{}'::text[]
);

create index if not exists images_shot_at_idx     on public.images (shot_at desc);
create index if not exists images_created_at_idx   on public.images (created_at desc);
create index if not exists images_tags_idx         on public.images using gin (tags);
create index if not exists images_camera_trgm_idx  on public.images using gin (camera gin_trgm_ops);

alter table public.images enable row level security;

-- Public read (portfolio/gallery). Writes require an authenticated user; the
-- local ingest script uses the service-role key, which bypasses RLS.
create policy "images public read"            on public.images for select using (true);
create policy "images authenticated insert"   on public.images for insert to authenticated with check (true);
create policy "images authenticated update"   on public.images for update to authenticated using (true) with check (true);
create policy "images authenticated delete"   on public.images for delete to authenticated using (true);
