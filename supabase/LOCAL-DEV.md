# Supabase — local dev & env

The image catalog (ARCH §6). Bytes live in B2; this Postgres holds one row per
image. The `images` schema is in `migrations/`.

## Env

The browser client (`src/lib/supabase.js`) reads, from `.env.local`:

```
VITE_SUPABASE_URL=...        # project URL (or local stack)
VITE_SUPABASE_ANON_KEY=...   # anon key — safe in the client (RLS gates writes)
```

The ingest script (`scripts/ingest.mjs`) reads, from the Node env (NEVER `VITE_`,
or it would bundle into the browser):

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # bypasses RLS — server/CLI only
```

## Running

**Cloud (intended):** create a Supabase project, run the migration
(`supabase db push` against the linked project, or paste the SQL), and point
`.env.local` at the project URL + anon key.

**Local:** `supabase start` boots the stack and auto-applies `migrations/`.

> Caveat (2026-06-14): `supabase start` aborted with exit 134 on this machine —
> the `supabase/postgres` image fails to init under this Docker (plain
> `postgres:16` runs fine). If you hit it, bump Docker's memory, use a machine
> where the image boots, or use the cloud project. The catalog was verified with
> a plain-Postgres + PostgREST stand-in; see the 2026-06-14 catalog session log.

## Ingest

```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/ingest.mjs --file out/photo-web.jpg --meta out/photo.json --tags forest,portrait
# catalog an existing bucket object without re-uploading:
#   ... --no-upload --key art-prints/x.jpg --cdn-url https://.../x.jpg --meta m.json
```
