---
_template:
  version: 1
  path: docs/history.md
  sync: skip
---

# kol-lightroom — history & decisions

Knowledge base tracking the conversation that produced this project, the alternatives considered, and the reasoning behind core decisions. Reference for humans or future AI sessions that need the *why* rather than the *what*.

For decisions as enforced rules, see `llm-context/ARCHITECTURE.md`. For current operational state, see `llm-context/AGENT-CONTEXT.md`.

---

## origin

kol-lightroom began as a question (2026-06-13): what are the options for working with raw image formats (NEF, DNG, CR2, TIFF) and applying non-destructive color-correction layers, and what open-source projects exist to build on? The survey landed on a layered reality — **LibRaw** for decode, a **GPU pipeline** for adjustments, **lcms2/OCIO** for color, and **parametric op stacks** (not pixel layers) for non-destructive edits — with darktable / RawTherapee / PhotoFlow as architectures to study. A second thread joined it: hosting high-quality images and video on the web via a CDN. The realization that the editor (*produce*) and the CDN (*publish*) are two ends of **one pipeline**, not competing choices, defined the project's shape. The repo was scaffolded from the `_kol-labs-single-init-state` template because the `/init-scaffold` pipeline was broken at the time.

---

## alternatives surveyed and rejected

### Build raw decoding from scratch
- Considered only to be dismissed — raw decoding (per-sensor demosaic, color matrices, lens corrections) is a decade of edge cases.
- **Rejected:** everyone stands on **LibRaw** (descended from dcraw). It's the foundation under darktable, RawTherapee, rawpy, and the rest.

### GPL app code (darktable / RawTherapee) as a code base
- Best-in-class pipelines and demosaic algorithms, fully open.
- **Rejected as a code source** (kept as an architecture *reference*): lifting GPL code forces the repo to GPL. Study the pixelpipe and scene-referred design; don't paste.

### Pixel-layer editing model (Photoshop-style)
- Familiar "stack of layers" mental model.
- **Rejected:** Lightroom-style non-destructive editing is a **parametric op stack** (params replayed over the decoded image), which is serializable, diffable, and resolution-independent. Pixel layers are only needed for compositing, which is out of scope.

### Self-hosted video (ffmpeg HLS ladder + player)
- Maximum control, no third party.
- **Rejected (leaning):** "high-quality web video" means an adaptive-bitrate ladder + a real player + edge delivery — a genuine maintenance sink. Managed transcode (**Bunny Stream**, or Mux) earns its keep. Not yet committed; the `hls-library/` lane exists for whichever wins.

---

## core principles

- **Stand on LibRaw; never reimplement decode.**
- **Edits are data, not pixels** — a parametric op stack, replayed non-destructively.
- **Produce and publish are one pipeline** — the editor exports web masters; the CDN delivers them. One export step bridges them.
- **The UI is platform-neutral** — the Vite/React/Tailwind KOL shell is the frontend whether the core ends up web (WASM) or native (Tauri), so it can be built before the fork is called.
- **Reuse the existing CDN** — kolkrabbi B2 is already wired; delivery is a solved substrate, not a new build.

---

## architectural decisions

### Why scaffold from `_kol-labs-single-init-state` (2026-06-13)

The `/init-scaffold` pipeline was broken, so the template was copied by hand and `kol-labs` renamed to `kol-lightroom` across identity files (`package.json`, `app.config.js`, `index.html`), the `init-agent` skill's hardcoded paths, and the docs. The template's inherited design-system rules (single self-contained Vite app, DS as inlined source mirroring `kol-client-kolkrabbi`, load-bearing CSS cascade order) carry forward verbatim as ARCH §1–§4. Stale `kol-labs` session logs were dropped — they were the template's provenance, not this project's history.

### Why the produce-half platform was left UNDECIDED (ARCH §5)

Two viable shapes: pure web (LibRaw-WASM + WebGPU, deployable straight to the CDN, perf-capped on huge raws) versus Tauri (Rust core with `rawler`/`wgpu` + lcms2/OCIO, native installer, best performance). Because **both reuse this exact Vite UI as their frontend**, scaffolding the shell commits to neither. The fork was deliberately deferred rather than guessed, and the repo is kept web-only (no `src-tauri/`, no Rust toolchain, no WASM deps) until it's called. The user expressed interest in Tauri specifically (had tried one Tauri app before, never finalized), which tilts but does not settle the decision.

---

## API / interface evolution

Nothing built yet beyond the inherited template shell. The first interface surface will be the editor's develop panel in `src/pages/`, designed against the parametric op-stack model.

---

## discussion outside the build

- **Tauri output is a desktop installer, not a Docker image.** Clarified early: a photo editor is a GUI app needing the user's GPU and filesystem; containers fit headless/server workloads. Docker only re-enters if a batch-export *backend* is later split out.
- **Image vs video delivery are different problems.** Stills: B2 + Cloudflare + on-the-fly transforms (imgproxy / Cloudflare Images), AVIF with fallback. Video: managed adaptive streaming, not a hand-rolled `<video src>`.

---

## references

- **LibRaw** — raw decode standard. **darktable / RawTherapee / PhotoFlow** — OSS pipeline/architecture references (PhotoFlow notably does adjustment *layers*).
- **lcms2** (ICC) / **OpenColorIO** (ACES/scene-referred) — color management.
- **rawler / libraw-rs** (Rust), **rawpy** (Python), **LibRaw-WASM** — decode bindings per platform.
- **wgpu / WebGPU**, **Halide** — GPU pipeline.
- **Backblaze B2 + Cloudflare**, **Bunny Stream**, **Mux** — delivery.
- kolkrabbi bucket wiring: `kol-bucket` skill; rclone remote `kolkrabbi:` in `~/.config/rclone/rclone.conf`.

---

## what's *not* in this document

- Installation instructions → `../README.md`
- Load-bearing decisions stated as rules → `llm-context/ARCHITECTURE.md`
- Current state, roadmap, gotchas, contracts → `llm-context/AGENT-CONTEXT.md`
- Session-by-session dev log → `llm-context/session-log/`
- Speculative future work → `plan.md`

This file is purely the decision history. Update it when a core decision is revisited or reversed, not for routine changes.
