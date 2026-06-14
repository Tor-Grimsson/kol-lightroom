---
title: Supabase, from zero — a beginner's guide
type: index
status: active
updated: 2026-06-14
description: A no-prior-knowledge walkthrough of Supabase, Postgres, API keys, migrations, git/GitHub syncing, and how it all wires into a Vite + Backblaze stack.
aliases:
  - supabase-guide
tags:
  - provider/supabase
  - domain/database
related:
  - "[[01-what-is-a-database-and-supabase|what a database is]]"
  - "[[03-setup-walkthrough|setup walkthrough]]"
  - "[[08-pitfalls-and-troubleshooting|pitfalls]]"
---

# Supabase, from zero

This guide assumes **no prior knowledge**. You've never used Supabase, you're fuzzy on what a database even is, and you just want to understand the thing you're now using — slowly, in plain language, with real examples from this project (`kol-lightroom`).

It's deliberately long. Read it in order the first time; after that, jump to the chapter you need.

## What this covers

| # | Chapter | Read it when |
|---|---|---|
| 01 | [[01-what-is-a-database-and-supabase\|What a database is, and what Supabase is]] | You want the ground-floor concepts. |
| 02 | [[02-this-stack\|This stack — how the pieces fit]] | You want the map: app ↔ Supabase ↔ Backblaze ↔ git. |
| 03 | [[03-setup-walkthrough\|Setup walkthrough]] | You're setting it up from scratch. Copy-paste steps. |
| 04 | [[04-api-keys-and-environment\|API keys & environment variables]] | You're confused about publishable vs secret vs anon keys (everyone is). |
| 05 | [[05-schema-tables-and-migrations\|Schema, tables & migrations]] | You want to change the database safely. |
| 06 | [[06-git-github-and-syncing\|Git, GitHub & syncing]] | You want version control + how Supabase ties into it. |
| 07 | [[07-getting-data-in-and-out\|Getting data in & out]] | You want to add rows and read them from the app. |
| 08 | [[08-pitfalls-and-troubleshooting\|Pitfalls & troubleshooting]] | Something broke. Start here. |
| 09 | [[09-possibilities-and-next-steps\|Possibilities & next steps]] | You want to know what else Supabase can do. |

## The one-paragraph version

**Supabase is a hosted database (plus extras) you talk to over the internet.** Your app keeps a small text file of connection settings (`.env.local`), uses a public "publishable" key to *read* data in the browser, and a secret key (kept off the browser) to *write* data from scripts. The shape of your database (its tables) is described by **migration files** that live in your code repo and get **pushed** to the cloud. Big files (images, video) do *not* go in the database — they go in object storage (Backblaze B2 here); the database only stores a *link* to them plus searchable metadata.

If that paragraph is mostly opaque, that's fine — chapter 01 starts from "what is a database."

> **Heads-up on terminology:** Supabase renamed its API keys. The thing older tutorials (and this project's original variable name) call the **anon key** is now labelled **Publishable key** in the dashboard. See [[04-api-keys-and-environment|chapter 04]]. This single rename causes more beginner confusion than anything else.
