---
title: Getting data in & out
type: guide
status: active
updated: 2026-06-14
description: The four ways to add rows (Table Editor, SQL Editor, ingest script, supabase-js), how to read them from the app, and worked examples.
audience: internal
aliases:
  - getting-data-in-and-out
tags:
  - provider/supabase
  - provider/backblaze
  - domain/database
related:
  - "[[02-this-stack|this stack]]"
  - "[[08-pitfalls-and-troubleshooting|pitfalls]]"
---

# Getting data in & out

You have a table. Now: how does data get *into* it, and how does the app *read* it back? Four ways in, one way out.

## 1. Way in — the Table Editor (clicking, no code)

Dashboard → **Table Editor** → `images` → **Insert** → **Insert row**. Fill the fields, **Save**. Good for adding one row by hand. Tedious for many, and easy to fumble the array/JSON fields.

- `tags` (a list) is entered as separate items.
- `edit` (JSON) is entered as `{"exposure": 0.3}`.
- `b2_key` must be unique — reusing one errors.

## 2. Way in — the SQL Editor (one query, many rows)

Dashboard → **SQL Editor** → paste an `insert` → **Run**. Fast for several rows at once:

```sql
insert into public.images (filename, b2_key, cdn_url, camera, iso, edit, tags)
values
('blokk-artwork.jpg','art/blokk.jpg','https://cdn…/blokk.jpg','Canon EOS 5DS',100,'{"clarity":40}','{art,print}');
```

Note the formats: JSON in single quotes (`'{"clarity":40}'`), a text list as `'{art,print}'`. A successful `insert` reports *"Success. No rows returned"* — that's normal (an insert returns nothing unless you ask it to).

> **Real pitfall we hit:** pasting an `insert` with very long URLs caused the editor to **wrap the lines and bake newlines into the middle of the URLs**, so the stored links were corrupt and thumbnails 404'd. If you paste SQL with long values, keep each value on one unbroken line, or use a script (way 3) instead. The app now strips stray whitespace from URLs to defend against exactly this.

## 3. Way in — the ingest script (the real pipeline)

For publishing actual photos, this project has `scripts/ingest.mjs`. It does the whole job: push the file to Backblaze, then write the database row. It uses the **secret key** (it's allowed to write) and runs in your terminal, never the browser.

```bash
SUPABASE_URL=https://yourref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=sb_secret_… \
  node scripts/ingest.mjs --file out/photo-web.jpg --meta out/photo.json --tags forest,portrait
```

- `--file` — the JPEG to upload.
- `--meta` — a small JSON file of metadata (camera, iso, the edit, …).
- `--tags` — comma-separated tags.
- `--no-upload` — skip the Backblaze push (insert the row only). Useful for testing without touching the CDN.
- `--cdn-url` / `--key` — catalog a file that's *already* in the bucket, without re-uploading.

This is the path you'll use in normal operation: edit a photo, export it, ingest it.

## 4. Way in — from code, with supabase-js (for completeness)

The app uses the official client library, `@supabase/supabase-js`. Inserting from code looks like:

```js
import { supabase } from './lib/supabase.js'
await supabase.from('images').insert({ filename: 'x.jpg', b2_key: 'x.jpg', camera: 'Nikon Z7' })
```

But note: in the **browser** this insert is blocked by Row Level Security (the publishable key can't write). Browser code mostly *reads*; writing happens server-side or via the secret-key script.

## 5. The one way out — reading in the app

The Library page reads with the same library:

```js
const { data, error } = await supabase
  .from('images')
  .select('*')                                   // all columns
  .order('created_at', { ascending: false })     // newest first
```

`data` is an array of row objects (`{ filename, camera, cdn_url, tags, … }`). The page maps over them into cards. Filtering by tag/text happens in the browser over that array. That's the entire "out" path — one `select`.

You can shape the query:

```js
.select('filename, camera, cdn_url')   // only some columns
.eq('camera', 'Nikon Z7')              // where camera = 'Nikon Z7'
.contains('tags', ['print'])           // rows whose tags include 'print'
.limit(20)                             // at most 20 rows
```

## 6. Seeing the data without code

Anytime, in the dashboard: **Table Editor** shows the rows; **SQL Editor** runs `select * from images;`. If the app shows nothing but the Table Editor shows rows, the problem is in the app's connection (URL/key), not the data — see [[08-pitfalls-and-troubleshooting|pitfalls]].

## 7. Which way should I use?

| Situation | Use |
|---|---|
| Add one quick row to look at | Table Editor |
| Add a handful of known rows | SQL Editor |
| Publish a real edited photo | the ingest script |
| Add rows from app logic | supabase-js (server-side for writes) |

---

**Next:** [[08-pitfalls-and-troubleshooting|Pitfalls & troubleshooting — everything that bit us, and the fix]]
