# Session: Scaffold kol-lightroom from init-state template

**Date:** 2026-06-13
**Agent:** Grim
**Summary:** Hand-scaffolded kol-lightroom from `_kol-labs-single-init-state` (the `/init-scaffold` pipeline was broken), renamed `kol-labs` → `kol-lightroom` throughout, and reset the project-state docs to a fresh raw-editor + CDN-delivery starting point.

## Changes Made

### Files Modified
- `package.json` — `name` + `description` → kol-lightroom.
- `index.html` — `<title>` → kol-lightroom.
- `src/app.config.js` — `APP.name` / `APP.nameSlug` → kol-lightroom.
- `src/pages/Home.jsx` — eyebrow label → kol-lightroom.
- `.claude/skills/init-agent/SKILL.md` — 4 hardcoded `/kol-apparat/kol-labs/` paths → `/kol-apparat/kol-lightroom/`.
- `LLM_RULES.md` — title, overview, project-overview paragraph, dir-tree label.
- `docs/llm-context/README.md` — project name.
- `docs/llm-context/ARCHITECTURE.md` — retitled; reframed flatten note as a scaffold-provenance note; kept inherited DS rules as §1–§4; **added §5** (domain: raw-edit + CDN; produce-half platform fork left explicitly OPEN; parametric op-stack constraint); added §N non-goal "no premature platform commitment."
- `docs/llm-context/AGENT-CONTEXT.md` — reset to fresh-scaffold state; bucket/CDN facts; roadmap gated on the platform fork.
- `docs/history.md` — origin rewritten from the raw-formats + CDN conversation; alternatives, principles, decisions.
- `docs/plan.md` — speculative: the platform fork + CDN delivery shape.

### Files Removed
- 3 stale `kol-labs` session logs (`2026-06-10-bootstrap…`, `2026-06-10-ds-reunification…`, `2026-06-12-flatten…`) — template provenance, not this project's history.

### Not touched
- `src/components/**`, `src/styles/**`, `public/fonts/**` — the inlined KOL design-system snapshot, carried verbatim (incl. `@kol` provenance comments).

## Current State

### Working
- Full KOL DS shell inherited intact; identity renamed cleanly (zero `kol-labs` strings left outside the untouched DS `@kol` provenance comments).
- Publish lane live: kolkrabbi B2 reachable via `bucket` CLI; `website/` has art-prints/asset-library/data-library/hls-library (hls-library empty).

### Known Issues
- Not yet `pnpm install`-ed or visually rendered in this copy (the template itself was never eyeballed since its flatten).
- Latent inherited cascade note: `kol-theme.css` imports `kol-components-*` unlayered.

## Next Steps
1. `pnpm install` → `pnpm dev`, eyeball the render (first visual check in this copy).
2. **Call the platform fork (ARCH §5):** web/WASM+WebGPU vs Tauri/Rust. Gates everything raw-pipeline.
3. Decode→display spike (rawpy or LibRaw-WASM on one NEF) to validate the pipeline cheaply before committing.
4. Editor UI in `src/pages/`; then the CDN export step (`bucket up` of web masters).
