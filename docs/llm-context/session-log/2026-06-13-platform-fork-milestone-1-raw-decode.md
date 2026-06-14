# Session: Platform fork called (web) + Milestone 1 raw decode→display

**Date:** 2026-06-13
**Agent:** Grim
**Summary:** Resolved the ARCH §5 platform fork to pure web, then built Milestone 1 — a `/develop` page that decodes a raw file in-browser via LibRaw-WASM and paints it to a canvas with a metadata + decode-time readout. Builds clean; awaiting a live test with a real NEF.

## Changes Made

### Files Modified
- `docs/llm-context/ARCHITECTURE.md` — §5 produce-half marked **DECIDED: pure web** (LibRaw-WASM + WebGPU); Tauri recorded as the perf-triggered fallback. §N non-goal softened to "no `src-tauri/`/Rust *unless* the §5 fallback is triggered."
- `docs/llm-context/AGENT-CONTEXT.md` — status, pending, roadmap, seams, contracts updated for the web decision + Milestone 1.
- `vite.config.js` — added `optimizeDeps.exclude: ['libraw-wasm']` so esbuild dep pre-bundling doesn't mangle the worker's `new URL(import.meta.url)` resolution.
- `package.json` — added `libraw-wasm ^1.3.0`.
- `src/App.jsx` — added `/develop` route.
- `src/sidebars.config.js` — added Develop nav entry (`image` icon).

### Files Added
- `src/pages/Develop.jsx` — drag-drop + file-picker → `libraw-wasm` decode in a Web Worker (`useCameraWb`, 8-bit) → RGB→RGBA → full-res canvas; metadata panel (camera, exposure, ISO, focal length, timestamp, pixel dims) + decode time in ms.

## Current State

### Working
- `pnpm build` passes — **2295 modules**, and crucially Vite emits the decode worker (`worker-*.js`) and the wasm (`libraw-*.wasm`, 1.37 MB) as real assets. The `new Worker(new URL(...))` + `new URL('libraw.wasm', import.meta.url)` chain bundles correctly.
- Decision recorded end-to-end across ARCHITECTURE / AGENT-CONTEXT / history / plan.
- Publish lane (kolkrabbi B2 via `bucket` CLI) still live; `hls-library/` empty.

### Known Issues
- **Decode not yet exercised live.** Build validates bundling, not an actual decode — needs a real NEF in a browser. That run also yields the **40MP+ decode latency** that gates the §5 Tauri fallback.
- Render still never visually eyeballed in this copy (carried over from scaffold).
- API verified against `libraw-wasm@1.3.0` d.ts: `imageData()` → `{width,height,colors,bits,dataSize,data}`, interleaved RGB. If a future bump changes the shape, `paint()` in `Develop.jsx` is the touch point.
- Latent inherited cascade note: `kol-theme.css` imports `kol-components-*` unlayered.

## Next Steps
1. **Live test** — `pnpm dev`, drag a real NEF into `/develop`, eyeball the canvas, read the decode-ms (the §5 fallback gate). Under ~2s → web vindicated.
2. **Adjustment pipeline** — first WebGPU op(s) over the decoded buffer (exposure/WB/contrast) as the start of the parametric op stack.
3. Editor UI build-out (histogram, sliders, curves, masks); then the CDN export step.
