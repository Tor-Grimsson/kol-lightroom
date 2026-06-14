---
title: API keys & environment variables
type: guide
status: active
updated: 2026-06-14
description: The publishable/secret/anon key confusion explained, where each key goes, the VITE_ rule, and an intro to Row Level Security.
audience: internal
aliases:
  - api-keys-and-environment
tags:
  - provider/supabase
  - domain/database
related:
  - "[[03-setup-walkthrough|setup walkthrough]]"
  - "[[08-pitfalls-and-troubleshooting|pitfalls]]"
---

# API keys & environment variables

This is the chapter that confuses everyone. If you've felt like you're taking crazy pills reading Supabase docs, this is why — and it's not you.

## 1. What an API key is

When your app (or a script) calls Supabase, Supabase needs to know *"are you allowed to do this, and as whom?"* An **API key** is the token that answers that. Different keys grant different power.

## 2. The naming mess (read this twice)

Supabase **renamed its keys**. Older tutorials, blog posts, and this project's *original* variable name use the old words. The dashboard uses the new words. They're the same things:

| Old name (tutorials, legacy) | New name (current dashboard) | Looks like | Who uses it |
|---|---|---|---|
| **anon key** | **Publishable key** | `sb_publishable_…` | The **browser** (your app). Safe to expose. |
| **service_role key** | **Secret key** | `sb_secret_…` | **Servers / scripts only.** Never the browser. |

So when any guide says *"paste the anon key"* and your dashboard only shows a *"Publishable key"* — **they mean the same key.** The dashboard even keeps a separate **"Legacy anon, service_role API keys"** tab for the old-format versions; you can ignore it and use the new publishable/secret keys.

> In this project the env var was originally named `VITE_SUPABASE_ANON_KEY` (old word). It's now `VITE_SUPABASE_PUBLISHABLE_KEY` (matches the dashboard). The code accepts either, so an old `.env.local` still works.

## 3. Publishable vs Secret — the actual difference

- **Publishable key** (`sb_publishable_…`): goes in the browser. By itself it can only do what your **security rules** allow — typically *read public data*. It cannot wreck your database, *provided you've set up Row Level Security* (section 6). Safe to ship to users.
- **Secret key** (`sb_secret_…`): bypasses the rules. It can read, write, and delete **anything**. It is a master key. It must live only where users can't see it: a server, a CI job, or a local script's environment. **If a secret key ever reaches the browser or a git commit, treat it as compromised and rotate it.**

## 4. Environment variables, and the `VITE_` rule

An **environment variable** is a named setting your program reads at startup, kept *outside* the code (so secrets aren't hard-coded). They live in a file called **`.env.local`** at the repo root:

```
VITE_SUPABASE_URL=https://yourref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

Here's the rule that keeps you safe, specific to Vite (the tool that builds this app):

> **Only variables whose name starts with `VITE_` are bundled into the browser.** Everything else stays server-side.

Consequences:

- The publishable key is **meant** to be in the browser, so `VITE_SUPABASE_PUBLISHABLE_KEY` is correct.
- The **secret key must never** get a `VITE_` name — that would ship your master key to every visitor. The ingest script reads it as `SUPABASE_SERVICE_ROLE_KEY` from the plain shell environment, *not* from a `VITE_` variable.

## 5. `.env.local` and git

`.env.local` is listed in `.gitignore`, so it is **never committed**. This is on purpose:

- Keys don't belong in your code history (anyone with the repo would have them forever).
- Each machine/person can have their own `.env.local` pointing at their own project.

If you ever see `.env.local` show up in `git status` as a file to commit, **stop** — your `.gitignore` is wrong. (See [[06-git-github-and-syncing|chapter 06]].)

## 6. Row Level Security (RLS), briefly

Why is the publishable key safe in the browser even though anyone can read it? Because of **Row Level Security** — rules on the table that say who can do what.

This project's `images` table has policies meaning, in plain words:

- **Anyone may read** (so the public Library works with the publishable key).
- **Only an authenticated/secret-key writer may insert, update, or delete.**

So a visitor holding the publishable key can *look* but not *touch*. The secret key (server-side) is what writes. RLS is the reason the split between the two keys actually protects you — without RLS, a publishable key could be abused. **Rule of thumb: enable RLS on every table that the browser can reach.**

## 7. Quick reference

| You want to… | Use | Where it lives |
|---|---|---|
| Read data in the app (browser) | Publishable key | `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` |
| Write data from a script/server | Secret key | `SUPABASE_SERVICE_ROLE_KEY` in the shell env (never `VITE_`) |
| Point at your project | Project URL | `VITE_SUPABASE_URL` in `.env.local` |
| Run the CLI (`db push`, etc.) | Your *account* access token | stored by `supabase login` |

---

**Next:** [[05-schema-tables-and-migrations|Schema, tables & migrations — changing the database safely]]
