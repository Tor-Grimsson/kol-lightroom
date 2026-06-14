---
_template:
  version: 1
  path: docs/plan.md
  sync: skip
---

# kol-lightroom — future exploration

Ideas that aren't committed work. Move items out of here when they become real roadmap entries in `llm-context/AGENT-CONTEXT.md`.

---

## The produce-half platform fork (the gating decision)

Non-destructive raw editor over LibRaw decode + a GPU adjustment pipeline. The premise is settled; the *platform* is the open question (ARCH §5).

### shape
A develop panel in `src/pages/`: image canvas + histogram, exposure/WB/tone/color sliders, curve editor, masks. Edits stored as a serializable parametric op stack, replayed non-destructively.

### architecture
- **Decode:** LibRaw — `rawler`/`libraw-rs` (native) or LibRaw-WASM (web).
- **Pipeline:** WebGPU/`wgpu` compute or fragment shaders, one op per stage.
- **Color:** lcms2 (ICC) + OCIO (scene-referred) for a darktable-style scene-referred chain.

### the fork
- **Option A — pure web (WASM + WebGPU):** stays a plain Vite static site, deploys to the CDN, no install. Risk: perf ceiling on 40MP+ raws.
- **Option B — Tauri (Rust core + this Vite UI):** native decode/`wgpu`, ships as a desktop installer. Best performance; the KOL UI here becomes the Tauri webview unchanged. User leans this way (wants to finish a Tauri app).

### open questions
- Does in-browser WASM decode + WebGPU hold acceptable latency on a 45MP NEF? A decode→display spike answers this cheaply before committing.
- Is offline/desktop a requirement, or is a hosted web app the actual goal?

### kill criteria
- If the answer is "must run in a browser, zero install" → Option A, Tauri is dead.
- If WASM perf on real raws is unacceptable → Option B, web-only is dead.

---

## CDN delivery shape

The publish half. Substrate (kolkrabbi B2) already exists; this is about what flows into it.

### stills
B2 (have it) → Cloudflare → on-the-fly resize/format via imgproxy (self-host) or Cloudflare Images (managed). Serve AVIF with WebP/JPEG fallback via `<picture>`/`srcset`. Editor exports one high-quality master; derivatives are generated, never hand-cut.

### video
Don't hand-roll the HLS ladder. Lean **Bunny Stream** (cheap, good CDN, upload-a-master) over Mux (pricier, best DX). Output lands in the existing `hls-library/` lane.

### the bridge
One editor export step: "render web master → `bucket up` to the kolkrabbi `website/` lane." This is the seam that makes produce + publish one pipeline.

### open questions
- imgproxy (control, near-free) vs Cloudflare Images (managed) for stills transforms?
- Bunny vs Mux once there's actual video to publish?

---

Nothing here is committed. This doc is a thought exercise until items graduate to `llm-context/AGENT-CONTEXT.md`.
