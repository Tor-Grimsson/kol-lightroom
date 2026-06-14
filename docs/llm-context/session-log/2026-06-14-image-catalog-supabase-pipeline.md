# Session: Image catalog — Supabase + B2 publish pipeline (parallel to the editor)

**Date:** 2026-06-14
**Agent:** Grim
**Summary:** Built the second pipeline: a database-backed image catalog. Bytes stay in B2 (ARCH §5); a Supabase Postgres `images` table holds one row per image (B2 key + CDN URL, capture metadata, the editor's parametric op-stack, tags). Added the schema migration, a local ingest script, a Supabase client, and a `/library` gallery page with tag filtering. Verified end-to-end against a real Postgres + PostgREST (the live Supabase stack wouldn't boot on this Docker — see below).

## Changes Made

### Files Added
- `supabase/config.toml`, `supabase/migrations/20260614204500_images.sql` — the `images` table (B2 key, CDN URL, dims/bytes, camera/lens/iso/shutter/aperture/focal_len, `shot_at`, `edit` JSONB op-stack, `tags[]`), indexes (shot_at, created_at, GIN tags, pg_trgm camera), RLS (public read / authenticated write).
- `src/lib/supabase.js` — browser client; null when env unset (Library degrades to an empty state, build needs no secrets).
- `scripts/ingest.mjs` — Node ingest: `bucket up` → B2, then upsert the catalog row (service-role key, bypasses RLS). Flags: `--file --meta --tags --prefix --key --cdn-url --no-upload`. `--cdn-url`/`--key` catalog an existing bucket object without re-uploading.
- `src/pages/Library.jsx` — `/library` gallery: queries `images`, grid of cards (thumbnail/filename/camera/ISO), text + tag filtering via the KOL `Input`/`Tag` components.

### Files Modified
- `src/App.jsx` — `/library` route. `src/sidebars.config.js` — Library nav entry (`library` icon).
- `package.json` — `@supabase/supabase-js`.
- `vite.config.js` — COEP `require-corp` → **`credentialless`** (keeps cross-origin isolation for the editor's WASM threads; needed for the Library to embed CDN images).
- `docs/llm-context/ARCHITECTURE.md` — §6: Supabase catalog backend decision.

## Current State

### Working (verified live via Playwright)
- **Ingest** cataloged 3 real bucket images end-to-end (service key → gateway → PostgREST → Postgres); rows carry metadata + the `edit` op-stack JSONB + tags.
- **`/library`** loads the 3 rows via the real `@supabase/supabase-js`, renders thumbnails (CDN images, `crossOrigin="anonymous"`), filters by tag (#borg → 1 card, toggle → 3), `crossOriginIsolated` still `true` (so /develop threads survive).
- Schema migration applies cleanly (table, indexes incl. pg_trgm, RLS policies). `pnpm build` passes.

### Known Issues / Notes
- **`supabase start` will not boot on this machine** — the `supabase/postgres` container aborts with exit 134 (SIGABRT) during init (plain `postgres:16-alpine` boots fine, so it's that image on this Docker, x86_64 host; likely a Docker resource/CPU issue). **Verification used a stand-in stack**: official `postgres:16-alpine` + `postgrest/postgrest` + a tiny Node gateway proxy (`/tmp/kol_proxy.mjs`, strips supabase-js's `/rest/v1` prefix) + the Supabase role model (`anon`/`authenticated`/`service_role`) recreated by hand, with self-minted HS256 JWTs.
- **Intended local dev is real Supabase** — cloud project (set `.env.local` → project URL + anon key) or `supabase start` once the Docker exit-134 is resolved (more Docker memory, or run on a machine where the image boots). The migration auto-applies. The hand-rolled bridge is verification scaffolding only.
- **Currently running** (this session, for live demo): `kol_pg` + `kol_prest` Docker containers, the Node proxy on :54321, and the dev server on :5173 with `.env.local` pointing at the local stack. Tear down with `docker rm -f kol_pg kol_prest && docker network rm kolnet` + kill the proxy/dev node procs.
- **CDN `<img>` needs `crossOrigin="anonymous"`** under cross-origin isolation; B2 sends CORS (reflects origin), so it works. Prod CDN host must send COOP/COEP for the editor's threads.
- **Service-role key never goes in a `VITE_` var** — it'd bundle into the browser. Ingest reads `SUPABASE_SERVICE_ROLE_KEY` from the Node env only.

## Next Steps
1. **Real Supabase project** — create the cloud project (or fix local `supabase start`), point `.env.local` at it, run the migration.
2. **In-app publish (editor → catalog)** — "Publish" button in `/develop`: export the web master, push to B2, write the row (via a Supabase Edge Function minting a B2 presigned URL so the browser needs no B2 secret). Replaces the local ingest script for the in-app flow.
3. **Editor ↔ catalog round-trip** — "open in develop" from a Library card restores the stored `edit` op-stack (non-destructive).
4. **Auth** — Supabase Auth gating writes; decide whether gallery read stays public.
