---
title: Setup walkthrough — Supabase from scratch
type: playbook
status: active
updated: 2026-06-14
description: Copy-paste runbook to install the CLI, log in, create a project, link it, push the schema, and wire the app.
audience: internal
providers:
  - supabase
placeholders:
  - "{{PROJECT_REF}}"
  - "{{DB_PASSWORD}}"
aliases:
  - setup-walkthrough
tags:
  - provider/supabase
  - domain/database
related:
  - "[[04-api-keys-and-environment|api keys & env]]"
  - "[[05-schema-tables-and-migrations|schema & migrations]]"
---

# Setup walkthrough — Supabase from scratch

This is the exact path from "nothing" to "the app is reading my cloud database." Do the steps in order. Anything in `{{DOUBLE_BRACES}}` is a value you'll substitute.

## 0. Prerequisites

- A terminal (the Terminal app, or the one in your editor).
- **Node.js** and **pnpm** installed (this project uses pnpm).
- A free account at [supabase.com](https://supabase.com) (sign up with GitHub or email).
- The project code on your machine.

You do **not** need to install Postgres, Docker, or write any SQL by hand.

## 1. Get the Supabase CLI

The CLI is a command-line tool that talks to Supabase. Two ways:

```bash
# Option A — permanent install (recommended, macOS):
brew install supabase/tap/supabase

# Option B — run it without installing, every time:
npx supabase@latest <command>
```

> **Pitfall:** Don't mix them. If you log in with `npx supabase` and later use the brew `supabase`, the second one won't see your login (different token storage) and says *"Access token not provided."* Pick one. This guide assumes the brew install, so commands read `supabase …`.

Check it works:

```bash
supabase --version
```

## 2. Log in

```bash
supabase login
```

This opens your browser, you click authorize, and it stores a token on your machine so future commands work. You should see *"You are now logged in."*

> If a later command still says "Access token not provided," you logged in with the *other* CLI (see step 1's pitfall). Re-run `supabase login` with the one you're actually using.

## 3. Create a project

Easiest in the browser: go to the Supabase dashboard → **New project**. You'll set:

- a **name** (e.g. `kol-lightroom`),
- a **database password** — `{{DB_PASSWORD}}`. **Write it down.** You need it in step 5, and it's annoying to reset.
- a **region** — pick one near you (this project used North EU / Stockholm).

Wait ~1–2 minutes for it to provision.

Now find your **project reference** — `{{PROJECT_REF}}`. It's the random-looking ID in the dashboard under **Project Settings → General → Project ID**, and it's also in the project's URL: `supabase.com/dashboard/project/{{PROJECT_REF}}`.

## 4. Link your local code to the cloud project

From the repo root (the folder with the `supabase/` directory):

```bash
supabase link --project-ref {{PROJECT_REF}}
```

It asks for the database password (`{{DB_PASSWORD}}` from step 3). "Link" just means: *this folder is now associated with that cloud project*, so the next command knows where to push.

## 5. Push the schema to the cloud

```bash
supabase db push
```

This reads the migration files in `supabase/migrations/` and applies them to your cloud database — creating the `images` table and its rules. It lists what it will apply and asks `[Y/n]`; type `y`.

You should see *"Finished supabase db push."* Your cloud database now has the table. (What a migration *is* → [[05-schema-tables-and-migrations|chapter 05]].)

## 6. Get the two values the app needs

In the dashboard: **Project Settings → API Keys**.

- **Project URL** — actually shown on the project home / API page. It's `https://{{PROJECT_REF}}.supabase.co`.
- **Publishable key** — the one starting `sb_publishable_…`. Click **Copy**. (This is the browser-safe key. It is *not* labelled "anon" anymore — that's the single most confusing rename; see [[04-api-keys-and-environment|chapter 04]].)

Do **not** copy the **Secret key** for the app — that one is for servers only.

## 7. Put them in `.env.local`

In the repo root, create/edit `.env.local`:

```
VITE_SUPABASE_URL=https://{{PROJECT_REF}}.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…paste-yours…
```

> `.env.local` is **git-ignored** — it never gets committed. That's deliberate: keys don't belong in your code history.

## 8. Restart the app

Environment files are only read when the dev server starts, so restart it:

```bash
# stop the running pnpm dev (Ctrl-C), then:
pnpm dev
```

## N. Verification

1. Open `localhost:5173/library`.
2. It loads with **no error**. If the database is empty it says *"No images yet"* — that's success (it connected; there's just no data).
3. To prove data flows, add rows (the SQL Editor or the ingest script — [[07-getting-data-in-and-out|chapter 07]]) and refresh; cards appear.

If instead you see *"Failed to load"*, the URL or key is wrong — recheck steps 6–7. If you see cards but **broken thumbnails**, the image links are bad, not Supabase — see [[08-pitfalls-and-troubleshooting|pitfalls]].
