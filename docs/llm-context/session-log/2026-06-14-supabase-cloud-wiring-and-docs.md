# Session: Supabase cloud wiring, COEP removal, key rename, beginner docs

**Date:** 2026-06-14
**Agent:** Grim
**Summary:** Took the image catalog from the local stand-in to the real **cloud Supabase** project (login → create → link → db push → live `/library`), renamed the publishable key var to match the current dashboard, dropped the cross-origin-isolation headers that were breaking CDN images, hardened the Library against paste-mangled URLs, and wrote a postmortem + a 10-file beginner Supabase guide.

## Changes Made

### Files Modified
- `vite.config.js` — **removed COOP/COEP headers** (server + preview). They enabled WASM threads (~1s faster decode) but blocked cross-origin CDN `<img>` loads inconsistently across browsers. Decode is now single-threaded; images load everywhere. Comment left warning not to re-add without solving cross-origin image loading.
- `src/lib/supabase.js` — read `VITE_SUPABASE_PUBLISHABLE_KEY ?? VITE_SUPABASE_ANON_KEY` (Supabase renamed "anon key" → "Publishable key"; old name kept as fallback).
- `src/pages/Library.jsx` — removed `crossOrigin="anonymous"` from the `<img>` (no longer needed without COEP); **strip whitespace from `cdn_url`** before use (defends against newlines baked into URLs by SQL-editor line-wrapping).
- `.env.local` — points at the **cloud** project (`https://tvuyyybxvfkmgflxvhii.supabase.co` + publishable key). Var renamed to `VITE_SUPABASE_PUBLISHABLE_KEY`. Git-ignored.
- `.gitignore` — added `.env`, `.env.local`, `.env*.local`, `.playwright-mcp/`, `supabase/.branches/`, `supabase/.temp/`.
- `scripts/ingest.mjs` — added `--key` / `--cdn-url` flags (catalog an existing bucket object without re-uploading); `--file` now optional when `--cdn-url` is given.

### Files Added
- `POSTMORTEM.md` (repo root) — candid accounting of this session's mistakes (stale key naming, asking-not-acting, COEP saga, local-Supabase rabbit hole, paste-mangled SQL, npx-vs-brew login trap, verbosity).
- `docs/supabase-guide/` — beginner Supabase guide, **kol-docs framework**, ~8.5k words: `INDEX.md` + `01`–`09` (what-is-a-database, this-stack, setup-walkthrough [playbook], api-keys-and-environment, schema-tables-and-migrations, git-github-and-syncing, getting-data-in-and-out, pitfalls-and-troubleshooting [reference], possibilities-and-next-steps). **To be housed in `~/.dotfiles/docs` by the user** (`mv docs/supabase-guide ~/.dotfiles/docs/supabase`).

### Features Added/Removed
- **Cloud Supabase is live** — project `kol-lightroom` (ref `tvuyyybxvfkmgflxvhii`, North EU/Stockholm). Migration pushed; `images` table exists in cloud. `/library` reads it via the publishable key.
- **Removed** cross-origin isolation (so removed WASM threading on `/develop`).

## Current State

### Working (verified live via Playwright + the user's Firefox)
- `/library` loads from **cloud** Supabase, renders 3 cataloged images (added via the dashboard SQL Editor) with thumbnails + metadata + tag filtering. No errors.
- Image thumbnails load in all browsers (no COEP interference; whitespace-stripped URLs).
- Editor `/develop` unchanged and working (now single-threaded decode).

### Known Issues
- **3 cloud rows have whitespace baked into `cdn_url`** (SQL-editor wrap damage). The app strips it, so they render — but the stored values are dirty. Optional cleanup: an `update` to trim them.
- **Decode single-threaded now** (~1s slower full-res than the threaded path). Accepted — preview path (2.6s) unaffected; images-load reliability won the trade.
- **`supabase start` still exit-134s on this Docker** — cloud is the working path. The local plain-pg/PostgREST stand-in from the prior session is torn down.
- **git not yet initialized** — user will run `git init` + first commit themselves (`.gitignore` is prepared and safe).

## Next Steps
1. **git init + first commit** (user-driven; `.gitignore` ready), then optionally push to GitHub.
2. **Re-ingest demo data into cloud** (or clean the 3 dirty `cdn_url`s) — the ingest script needs the cloud **secret key** (`sb_secret_…`) in `SUPABASE_SERVICE_ROLE_KEY`.
3. **In-app publish + editor↔catalog round-trip** (Edge Function presigned B2 upload; "open in develop" restores the `edit` op-stack).
4. **Move `docs/supabase-guide/` → `~/.dotfiles/docs`**.
