---
_template:
  version: 1
  path: docs/llm-context/AGENT-CONTEXT.md
  sync: skip
---

# kol-lightroom — Agent Context

Current project state + operational reference. Updated at the end of each significant session.

For chronological detail see `session-log/`. For load-bearing decisions see `ARCHITECTURE.md`. For decision history / alternatives considered see `../history.md`. For speculative future work see `../plan.md`.

**Last updated:** 2026-06-14

---

## Status at a glance

- **Freshly scaffolded** (2026-06-13) by hand-copying the `_kol-labs-single-init-state` template (the `/init-scaffold` pipeline was broken). Renamed `kol-labs` → `kol-lightroom` across identity files + docs; stale template session logs dropped.
- **Single self-contained Vite app.** One `package.json`, one build, repo root = the app. DS inlined as source under `src/components/` + `src/styles/` (the `kol-*.css` set). Imports are direct relative file paths (reference style).
- **Domain:** raw-image editing (NEF/DNG/CR2/TIFF + parametric color-correction layers) on the produce side; high-quality image/video delivery via the kolkrabbi B2 CDN on the publish side.
- **Platform DECIDED 2026-06-13: pure web** (LibRaw-WASM decode + WebGPU pipeline). Chosen for stack/CDN fit and reversibility — this Vite UI is also a Tauri frontend, so native is a cheap wrap later if WASM perf on big raws ever forces it (ARCH §5). Tauri is the recorded fallback, not the plan.
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

- **git init + first commit** — `.gitignore` is prepared (excludes `.env.local` + scratch); user runs it. Then optionally push to GitHub (enables the Supabase GitHub integration).
- **Cloud demo data** — re-ingest rows / clean the 3 paste-dirtied `cdn_url`s; needs the cloud **secret key** (`sb_secret_…`) in `SUPABASE_SERVICE_ROLE_KEY`.
- **House the Supabase guide** — move `docs/supabase-guide/` → `~/.dotfiles/docs`.
- **In-app publish (editor → catalog)** — a "Publish" button in `/develop` that exports the master, pushes to B2, and writes the row in-browser (via a Supabase Edge Function minting a B2 presigned URL — no B2 secret in the client). Replaces the local ingest script for the in-app flow.
- **Editor ↔ catalog round-trip** — "open in develop" from a Library card restores the stored `edit` op-stack (the JSONB column already carries it).
- **Tone curve + HSL/per-channel color** — next panel sections; the GPU backend carries them cheaply now.
- **Full-res export** — currently exports the ≤1600px working render (the web master); render the full master through the pipeline when a true full-size derivative is needed.
- **Masks / local adjustments** — not started.
- **Video delivery** — decide Bunny Stream vs self-hosted HLS into the `hls-library/` lane.

## Active known issues

- **Decode ~7.9s full-res, single-threaded** on a 51MP DNG (preview ~2.6s). The COOP/COEP isolation headers (which enabled WASM threads, ~1s gain) were **removed** because they broke cross-origin CDN `<img>` loads across browsers — reliable images won the trade. An instant embedded-JPEG preview path was discussed, not built.
- **GPU + CPU op math are duplicated** — `gpuRenderer.js` WGSL and `Develop.jsx` `render()` carry the same tone/color stack. Keep them in sync or they drift.
- **CPU fallback is tone/color only** — Detail (spatial) sliders + histogram are GPU-only (they ride the blur/compute passes) and are hidden when `Engine: CPU`.
- **No cross-origin isolation** — COOP/COEP headers were removed from `vite.config.js`; CDN `<img>` loads need no special handling. **Do not re-add isolation** without also solving cross-origin image loading (it re-breaks the Library thumbnails).
- **3 cloud `cdn_url`s are whitespace-dirty** — newlines baked in by the SQL Editor wrapping long lines. The Library strips whitespace from URLs so they render; clean the rows with an `update` when convenient.
- **git not initialized yet** — user-driven; `.gitignore` is ready.
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
| `src/pages/gpuRenderer.js` | WebGPU backend: multi-pass tone/color + blur + spatial + histogram compute | WGSL shaders; `setImage()`/`render()`; op math mirrors Develop's `render()` |
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

### Platform: web (ARCH §5)
Decode runs client-side via `libraw-wasm` (Web Worker + WASM). Keep the repo web-only: **no** `src-tauri/` or Rust toolchain unless the measured-perf fallback is triggered.

---

## Roadmap (prioritized)

1. ~~Milestone 1 live~~ ✓ · ~~WebGPU pipeline~~ ✓ · ~~develop panel + histogram~~ ✓ · ~~catalog pipeline (schema + ingest + /library)~~ ✓ (2026-06-14).
2. ~~Real Supabase project~~ ✓ — cloud live (`tvuyyybxvfkmgflxvhii`, North EU). **Next:** `git init` + first commit; re-ingest/clean cloud data; house the Supabase guide in `~/.dotfiles/docs`.
3. **In-app publish + editor↔catalog round-trip** — Publish button in /develop (Edge Function presigned B2 upload); "open in develop" restores the stored `edit` op-stack.
4. **Tone curve + HSL/per-channel + masks** — next editor panel sections on the GPU backend.
5. **Auth** — Supabase Auth gating writes.
6. **Video lane** — Bunny Stream vs self-hosted HLS into `hls-library/`.

---

## Contracts the next agent should not quietly break

- **Self-contained, always.** No link/symlink to kol-monorepo (ARCH §1).
- **No workspace resurrection** — single app, single build, no `@kol/*` package identities (ARCH §1, §4).
- **Relative imports per the reference**; no alias layer (ARCH §2).
- **CSS cascade order in `src/index.css`** stays theme → brand → framework (ARCH §3).
- **Web platform; no `src-tauri/`/Rust** unless the ARCH §5 perf fallback is triggered.
- **Edits are parametric op stacks**, not pixel layers (ARCH §5).
- **GPU and CPU render paths share op math** — `gpuRenderer.js` WGSL ↔ `Develop.jsx` `render()`. Change both together or they drift.
- **Bytes in B2, rows in the DB** (ARCH §6) — the catalog stores B2 keys + metadata, never image bytes. Schema is backend-agnostic.
- **Service-role/secret key is Node-only** — never a `VITE_` var (those bundle into the browser). Browser uses the **publishable key** (`VITE_SUPABASE_PUBLISHABLE_KEY`, formerly "anon"); writes are gated by RLS.
- **No COOP/COEP cross-origin-isolation headers** — they break cross-origin CDN images. Don't re-add without solving image loading (ARCH §6 prod note / known issues).
- **`pnpm` is the package manager.**

---

## Open architecture explorations

See `../plan.md` — carries the raw-pipeline platform fork and the editor/delivery shape as speculative work until items graduate here.
