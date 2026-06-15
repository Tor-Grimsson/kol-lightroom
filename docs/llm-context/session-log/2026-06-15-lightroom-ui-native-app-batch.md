# Session: Vercel deploy · in-app publish · Lightroom UI · local storage · Tauri native app · batch engine

**Date:** 2026-06-15
**Agent:** Grim
**Summary:** The big build-out. Deployed to Vercel (`lr.kolkrabbi.io`); added in-app publish via a Supabase Edge Function; rebuilt the whole UI into a Lightroom-style module app (shell + filmstrip + loupe + LR develop layout + profiles/presets + polish); added the editor↔catalog round-trip; fixed a GPU-lifecycle bug; added a local (IndexedDB) storage option; **wrapped the app as a native macOS Tauri app** (built `.app`/`.dmg`); and built a **batch engine** (CPU then GPU spatial ops). Every web-side piece verified live via Playwright.

## Changes Made

### Deploy + in-app publish
- `vercel.json` — SPA rewrite (all routes → `/index.html`) so `/develop` and `/library` don't 404 on Vercel. App is live at `lr.kolkrabbi.io` (user-managed Vercel + custom CNAME).
- `supabase/functions/publish/index.ts` — Edge Function: receives base64 JPEG + meta + edit, uploads to **Supabase Storage** (`published` bucket), writes the `images` row with the service-role key. Deployed `--no-verify-jwt`. **MVP storage = Supabase Storage, not B2** (avoids a B2-keys hunt; B2 presigned upload is the documented follow-up).
- `supabase/migrations/…_published_bucket.sql` — public `published` Storage bucket.
- `src/lib/supabase.js` — `publishImage()` (calls the function) + `blobToBase64`.
- `src/pages/Develop.jsx` — "Publish" button (verified: real photo published → appears in `/library`).

### Lightroom UI (replaced AppShell/SideNav for the app routes)
- `src/app/CatalogContext.jsx` — single catalog source (Supabase **or** local), `selectedId`, `editTarget`, `source` (cloud/local), `reload`. Centralizes the `cdn_url` whitespace guard.
- `src/app/LightroomShell.jsx` — dark module chrome: top `Library|Develop` switcher + theme toggle, content, bottom **Filmstrip**. **Both modules stay mounted** (toggle visibility) so the WebGPU device + decoded photo survive module switches.
- `src/app/Filmstrip.jsx` — persistent catalog strip (select / double-click → develop).
- `src/pages/Library.jsx` — grid **+ Loupe** image viewer, keyboard (`G/E/←→/D`), thumbnail-size slider, Cloud/Local toggle, accepts `blob:` URLs.
- `src/pages/Develop.jsx` — 3-panel LR layout (History/Info left · image stage · histogram + collapsible Tone/Color/Detail right), **Profile** dropdown, **Presets** (save/apply/hover-preview), before/after (`\`/`Y`), zoom fit↔1:1.
- `src/app/presets.js` — built-in PROFILES + localStorage presets.
- `src/App.jsx` — one catch-all route → `CatalogProvider` + `LightroomShell` (AppShell/SideNav no longer used here).

### Round-trip + storage
- Round-trip: a Library card / loupe "Open in Develop" / filmstrip dbl-click loads the catalog JPEG into Develop with its stored `edit` restored (verified: exposure 0.8 came back). Edits the *derivative* (not the raw).
- `src/app/localStore.js` — IndexedDB image store; Develop "Save local"; Library "LOCAL" source shows them (blob URLs). Verified end-to-end.

### Tauri native app (ARCH §5a — non-goal lifted, user-authorised)
- `src-tauri/` — scaffolded Tauri 2.11, wired to the Vite app. `src/lib.rs` commands: `read_file_bytes`, `list_raws`, `write_file_bytes`; dialog plugin. `tauri.conf.json` (id `io.kolkrabbi.lightroom`, 1400×900).
- `src/app/native.js` — `IS_TAURI`, `openRawNative`, `pickRawFolder`, `readRawPath`, `writeFileNative`. Develop's "Choose file" uses the native dialog when in Tauri.
- **Built `kol-lightroom.app` (21 MB) + `kol-lightroom_0.1.0_x64.dmg`** (x64 — this Mac is Intel). `docs/llm-context/ARCHITECTURE.md` §5a records the decision.

### Batch engine
- `src/app/pipeline.js` — the CPU tone/color op-stack **extracted** from Develop (shared by editor + batch, no third copy).
- `src/app/batch.js` — `runBatch(files, adj)`: decode → render → JPEG. **Prefers GPU** (full ops incl. spatial, via `OffscreenCanvas` + `gpuRenderer.exportBlob`), CPU fallback (tone/color).
- `src/app/BatchButton.jsx` — web: multi-file → one zip; desktop: native folder → `<folder>/export/`. `gpuRenderer.js` gained `exportBlob(adj)`.

## Current State

### Working (verified live, Playwright unless noted)
- **Deployed** at `lr.kolkrabbi.io` (after the `vercel.json` push).
- **Lightroom UI** — all 5 phases (shell, loupe, LR develop, profiles+presets, polish).
- **In-app publish** → Supabase Storage + catalog row → shows in Library.
- **Round-trip** — edit restored on re-open.
- **GPU survives module switches** (the lifecycle fix).
- **Local storage** — Save local → IndexedDB → LOCAL library.
- **Native app builds** (`.app`/`.dmg`) — wrap compiles + bundles; native file commands compiled in.
- **Batch** — 2 raws → zip of JPEGs; GPU path with Clarity +80 verified (413/556 KB, real not black).

### Known Issues
- **Native runtime is unverified headlessly** — Playwright can't drive the Tauri WKWebView; the native file-open/batch need the user to run the `.app`.
- **Batch spatial ops need WebGPU** (offscreen); CPU fallback is tone/color only.
- **Op math now lives in 3 places** — `gpuRenderer.js` WGSL, `pipeline.js` (CPU, shared by editor+batch), keep in sync.
- **Published bytes go to Supabase Storage, not B2** (MVP); B2 presigned is the follow-up (needs B2 S3 keys).
- **`.app`/`.dmg` predate batch + local-storage + GPU-batch** — rebuild (`pnpm tauri build`) to bake them in.
- Carried: 3 dirty cloud `cdn_url`s (app strips whitespace), `kol-theme.css` unlayered-components cascade note.

## Next Steps
1. **Masking + spot/heal retouching** — the Photoshop-adjacent features that actually fit a raw editor (local adjustments driving the op-stack). NOT layers/channels (that's a separate app).
2. **B2 byte-path** for publish (presigned upload via the Edge Function) — needs the user's B2 S3 keys as function secrets.
3. **Rebuild the native app** to include batch/local/GPU-batch; **native decode** in Rust (rawler/libraw-rs) for the real desktop perf win.
4. **Full-res export**, **auth**, **tone curve + HSL**.
