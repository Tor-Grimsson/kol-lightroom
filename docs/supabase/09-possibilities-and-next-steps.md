---
title: Possibilities & next steps
type: guide
status: active
updated: 2026-06-14
description: What else Supabase can do — auth, storage, edge functions, realtime, presigned uploads — and where to learn more.
audience: internal
aliases:
  - possibilities-and-next-steps
tags:
  - provider/supabase
  - domain/database
related:
  - "[[02-this-stack|this stack]]"
  - "[[07-getting-data-in-and-out|getting data in & out]]"
---

# Possibilities & next steps

You've used the database half of Supabase. That's the core, but the platform does more. Here's the map of what's available, what it's for, and which bits this project might grow into — kept beginner-level.

## 1. Auth (logins)

**What:** a complete sign-in system — email/password, magic links, "Sign in with GitHub/Google," etc. — that issues each logged-in user a token your security rules can read.
**Why you'd add it:** right now this project's `images` table is *public read, secret-key write*. With Auth, you could let *logged-in* users write (upload/edit) directly from the browser, safely, without ever exposing the secret key. Row Level Security policies can say "a user may edit only their own rows."
**Where:** dashboard → **Authentication**.

## 2. Storage (Supabase's own file buckets)

**What:** file storage built into Supabase — like Backblaze B2, but native to the platform, with the same access-rule system as the database.
**Why it's relevant:** this project deliberately uses **Backblaze B2** for files instead (it predates the database and is the established CDN). You don't have to switch. But if you ever wanted files and database under one roof with unified permissions, Supabase Storage is the option. *Bytes in a bucket, rows in the database* still holds either way.
**Where:** dashboard → **Storage**.

## 3. Edge Functions (small server code)

**What:** little pieces of server-side code Supabase runs for you, on demand. They can hold secrets safely (they're not the browser).
**Why you'd add it:** the cleanest way to let the browser publish a photo *without* a secret key. The flow: the browser asks an Edge Function "give me permission to upload this file"; the function (holding the secret) returns a short-lived **presigned upload URL**; the browser uploads straight to the bucket, then writes the row. This is the planned in-app "Publish" button for the editor.
**Where:** dashboard → **Edge Functions** (or `supabase functions` in the CLI).

## 4. Realtime (live updates)

**What:** your app can *subscribe* to a table and get pushed updates the instant a row changes — no refresh.
**Why you'd add it:** if two people use the library at once, or a long ingest runs, new images could appear live.
**Where:** enabled per-table; used via `supabase.channel(...)` in code.

## 5. The dashboard tools worth knowing

| Tool | Use it to |
|---|---|
| **Table Editor** | Eyeball and hand-edit rows. |
| **SQL Editor** | Run any query; save common ones. |
| **Database → Indexes/Policies** | See/adjust performance indexes and RLS rules. |
| **Logs / Advisors** | See errors and get suggestions (missing indexes, RLS gaps). |
| **Project Settings → API Keys** | Get/rotate keys. |

## 6. Where to get help

- **Official docs:** [supabase.com/docs](https://supabase.com/docs) — genuinely good, and they use the *current* key names.
- **In-dashboard AI / Docs links** — context-aware help on the page you're on.
- **This project's docs:** the [[INDEX|guide index]], the session logs under `docs/llm-context/session-log/`, and `supabase/LOCAL-DEV.md` for the env/setup specifics.
- **Pitfalls first:** when stuck, [[08-pitfalls-and-troubleshooting|chapter 08]] before anything else.

## 7. A sensible learning path from here

1. **Get comfortable reading data** — open the SQL Editor and run `select`s until queries feel normal.
2. **Make a schema change** — add a column via a migration ([[05-schema-tables-and-migrations|chapter 05]]). Feel the push workflow.
3. **Add Auth** when you want logins / per-user data.
4. **Add an Edge Function** when you want the browser to publish without secrets.
5. **Put the repo on GitHub** and turn on the Supabase GitHub integration for preview branches.

None of these are required. The database you have already works. Add capabilities only when a real need shows up — not because the dashboard has more buttons.

---

**Back to:** [[INDEX|the guide index]]
