---
_template:
  version: 1
  path: docs/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-lightroom — Agent Context

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `../history.md`. For speculative future work see `../plan.md`.

**Last updated:** 2026-06-15

---

## Status at a glance

- **Freshly scaffolded** (2026-06-13) by hand-copying the `_kol-labs-single-init-state` template (the `/init-scaffold` pipeline was broken). Renamed `kol-labs` → `kol-lightroom` across identity files + docs; stale template session logs dropped.
- **Single self-contained Vite app.** One `package.json`, one build, repo root = the app. DS inlined as source under `src/components/` + `src/styles/` (the `kol-*.css` set). Imports are direct relative file paths (reference style).
- **Domain:** raw-image editing (NEF/DNG/CR2/TIFF + parametric color-correction layers) on the produce side; high-quality image/video delivery via the kolkrabbi B2 CDN on the publish side.
- **Platform: web + native, one codebase (ARCH §5 + §5a).** Web is the cloud/publish product (deployed to **Vercel → `lr.kolkrabbi.io`**). As of **2026-06-15** there is also a **Tauri native macOS app** (`src-tauri/`, builds `.app`/`.dmg`) — user-authorised; the "no Tauri" non-goal is LIFTED. Same Vite UI, native filesystem.
- **The UI is now a Lightroom-style module app (2026-06-15).** `LightroomShell` (top `Library|Develop` switcher + persistent **Filmstrip**) replaced the KOL AppShell/SideNav for the app routes. Both modules stay mounted (visibility toggle) so WebGPU + the decoded photo survive switches. Loupe image viewer, LR 3-panel Develop, Profiles + Presets, before/after, zoom, thumb-size, **round-trip** (open catalog image with its edit), **batch** engine, and a **local (IndexedDB) storage** option alongside cloud.
- **`/develop` is a working editor (2026-06-14).** Two-tier decode (fast preview + full master), a 15-slider parametric panel (Tone/Color/Detail), a **multi-pass WebGPU pipeline** (tone/color + spatial ops + histogram compute), live histogram, and web-master JPEG export. Verified live on a 51MP DNG. **§5 gate measured:** full-res decode ~7.9s, preview ~2.6s — web NOT abandoned (interactive number is the preview; full-res is export-time). CPU fallback covers tone/color only.
- **`/library` is a working image catalog, LIVE on cloud Supabase (2026-06-14).** Second publish pipeline (ARCH §6): bytes in B2, one **Supabase Postgres** row per image (key + CDN URL, capture metadata, the editor's `edit` op-stack JSONB, tags). `scripts/ingest.mjs` ingests; `/library` is a filterable gallery reading the **cloud project** (`tvuyyybxvfkmgflxvhii`, North EU/Stockholm) via the publishable key. **First external backend dependency** — weakens §1 self-containment for this feature only (Library shows an empty state when unconfigured).

---

## What works

- The template substrate: KOL design-system shell (AppShell + SideNav + theme toggle), theme/brand/framework CSS cascade, fonts under `public/fonts/`. Inherited intact from the template's last verified state.
- `Home.jsx` landing + a 2-entry `NAV_TREE` (Home, Develop) in `src/sidebars.config.js`.
- **`pnpm install` + `pnpm build` pass.** Build emits the decode worker + `libraw.wasm` as assets — the `libraw-wasm` worker/wasm bundling is verified sound.
- **`/develop` editor — verified live (2026-06-14, real GPU browser):** drag/pick a raw → two-tier decode (preview ~2.6s, full master ~7.9s on a 51MP DNG) → WebGPU render. 15 sliders apply live (Tone/Color on either backend; Detail spatial ops GPU-only). Live RGB histogram (GPU compute + readback). Export web-master JPEG. `Engine: WebGPU | CPU` shown in the readout; CPU is the tone/color-only fallback.
- **Publish lane is live:** kolkrabbi B2 bucket reachable via the `bucket` CLI (`bucket ls/url/up`). `website/` lane has `art-prints/ asset-library/ data-library/ hls-library/`; `hls-library/` is empty (no video published yet).
- **Catalog pipeline — LIVE on cloud Supabase (2026-06-14):** `images` schema + RLS pushed to the cloud project (`tvuyyybxvfkmgflxvhii`); `/library` reads it via the publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`) and renders cataloged images with thumbnails + tag filter. `scripts/ingest.mjs` writes rows with the service-role key. **Caveat:** `supabase start` (local stack) exit-134s on this Docker (the `supabase/postgres` image; plain `postgres:16` is fine) — cloud is the path; the prior session's local stand-in is torn down.

## What's pending

- **Masking + spot/heal retouching** — the recommended next feature: local adjustments (radial/gradient/brush masks driving the op-stack) + spot removal/heal. The Photoshop-adjacent work that *fits* a raw editor. NOT layers/channels/bitmap compositing (separate app).
- **B2 byte-path for publish** — published bytes currently go to **Supabase Storage** (MVP); move to B2 presigned upload via the Edge Function. Needs the user's **B2 S3-compatible keys** as function secrets (`supabase secrets set`).
- **Rebuild the native app** — `.app`/`.dmg` predate batch + local-storage + GPU-batch; `pnpm tauri build` to bake them in. Then **native decode** in Rust (rawler/libraw-rs) for the real desktop perf/batch win.
- **Full-res export** — exports the ≤1600px working render; render the full master for a true full-size derivative.
- **Tone curve + HSL/per-channel** · **Auth** (gate writes) · **Video lane** (Bunny vs self-hosted HLS into `hls-library/`).
- **House the Supabase guide** — move `docs/supabase-guide/` → `~/.dotfiles/docs`.
- ~~In-app publish~~ ✓ · ~~round-trip~~ ✓ · ~~git/GitHub~~ ✓ (`Tor-Grimsson/kol-lightroom`).

## Active known issues

- **Decode ~7.9s full-res, single-threaded** on a 51MP DNG (preview ~2.6s). The COOP/COEP isolation headers (which enabled WASM threads, ~1s gain) were **removed** because they broke cross-origin CDN `<img>` loads across browsers — reliable images won the trade. An instant embedded-JPEG preview path was discussed, not built.
- **Op math in 3 synced places** — `gpuRenderer.js` WGSL (full ops) and `src/app/pipeline.js` (CPU tone/color, shared by the editor's CPU fallback **and** batch). Keep in sync.
- **CPU fallback / CPU batch are tone/color only** — Detail (spatial) ops are GPU-only. Batch prefers the GPU (OffscreenCanvas) for full ops; falls back to CPU tone/color.
- **Native runtime is unverified headlessly** — Playwright can't drive the Tauri WKWebView; native file-open + batch need the user to run the `.app`. The `.app`/`.dmg` also predate batch/local-storage/GPU-batch (rebuild with `pnpm tauri build`).
- **Published bytes are in Supabase Storage, not B2** (MVP) — B2 presigned upload is the documented follow-up.
- **No cross-origin isolation** — COOP/COEP headers were removed from `vite.config.js`; CDN `<img>` loads need no special handling. **Do not re-add isolation** without also solving cross-origin image loading (it re-breaks the Library thumbnails).
- **3 cloud `cdn_url`s are whitespace-dirty** — newlines baked in by the SQL Editor wrapping long lines. The Library strips whitespace from URLs so they render; clean the rows with an `update` when convenient.
- **Latent cascade note** (inherited): `kol-theme.css` imports `kol-components-*` *unlayered*, so component classes outrank Tailwind `utilities` — inline utility overrides of a component class won't win until a `layer(components)` pass.

---

## Key files and their roles

| file | role | hot edit points |
|---|---|---|
| `package.json` | the one manifest | all deps live here (incl. `@floating-ui/react`, `embla-carousel-react`) |
| `vite.config.js` | build config | react + svgr + tailwindcss plugins; `dedupe: ['react','react-dom']` |
| `src/index.css` | CSS entry — cascade order is load-bearing (ARCH §3) | tailwind → theme → brand color → framework |
| `src/styles/` | all DS CSS (theme barrel + brand color + framework chrome) | `kol-theme.css` imports the rest |
| `src/pages/Develop.jsx` | the editor: decode + op-stack state + panel UI + CPU fallback render | `ZERO_ADJ`/`TONE`/`COLOR`/`DETAIL` op config; `decode()`, `setSource()` |
| `src/pages/gpuRenderer.js` | WebGPU backend: multi-pass tone/color + blur + spatial + histogram compute | WGSL shaders; `setImage()`/`render()`/`exportBlob()`; op math mirrors `pipeline.js` |
| `src/app/LightroomShell.jsx` | app chrome — module switcher + filmstrip; both modules stay mounted | the shell, replaces AppShell/SideNav |
| `src/app/CatalogContext.jsx` | catalog state — cloud (Supabase) or local (IndexedDB), selection, `editTarget`, `source` | `reload()`; `cdn_url` whitespace guard centralized here |
| `src/app/Filmstrip.jsx` | persistent bottom catalog strip | select / dbl-click → develop |
| `src/app/pipeline.js` | shared CPU op-stack (tone/color) — editor fallback + batch | `buildWorking`/`render`; keep synced with WGSL |
| `src/app/batch.js` · `BatchButton.jsx` | batch engine (GPU preferred, CPU fallback) + UI | `runBatch(files, adj)`; web=zip, desktop=folder |
| `src/app/localStore.js` | local image store (IndexedDB) — the "local" storage option | `saveLocalImage`/`listLocalImages`; blob: URLs |
| `src/app/presets.js` | built-in PROFILES + localStorage presets | |
| `src/app/native.js` | Tauri bridge (open/folder/read/write); `IS_TAURI` | calls `src-tauri` commands |
| `src-tauri/` | Tauri 2 native app — `.app`/`.dmg`; commands `read_file_bytes`/`list_raws`/`write_file_bytes` | `src/lib.rs`, `tauri.conf.json`; `target/` git-ignored |
| `supabase/functions/publish/` | Edge Function — in-app publish (bytes→Storage, row→DB, service key) | deployed `--no-verify-jwt` |
| `src/pages/Library.jsx` | `/library` catalog gallery — queries Supabase, grid + tag/text filter | strips whitespace from `cdn_url` (paste-damage guard); plain CDN `<img>` |
| `src/lib/supabase.js` | browser Supabase client (publishable key); null when env unset | `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (old `_ANON_KEY` still works) |
| `scripts/ingest.mjs` | catalog ingest: `bucket up` → B2 + row upsert (service-role key) | reads `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (never `VITE_`) |
| `supabase/migrations/*` | the `images` schema + RLS + indexes | applied by `supabase start` / `supabase db reset` |
| `src/components/` | the inlined DS; atomic folders + `framework/` (shell) + `loaders/` (icons) | barrels: `index.js`, `framework/index.js` |
| `src/components/framework/AppShell.jsx` | app shell | takes `navTree` + `getActivePage` props |
| `src/App.jsx` | route table | `<AppShell navTree={…} getActivePage={…}>` |
| `src/sidebars.config.js` | nav tree | `NAV_TREE` + `getActivePage` |
| `src/app.config.js` | app identity | `APP = {name,nameSlug}` → `kol-lightroom` |
| `public/fonts/` | fonts (single copy) | strategy user-led |

**External, not in-repo:** the `bucket` CLI (`~/.local/bin/bucket`) wraps rclone remote `kolkrabbi:` → Backblaze B2. CDN base `https://f005.backblazeb2.com/file/kolkrabbi/website/`.

---

## Critical consistency seams

### App CSS import order
`src/index.css` must keep theme before brand color before framework css — framework chrome rules read `--brand-*`/`--kol-*` vars defined upstream of them (ARCH §3).

### SideNav ↔ nav config
`SideNav`/`AppShell` (in `src/components/framework/`) take nav **data** as props from `src/sidebars.config.js`. Never hard-wire the shell to the config file.

### Platform: web + native (ARCH §5 + §5a)
Decode runs client-side via `libraw-wasm`. **Both targets ship from one codebase:** the web build (Vercel) and the Tauri native app (`src-tauri/`). Native decode (rawler/libraw-rs) is not built yet — the native app currently reuses the WASM decode. Keep the UI framework-agnostic so both targets share it.

### Shell: LightroomShell (not AppShell)
The app routes (`/library`, `/develop`) render inside `src/app/LightroomShell.jsx` — both modules stay mounted, toggled by path. The KOL `AppShell`/`SideNav` are no longer used by the app (still in the repo). Catalog state lives in `src/app/CatalogContext.jsx`.

---

## Roadmap (prioritized)

1. ~~Decode/WebGPU/panel/histogram~~ ✓ · ~~cloud Supabase + catalog~~ ✓ · ~~in-app publish~~ ✓ · ~~Lightroom UI (shell/loupe/profiles/presets/polish)~~ ✓ · ~~round-trip~~ ✓ · ~~local storage~~ ✓ · ~~Tauri native app~~ ✓ · ~~batch (CPU+GPU)~~ ✓ (2026-06-14/15).
2. **Masking + spot/heal retouching** — local adjustments + heal; the next big editor feature (fits a raw editor; not layers/channels).
3. **B2 byte-path** for publish (presigned via Edge Function; needs B2 S3 keys) · **rebuild native app** + **native decode** (Rust).
4. **Tone curve + HSL/per-channel** · **full-res export** · **Auth** · **Video lane**.

---

## Contracts the next agent should not quietly break

- **Self-contained, always.** No link/symlink to kol-monorepo (ARCH §1).
- **No workspace resurrection** — single app, single build, no `@kol/*` package identities (ARCH §1, §4).
- **Relative imports per the reference**; no alias layer (ARCH §2).
- **CSS cascade order in `src/index.css`** stays theme → brand → framework (ARCH §3).
- **Edits are parametric op stacks**, not pixel layers (ARCH §5). No Photoshop-style layers/channels — that's a separate app; masking + spot/heal are the retouching that fits.
- **Op math lives in 3 synced places** — `gpuRenderer.js` WGSL (full ops), `src/app/pipeline.js` (CPU tone/color, shared by the editor's CPU fallback + batch). Change together or they drift.
- **Native target exists** (`src-tauri/`, ARCH §5a) — keep the UI usable in both web + Tauri.
- **Bytes in B2, rows in the DB** (ARCH §6) — the catalog stores B2 keys + metadata, never image bytes. Schema is backend-agnostic.
- **Service-role/secret key is Node-only** — never a `VITE_` var (those bundle into the browser). Browser uses the **publishable key** (`VITE_SUPABASE_PUBLISHABLE_KEY`, formerly "anon"); writes are gated by RLS.
- **No COOP/COEP cross-origin-isolation headers** — they break cross-origin CDN images. Don't re-add without solving image loading (ARCH §6 prod note / known issues).
- **`pnpm` is the package manager.**

---

## Open architecture explorations

See `../plan.md` — carries the raw-pipeline platform fork and the editor/delivery shape as speculative work until items graduate here.
