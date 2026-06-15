---
_template:
  version: 1
  path: docs/llm-context/ARCHITECTURE.md
  sync: skip
---

# kol-lightroom — Architecture

Load-bearing decisions and constraints. Anything in this document is "we chose this deliberately and it has downstream consequences." Do not revisit without explicit reason. For decision history (alternatives considered, rejections, and evolution), see `../history.md`.

> **2026-06-13 — scaffolded.** This repo was created by copying the `_kol-labs-single-init-state` template and renaming `kol-labs` → `kol-lightroom` (the `/init-scaffold` pipeline was broken, so it was done by hand). §1–§4 below are **inherited verbatim** from that template and govern the design-system substrate. §5 is the kol-lightroom-specific domain and is where the still-open platform decision lives.

---

## §1 — Single self-contained Vite app; the design system is inlined source

There is one app at the repo root. The KOL design-system snapshot is plain source under `src/`, not packages: `src/components/{atoms,molecules,organisms,primitives,graphics,hooks,loaders,framework}` + `src/styles/` (all `kol-*.css`). No `pnpm-workspace.yaml`, no `packages/`, no `workspace:*`, no `@kol/*` package names.

Still fully self-contained: zero dependency on kol-monorepo (zip it and it works anywhere).

**Consequence:** Pulling newer DS code from upstream means inlining files into `src/` and rewriting their `@kol/*` imports to relative form (§2) — import surgery is accepted in this variant. All external deps are declared in the one root `package.json`.

**Do not revisit** — do not reintroduce workspace scaffolding, package boundaries, or path aliases that fake `@kol/*` specifiers.

---

## §2 — Structure and import convention mirror `kol-client-kolkrabbi`

`/Users/biskup/dev/projects/kol-client/kol-client-kolkrabbi` remains the canonical structural reference: components filed atomically under `src/components/`, theme CSS under `src/styles/`, and **direct relative file imports** (`import Button from '../atoms/Button.jsx'`, `import Icon from '../loaders/Icon.jsx'`) — no barrel hops between sibling components, no aliases.

**Consequence:** `src/components/index.js` and `src/components/framework/index.js` survive as convenience barrels for app-level consumption, but component-internal cross-references go file-to-file.

**Do not revisit** without also changing the reference — kol-lightroom follows it, not the other way around.

---

## §3 — CSS cascade order is load-bearing

`src/index.css` loads, in order: `tailwindcss` → `./styles/kol-theme.css` (the theme barrel) → `./styles/kol-brand-color.css` → `./styles/kol-framework.css`. Framework chrome rules read `--brand-*`/`--kol-*` custom properties defined upstream of them; reordering breaks theming.

**Consequence:** New global CSS slots into this chain deliberately, not appended at random. The latent issue that `kol-theme.css` imports `kol-components-*` unlayered (component classes outrank Tailwind utilities) carries over unchanged — see AGENT-CONTEXT.

---

## §4 — One app, one build

Features live inside this single app (routes/pages) or in entirely separate repos — there is no app-of-apps topology. How heavy-runtime work (the raw pipeline, GPU canvases) fits this shape is settled by §5, not by pre-built infrastructure.

---

## §5 — Domain: raw-image editing + CDN delivery (the platform fork is OPEN)

kol-lightroom is two halves of one pipeline, decided separately:

```
RAW (.NEF/.CR2/.DNG/.TIFF)  →  [editor: produce]  →  web derivatives  →  [CDN: publish]  →  viewers
```

**Publish half — DECIDED.** Delivery rides the existing **kolkrabbi Backblaze B2** bucket (rclone remote `kolkrabbi:`, public lane `website/`, CDN base `https://f005.backblazeb2.com/file/kolkrabbi/website/`). Stills land as derivatives in the bucket; video targets the existing-but-empty `hls-library/` lane (HLS output). Managed transcode (e.g. Bunny Stream) over self-rolled ffmpeg ladders is the leaning, not yet committed. Access via the `bucket` CLI wrapper (`~/.local/bin/bucket`).

**Produce half — DECIDED 2026-06-13: pure web (WASM + WebGPU).**

- **Chosen — Option A: pure web.** LibRaw-WASM (`libraw-wasm`, decode in a Web Worker) + a WebGPU adjustment pipeline, entirely in-browser. Stays a plain Vite static site, deployable straight to the CDN. Decided because it matches the existing web/React/Tailwind stack + CDN, avoids stacking a Rust/Tauri learning curve on top of the raw-pipeline work, and — decisively — is **reversible**: this exact Vite UI is also a Tauri frontend, so wrapping it natively later is cheap if a real perf wall appears.
- **Fallback — Option B: Tauri (Rust core + this Vite UI).** Native `rawler`/`libraw-rs` + `wgpu` + lcms2/OCIO, shipped as a desktop installer. Reach for this **only** if WASM decode latency on 40MP+ raws proves unacceptable in practice. The UI carries over unchanged, so it stays a wrap, not a rewrite.

