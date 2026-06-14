---
title: What a database is, and what Supabase is
type: guide
status: active
updated: 2026-06-14
description: Ground-floor concepts — tables, rows, SQL, Postgres, and what Supabase wraps around Postgres.
audience: internal
aliases:
  - what-is-a-database-and-supabase
tags:
  - provider/supabase
  - domain/database
related:
  - "[[02-this-stack|this stack]]"
  - "[[05-schema-tables-and-migrations|schema & migrations]]"
---

# What a database is, and what Supabase is

## 1. A database is a very strict spreadsheet

Picture a spreadsheet. It has a tab (a **table**), the tab has columns with fixed meanings, and each line is one **row**.

A database is that — but strict and fast:

- Every column has a **type**. A column called `iso` only holds whole numbers; a column called `shot_at` only holds dates. Put text in a number column and it refuses. That strictness is a feature: your data can't quietly rot.
- It can hold **millions of rows** and still find one instantly, because of **indexes** (think: the index at the back of a book — a pre-sorted lookup so it doesn't read every page).
- Many programs can read and write it **at the same time** without stepping on each other.

In this project there's one table, `images`. One row = one published photo. Columns include `filename`, `camera`, `iso`, `tags`, and a link to the actual image file. (We'll see why the *file itself* isn't in the database in [[02-this-stack|chapter 02]].)

## 2. SQL is how you talk to it

You don't click around to query a database — you write **SQL** (Structured Query Language). It reads almost like English:

```sql
select filename, camera from images where iso = 100;
```

> "Give me the filename and camera of every row in `images` where iso equals 100."

```sql
insert into images (filename, camera, iso) values ('photo.jpg', 'Canon EOS 5DS', 100);
```

> "Add one new row with these values."

You'll mostly *not* write SQL by hand in this project — the app and a script do it for you — but it's good to recognize it. When you used the Supabase **SQL Editor** to add three images, that was raw SQL.

## 3. Postgres is the specific database

There are many database engines. The one Supabase uses is **PostgreSQL** (everyone says **Postgres**). It's free, open-source, battle-tested, and unusually capable — it does plain tables, but also stores flexible JSON, arrays, full-text search, and more. When you read "Postgres," read "the actual database engine doing the work."

This project leans on a few Postgres niceties:

- a `jsonb` column (`edit`) that stores the photo's adjustment settings as flexible JSON,
- a `text[]` column (`tags`) that stores a *list* of tags in one cell,
- indexes for fast filtering by date and tag.

## 4. So what is Supabase, exactly?

Postgres on its own is just an engine. To use it you'd need a server to run it on, a way to reach it safely over the internet, login/permissions, backups, a web UI… that's a lot.

**Supabase is all of that, hosted and wrapped around Postgres for you.** Concretely, a Supabase *project* gives you:

| Piece | What it is | You've already touched it |
|---|---|---|
| **A Postgres database** | Your actual tables and data, running on their servers. | Yes — the `images` table lives here. |
| **An auto-generated API** | A web address your app can call to read/write the tables, without you writing a server. | Yes — the app reads `images` through it. |
| **API keys** | Passwords-ish tokens that say "this request is allowed." | Yes — the publishable key in `.env.local`. |
| **A dashboard** | The website at supabase.com where you click around: Table Editor, SQL Editor, Settings. | Yes. |
| **Auth, Storage, Edge Functions, Realtime** | Optional extras (logins, file storage, server code, live updates). | Not yet — see [[09-possibilities-and-next-steps|chapter 09]]. |

**Mental model:** *Supabase = your database, living on the internet, with a friendly front door and a control panel.*

## 5. "Cloud" vs "local"

Two ways to run all this:

- **Cloud** — Supabase runs it on their servers. You manage it from the website. This is what you set up. Your project lives in the **North EU (Stockholm)** region. This is the real one.
- **Local** — a copy of the whole stack running on your own machine via `supabase start` (it uses Docker). Handy for offline development. On this machine it didn't boot (a Docker quirk), so we used the cloud project directly. See [[08-pitfalls-and-troubleshooting|pitfalls]].

For a beginner: **just use the cloud project.** Local is an optimization you don't need yet.

## 6. The one rule that prevents most disasters

Your database holds **small, structured, searchable data** — names, numbers, dates, tags, links. It does **not** hold big binary files (photos, video). Those go in **object storage** (a "bucket"); the database stores only a *link* to the file plus its metadata.

Why this matters is the subject of the next chapter.

---

**Next:** [[02-this-stack|How the pieces fit — app, Supabase, Backblaze, git]]
