---
title: This stack — how the pieces fit
type: guide
status: active
updated: 2026-06-14
description: The map — how the Vite/React app, Supabase Postgres, Backblaze B2 object storage, and git/GitHub relate.
audience: internal
aliases:
  - this-stack
tags:
  - provider/supabase
  - provider/backblaze
  - domain/database
related:
  - "[[01-what-is-a-database-and-supabase|what a database is]]"
  - "[[07-getting-data-in-and-out|getting data in & out]]"
---

# This stack — how the pieces fit

Before any commands, the map. Four things, each with one job.

## 1. The four pieces

| Piece | What it is | Its one job here |
|---|---|---|
| **The app** (Vite + React) | The website you run with `pnpm dev`, served at `localhost:5173`. | Show the UI — the editor (`/develop`) and the library (`/library`). |
| **Supabase** (Postgres) | Your hosted database. | Store one **row of metadata** per image: filename, camera, tags, the edit, and a **link** to the file. |
| **Backblaze B2** (object storage / "the bucket") | A place on the internet that holds **files** (the actual image bytes), reached via the `bucket` command. | Hold the heavy stuff — the JPEGs/derivatives — and serve them over a CDN URL. |
| **git + GitHub** | Version control — a time-machine for your code. | Track every change to the code and the database's shape (migrations). See [[06-git-github-and-syncing|chapter 06]]. |

## 2. Why files and metadata are separated

This is the most important architectural idea, and it trips up beginners who expect "upload an image to the database."

**You never put the image bytes in the database.** Databases are built for small structured data; stuffing megabytes of photo into a cell makes them slow and expensive. Instead:

```
the photo file (3 MB JPEG)      →  Backblaze B2 bucket   →  https://…/photo.jpg   (a CDN link)
a row describing the photo       →  Supabase `images`     →  { filename, camera, tags, cdn_url: "https://…/photo.jpg" }
```

The database row holds the **`cdn_url`** — a pointer to where the bytes actually live. When the Library page shows a thumbnail, it reads the row from Supabase, finds the `cdn_url`, and the browser loads the image from Backblaze directly.

> **Slogan:** *Bytes in the bucket, rows in the database.* Memorize this; it explains the whole shape.

## 3. The flow, end to end

What happens when you open `/library`:

```
1. Browser loads the app from localhost:5173 (Vite dev server).
2. The app asks Supabase: "give me all rows in `images`, newest first."
   (Uses the PUBLISHABLE key — safe in the browser, read-only by policy.)
3. Supabase returns the rows (filename, camera, tags, cdn_url, …).
4. For each row, the browser loads the thumbnail from the cdn_url (Backblaze B2).
5. The page renders the grid.
```

And when you *publish* a new image (the ingest script, [[07-getting-data-in-and-out|chapter 07]]):

```
1. Push the JPEG file → Backblaze B2 (the `bucket up` command).
2. Insert a row → Supabase `images` (filename, metadata, the cdn_url, the edit).
   (Uses the SECRET key — server-side only, allowed to write.)
```

## 4. Where each secret lives

This matters for safety (full detail in [[04-api-keys-and-environment|chapter 04]]):

| Secret | Lives in | Why there |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` | The address of your Supabase project. Not secret. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | Read-only public key, safe in the browser. |
| Supabase **secret key** | a server/CLI environment, **never** `.env.local` with a `VITE_` name | Can write/delete anything — must never reach the browser. |
| Backblaze credentials | inside the `bucket` CLI's own config | The bucket tool handles auth; the app never sees these. |

## 5. Which knobs you'll actually turn

For day-to-day use you only touch three things:

1. **`.env.local`** — paste two values (URL + publishable key) once. Done in setup.
2. **The Supabase dashboard** — to look at data (Table Editor) or run a query (SQL Editor).
3. **`pnpm dev`** — to run the app and see it.

Everything else (migrations, the ingest script, the bucket) is occasional.

---

**Next:** [[03-setup-walkthrough|Setting it up from scratch — the copy-paste walkthrough]]
