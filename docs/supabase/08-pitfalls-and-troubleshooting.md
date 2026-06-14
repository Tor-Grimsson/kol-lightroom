---
title: Pitfalls & troubleshooting
type: reference
status: active
updated: 2026-06-14
verified: 2026-06-14
description: A lookup of every Supabase/stack gotcha hit in this project — symptom, cause, fix — plus the general debugging order.
audience: internal
aliases:
  - pitfalls-and-troubleshooting
tags:
  - provider/supabase
  - domain/database
related:
  - "[[04-api-keys-and-environment|api keys & env]]"
  - "[[07-getting-data-in-and-out|getting data in & out]]"
---

# Pitfalls & troubleshooting

Every one of these actually happened while building this project. They're the fastest way to learn where the sharp edges are. Find your symptom, apply the fix.

## Quick index

| Symptom | Jump to |
|---|---|
| "Access token not provided" | [#1](#1-access-token-not-provided) |
| Dashboard says no "anon" key | [#2](#2-the-dashboard-has-no-anon-key) |
| Library: "Failed to load" | [#3](#3-library-shows-failed-to-load) |
| Cards show but thumbnails are blank/404 | [#4](#4-thumbnails-are-blank-or-404) |
| Images blocked by COEP / cross-origin | [#5](#5-images-blocked-by-cross-origin-isolation) |
| `supabase start` crashes (exit 134) | [#6](#6-supabase-start-crashes-exit-134) |
| Insert says "row-level security" | [#7](#7-insert-blocked-by-row-level-security) |
| Changed `.env.local`, app didn't notice | [#8](#8-env-changes-not-picked-up) |

---

## 1. "Access token not provided"

**Cause:** you logged in with one CLI (`npx supabase`) and are now running another (`brew` `supabase`). They store the login token in different places.
**Fix:** pick one CLI and re-run `supabase login` with it. Don't alternate.

## 2. The dashboard has no "anon" key

**Cause:** Supabase **renamed** the keys. The old **anon key** is now the **Publishable key** (`sb_publishable_…`); the old **service_role** is the **Secret key** (`sb_secret_…`). Old tutorials still say "anon."
**Fix:** use the **Publishable key** wherever a guide says "anon key." See [[04-api-keys-and-environment|chapter 04]]. (Legacy-format keys still exist under a separate dashboard tab if something truly needs them.)

## 3. Library shows "Failed to load"

**Cause:** the app reached Supabase but the request errored — almost always a wrong `VITE_SUPABASE_URL`, a wrong/old key, or the table/policy missing.
**Fix:** recheck `.env.local` (URL is `https://<ref>.supabase.co`, key is the publishable one). Confirm the table exists (Table Editor) and has a public-read policy. Restart `pnpm dev` after edits.

## 4. Thumbnails are blank or 404

**Cause:** the database row is fine but its `cdn_url` is wrong. The classic version: pasting an `insert` with long URLs into the SQL Editor **wrapped the lines and inserted newlines/spaces into the middle of the URL**, corrupting it. `curl` of the *clean* URL returns 200, but the stored one 404s.
**Fix (data):** correct the URL in the row (Table Editor, or an `update`). **Fix (defensive, already in place):** the Library strips whitespace from URLs before using them. **Prevention:** keep long values on one unbroken line, or use the ingest script instead of pasted SQL.

## 5. Images blocked by cross-origin isolation

**Cause:** to let the raw-decoder's WebAssembly use threads, the dev server can send COOP/COEP headers (cross-origin isolation). Those headers **block cross-origin `<img>` loads** (your CDN thumbnails) unless every image is CORS-tagged — and browsers handle the lenient `credentialless` mode inconsistently.
**Fix (chosen here):** **don't send those headers.** The ~1s decode speedup isn't worth breaking image loading. They were removed from `vite.config.js`. If you ever re-add them, you must also solve cross-origin image loading (CORS headers on the CDN + `crossorigin` on every `<img>`).

## 6. `supabase start` crashes (exit 134)

**Cause:** the local-stack Postgres image (`supabase/postgres`) aborts during init on some Docker setups (seen on this machine; plain `postgres:16` runs fine, so it's that image + this Docker, not Docker generally).
**Fix:** don't fight it — **use the cloud project** (the normal path anyway). If you genuinely need local, give Docker more memory, try a different machine, or run a plain Postgres + PostgREST stand-in. For a beginner: skip local entirely.

## 7. Insert blocked by Row Level Security

**Cause:** you tried to write using the **publishable** (browser/anon) key. By policy it can only read.
**Fix:** writes need the **secret key** (server/script) or an authenticated user. Use the ingest script, the SQL Editor (runs as admin), or the Table Editor. Never ship the secret key to the browser to "fix" this — that defeats the security.

## 8. `.env` changes not picked up

**Cause:** environment files are read **once, at dev-server startup**. Editing `.env.local` while `pnpm dev` is running changes nothing.
**Fix:** stop (`Ctrl-C`) and re-run `pnpm dev`.

---

## General debugging order

When something's off, narrow it down in this order — it isolates the layer fast:

1. **Does the data exist?** Open the Table Editor. Rows there → the database is fine; the problem is the app or the connection. No rows → the problem is ingest/insert.
2. **Can the app reach Supabase?** "Failed to load" = connection (URL/key). "No images yet" = connected but empty.
3. **Is it the data or the display?** Cards render but images don't = the `cdn_url` (pitfall #4), not Supabase.
4. **Is it a key/permission issue?** Write fails = RLS + wrong key (#7). Read fails = wrong key/URL (#3).
5. **Did you restart after env edits?** (#8.) Embarrassingly common.

## A safety checklist

- [ ] `.env.local` is in `.gitignore` (`git check-ignore .env.local` prints the name).
- [ ] No `sb_secret_…` value anywhere with a `VITE_` name, or in any committed file.
- [ ] RLS enabled on every browser-reachable table.
- [ ] Migrations committed to git; schema changes go through `db push`, not hand-clicks.
