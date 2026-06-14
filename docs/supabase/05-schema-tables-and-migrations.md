---
title: Schema, tables & migrations
type: guide
status: active
updated: 2026-06-14
description: What a table schema and a migration are, how supabase/migrations + db push work, and how to change the database without breaking it.
audience: internal
aliases:
  - schema-tables-and-migrations
tags:
  - provider/supabase
  - domain/database
related:
  - "[[03-setup-walkthrough|setup walkthrough]]"
  - "[[07-getting-data-in-and-out|getting data in & out]]"
---

# Schema, tables & migrations

## 1. Schema = the shape of your data

A table's **schema** is its blueprint: what columns exist, their types, and the rules. Here's this project's `images` table schema in plain SQL (lightly trimmed):

```sql
create table public.images (
  id          uuid primary key default gen_random_uuid(),  -- unique id, auto-generated
  created_at  timestamptz not null default now(),          -- when the row was added
  filename    text not null,                               -- "blokk-artwork.jpg"
  b2_key      text not null unique,                        -- the file's path in the bucket
  cdn_url     text,                                        -- the public link to the image
  width       integer,
  height      integer,
  camera      text,
  iso         integer,
  shot_at     timestamptz,                                 -- when the photo was taken
  edit        jsonb not null default '{}',                 -- the editor's adjustments, as JSON
  tags        text[] not null default '{}'                 -- a list of tags
);
```

Reading it:

- **`primary key`** — `id` uniquely identifies each row; no two rows share one.
- **`not null`** — that column must have a value (you can't insert a row with no `filename`).
- **`unique`** — no two rows can have the same `b2_key` (you can't catalog the same file twice).
- **`default`** — if you don't supply a value, it uses this (e.g. `created_at` defaults to "now").
- **types** — `text`, `integer`, `timestamptz` (a date+time), `jsonb` (flexible JSON), `text[]` (a list of text).

## 2. A migration is a recorded change to the schema

You don't edit the cloud database by hand and hope you remember what you did. Instead, every change to the *shape* of the database is written as a **migration** — a `.sql` file describing the change. They live in your code:

```
supabase/migrations/20260614204500_images.sql
```

The number in front is a timestamp, so migrations apply **in order**. The first one *creates* the `images` table; a future one might *add a column*. Together, run in sequence, they build your database from empty to current.

> **Why bother?** Because the migration files live in git ([[06-git-github-and-syncing|chapter 06]]), your database's shape is **version-controlled and reproducible**. Anyone can recreate the exact same database by running the migrations. No "works on my machine" mystery.

## 3. The two directions: push and pull

```
your migration files  --(supabase db push)-->  the cloud database
the cloud database     --(supabase db pull)-->  a new migration file
```

- **`supabase db push`** — apply your local migration files to the cloud (you did this in setup). Use this when *you* wrote a migration and want it live.
- **`supabase db pull`** — if you changed the database *in the dashboard* and want that captured as a migration file, pull it down. Use this to keep your files in sync with reality.

**Healthiest habit:** make schema changes by **writing a migration and pushing**, not by clicking in the dashboard. Then the files are always the source of truth.

## 4. How to add a column (worked example)

Say you want a `caption` column. Create a new migration file:

```bash
supabase migration new add_caption
```

That makes an empty file under `supabase/migrations/`. Put this in it:

```sql
alter table public.images add column caption text;
```

Apply it:

```bash
supabase db push
```

Done — every environment that runs your migrations now has a `caption` column, and the change is in git history forever.

## 5. Data vs schema — don't confuse them

- **Schema migrations** change the *shape* (tables, columns, rules). They belong in `supabase/migrations/`.
- **Data** (the actual rows) is separate. You add rows with `insert` statements, the ingest script, or the dashboard's Table Editor — see [[07-getting-data-in-and-out|chapter 07]]. Don't put one-off data inserts in migration files unless it's *seed* data meant to ship everywhere.

## 6. Inspecting the schema in the dashboard

You don't have to read SQL to see your schema:

- **Table Editor** — a spreadsheet-like view of the table and its columns.
- **Database → Tables** — shows columns, types, and constraints.
- **SQL Editor** — run `\d images`-style queries, or just `select * from images limit 5;`.

---

**Next:** [[06-git-github-and-syncing|Git, GitHub & syncing — version control and how Supabase ties in]]
