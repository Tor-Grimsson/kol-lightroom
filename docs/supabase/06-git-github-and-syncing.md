---
title: Git, GitHub & syncing
type: guide
status: active
updated: 2026-06-14
description: What git and GitHub are for a beginner, why migrations live in the repo, the .gitignore safety rule, and how Supabase ties into a git workflow.
audience: internal
aliases:
  - git-github-and-syncing
tags:
  - provider/supabase
  - provider/github
  - domain/database
related:
  - "[[04-api-keys-and-environment|api keys & env]]"
  - "[[05-schema-tables-and-migrations|schema & migrations]]"
---

# Git, GitHub & syncing

Supabase and git are separate tools, but they work best together. This chapter explains git just enough, then shows how Supabase fits in.

## 1. Git in one minute

**Git** is a time-machine for a folder of code. You take **commits** — labelled snapshots — and you can always go back, compare, or branch off. It runs entirely on your machine; you don't need the internet to use it.

The everyday loop:

```bash
git add -A                 # stage every change you've made
git commit -m "a message"  # save a snapshot with a note
```

`git status` shows what's changed but not yet committed. `git log` shows the history.

**GitHub** is a website that *hosts* your git history online — a backup, a place to collaborate, and (for Supabase) an integration point. Git works without GitHub; GitHub is the cloud copy.

## 2. Why this matters for Supabase

Two things in your repo are tied to Supabase:

1. **The migration files** (`supabase/migrations/`) — the *shape* of your database, as code. Because they're committed to git, your database is reproducible and its history is auditable. This is the big reason "do git first" is good advice: you want the schema under version control before you push it anywhere real.
2. **`supabase/config.toml`** — project settings, also committed.

What is **not** in git: your `.env.local` (keys) and your actual data rows. Keys are secret; data lives in the cloud database.

## 3. The one safety rule: `.gitignore`

A file called **`.gitignore`** lists things git should **never** track. Before your first commit, make sure it ignores secrets and junk:

```
node_modules/        # downloaded dependencies, huge, re-installable
dist/                # build output
.env
.env.local           # YOUR KEYS — must never be committed
.playwright-mcp/      # test scratch
supabase/.branches/
supabase/.temp/       # supabase CLI local state
```

> **The trap:** if `.env.local` is *not* in `.gitignore` and you commit, your keys go into history — and if you ever push to GitHub, they're exposed to anyone who sees the repo. Always confirm `.env.local` is ignored *before* the first commit. Check with: `git check-ignore .env.local` (it should print the filename, meaning "yes, ignored").

## 4. First-time setup of a repo

If the project isn't a git repo yet:

```bash
git init -b main                                   # start tracking, default branch "main"
git add -A                                         # stage everything (ignored files excluded)
git commit -m "Initial commit"                      # first snapshot
```

To put it on GitHub (optional, for backup + the Supabase integration):

```bash
# create an empty repo on github.com first, then:
git remote add origin https://github.com/you/kol-lightroom.git
git push -u origin main
```

## 5. Does Supabase *need* git or GitHub?

No — you can `supabase link` and `db push` without ever using git. But you *should* use git, for three reasons:

1. **Migrations want versioning** — pushing an un-tracked schema to a real database is how you lose track of what your database looks like.
2. **Keys want excluding** — git (via `.gitignore`) is what keeps `.env.local` out of harm's way.
3. **GitHub unlocks extras** — Supabase has a **GitHub integration** (in the dashboard) that can auto-apply migrations on push, and create disposable **preview branches** (a throwaway database per pull request). These only work if the repo is on GitHub. Beginner advice: you don't need this on day one, but it's the reason GitHub is worth doing eventually.

## 6. The recommended order (and why)

When connecting a fresh project to Supabase:

1. **git first** — `.gitignore` correct, `git init`, first commit. (Now your keys are safe and your migrations are tracked.)
2. **GitHub** *(optional)* — push, if you want the integration/backup.
3. **Supabase** — `login` → create project → `link` → `db push`.
4. **Wire `.env.local`** — URL + publishable key, then restart the app.

The reason git comes first is *not* that Supabase requires it — it's that you want your schema versioned and your secrets excluded **before** anything touches a real database or a remote.

## 7. A note on syncing two databases

You may end up with two databases: a **local** one (`supabase start`) and the **cloud** one. Migrations are how you keep them identical — apply the same migration files to both. The data, however, does not auto-sync; local and cloud hold separate rows. If you populated local with test rows, the cloud starts empty until you add rows there too.

---

**Next:** [[07-getting-data-in-and-out|Getting data in & out — the SQL editor, the table editor, the ingest script, and reading from the app]]