The trigger to revisit is the decode→display milestone's measured latency on a large NEF (see AGENT-CONTEXT roadmap). Until that trigger fires, the substrate stays web-only — no `src-tauri/`, no Rust toolchain.

### §5a — Tauri native target ADDED 2026-06-15 (user-authorised)

Both targets now ship from one codebase. The trigger wasn't decode latency — it was **local batch raw work + the filesystem**: a browser's "local" (IndexedDB) is sandboxed, quota-evictable, and can't open/batch a folder of raws. Real desktop photo work needs native.

- **Web target (unchanged):** the cloud/publish/delivery product — deployed to Vercel/`lr.kolkrabbi.io`, Supabase catalog, zero-install, shareable. WASM decode + IndexedDB "local" (a lightweight convenience, not a real library).
- **Tauri target (new, `src-tauri/`):** the desktop product — native filesystem (open/batch any folder of raws), eventually native decode (rawler/libraw-rs, far faster than WASM), no storage quota, project files on disk. **The Vite UI carries over unchanged** (this was §5's whole reversibility bet): GPU pipeline, op-stack, panels, filmstrip all reused; only the decode + storage layers swap to native.
- **Not Photoshop.** Parametric op-stacks only (§5), not pixel-layer compositing — that's a different paradigm and a different app. Don't fuse them.

Build order: wrap (web app in a native window) → native file open → native decode → folder batch → project files.

**Edits are parametric, not pixel layers.** When the editor is built, non-destructive adjustments are stored as a serializable op stack (exposure, WB, curves, masks as data), Lightroom-style — not stacked pixel buffers. This is a deliberate design constraint, recorded now so it isn't re-litigated later.

---

## §6 — Image catalog: Supabase (Postgres) alongside B2 — DECIDED 2026-06-14

The publish lane now has two halves. **Bytes → Backblaze B2** (§5, unchanged). **Catalog → Supabase Postgres**: one row per image (`images` table) holding the B2 object key + CDN URL, capture metadata, the editor's parametric op-stack (`edit` JSONB), and tags. This is what turns the bucket into a browsable, filterable library (the `/library` route) and what makes edits non-destructive + re-openable.

- **Chosen — managed Supabase.** Postgres for the catalog (SQL filtering, JSONB, GIN-indexed tags, full-text); the Vite app talks to it directly via `@supabase/supabase-js` + the anon key (RLS: public read, authenticated write). The local ingest script (`scripts/ingest.mjs`) uses the service-role key and the `bucket` CLI for the B2 push. No server for us to run — Supabase is external managed infra, exactly like B2 already is, so this stays consistent with §4 (no app-of-apps; the Library is a route in *this* app).
- **Consequence — first external backend dependency.** This weakens the §1 "zip it and it runs anywhere" property *for the Library feature*: it needs `VITE_SUPABASE_URL`/`ANON_KEY` (and the service key for ingest). The editor and the rest of the app still run fully self-contained without it (the client is null when unconfigured → Library shows an empty state, build/run unaffected). Accepted deliberately.
- **Prod note:** cross-origin isolation (the COOP/COEP headers that enable the editor's WASM threads) defaults cross-origin subresources to blocked — CDN `<img>` must be `crossOrigin="anonymous"` and the host must send COOP/COEP. COEP is `credentialless`.
- **Fallback (recorded, not chosen):** self-hosted PocketBase if owning the data on our own host ever outweighs the ops savings. The schema + ingest contract port directly.

**Do not revisit** the managed-vs-self-hosted call without an explicit ask; the row schema (`images`) and the bytes-in-B2 / rows-in-DB split are the load-bearing parts and are backend-agnostic.

## §N — Non-goals (do not reopen)

Opening discussion on any of these requires an explicit user ask:

- **No link/symlink dependency on kol-monorepo.** Self-contained snapshot only (§1).
- **No workspace resurrection** — no `pnpm-workspace.yaml`, `packages/`, or `@kol/*` package identities (§1).
- **No import aliases** standing in for the old `@kol/*` specifiers; relative imports per the reference (§2).
- ~~**No native/Tauri layer**~~ — **LIFTED 2026-06-15** (§5a). The user authorised a Tauri build; `src-tauri/` now exists. Web stays the cloud/publish product; Tauri is the local/batch desktop product — one codebase, two targets.
