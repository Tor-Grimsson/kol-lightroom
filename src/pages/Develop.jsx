import { useRef, useState, useCallback, useEffect } from 'react'
import LibRaw from 'libraw-wasm'
import Button from '../components/atoms/Button.jsx'
import Slider from '../components/atoms/Slider.jsx'
import Divider from '../components/atoms/Divider.jsx'
import LabeledControl from '../components/molecules/LabeledControl.jsx'
import { createGpuRenderer } from './gpuRenderer.js'
import { publishImage, supabaseConfigured } from '../lib/supabase.js'
import { useCatalog } from '../app/CatalogContext.jsx'
import { PROFILES, loadPresets, persistPresets, newId } from '../app/presets.js'
import { saveLocalImage } from '../app/localStore.js'

/* Develop — decode a raw in-browser via LibRaw-WASM, then edit it.
 *
 * Decode is two-tier (ARCH §5, web platform): a fast half-size / bilinear
 * PREVIEW paints almost immediately, then the full-res MASTER replaces it.
 * Both passes run in parallel in their own workers.
 *
 * Edits are a PARAMETRIC OP STACK (ARCH §5), not pixel layers: adjustments are
 * stored as plain numbers and applied to a cached working buffer on every
 * change. The working buffer is the decoded image downscaled to a screen-sized
 * resolution so edits stay interactive; the JPEG export is that same render.
 *
 * Rendering runs on the WebGPU backend (./gpuRenderer.js) — tone/color + spatial
 * (clarity/texture/sharpen/NR/dehaze) ops and a histogram compute pass. The CPU
 * render() below is the fallback when WebGPU is unavailable; it covers the
 * tone/color ops only (spatial ops ride the GPU blur passes). The two share the
 * same op math — keep them in sync. */

const RAW_ACCEPT = '.nef,.dng,.cr2,.cr3,.arw,.raf,.rw2,.orf,.tif,.tiff'

// Fast first paint: 1/2 dimensions (~1/4 the pixels) + bilinear demosaic (-q 0).
const PREVIEW_OPTS = { useCameraWb: true, outputBps: 8, halfSize: true, userQual: 0 }
// Full-res, default-quality demosaic — the master and the §5 latency gate.
const MASTER_OPTS = { useCameraWb: true, outputBps: 8 }

// Long-edge cap for the interactive editing buffer. Plenty for screen; keeps
// the per-adjustment pixel loop to ~1-2M iterations so drags stay smooth.
const WORK_MAX_EDGE = 1600

// The parametric op stack. Zero = the decoded image, untouched. Tone + color
// ops run on either backend; the Detail (spatial) ops need the GPU's blur
// passes and are no-ops on the CPU fallback.
const ZERO_ADJ = {
  exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  temp: 0, tint: 0, vibrance: 0, saturation: 0,
  clarity: 0, texture: 0, sharpness: 0, noise: 0, dehaze: 0,
}

// Slider config, grouped Lightroom-style. Every key has a real op in the
// pipeline.
const TONE = [
  { key: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.01 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1 },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1 },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1 },
]
const COLOR = [
  { key: 'temp', label: 'Temp', min: -100, max: 100, step: 1 },
  { key: 'tint', label: 'Tint', min: -100, max: 100, step: 1 },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
]
// Spatial ops — GPU only (they ride the blur passes).
const DETAIL = [
  { key: 'clarity', label: 'Clarity', min: -100, max: 100, step: 1 },
  { key: 'texture', label: 'Texture', min: -100, max: 100, step: 1 },
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, step: 1 },
  { key: 'noise', label: 'Noise Red.', min: 0, max: 100, step: 1 },
  { key: 'dehaze', label: 'Dehaze', min: 0, max: 100, step: 1 },
]
const GROUPS = [
  ['Tone', TONE],
  ['Color', COLOR],
]

/* Draw an RGB histogram (256 bins/channel, additive) into a small 2d canvas. */
function drawHistogram(canvas, bins) {
  if (!canvas || !bins) return
  const w = canvas.width
  const h = canvas.height
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)
  let max = 1
  for (let i = 0; i < bins.length; i++) if (bins[i] > max) max = bins[i]
  const logMax = Math.log(max + 1)
  const chans = [
    ['rgba(229,72,72,0.75)', 0],
    ['rgba(63,176,99,0.75)', 256],
    ['rgba(74,124,240,0.78)', 512],
  ]
  ctx.globalCompositeOperation = 'lighter'
  for (const [color, off] of chans) {
    ctx.fillStyle = color
    for (let x = 0; x < 256; x++) {
      const bh = (Math.log(bins[off + x] + 1) / logMax) * h
      const px = (x / 255) * w
      ctx.fillRect(px, h - bh, Math.max(1, w / 256), bh)
    }
  }
  ctx.globalCompositeOperation = 'source-over'
}

function fmtShutter(s) {
  if (!s || s <= 0) return null
  return s >= 1 ? `${s.toFixed(1)}s` : `1/${Math.round(1 / s)}s`
}

function fmtBytes(n) {
  if (n == null) return null
  const mb = n / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(n / 1024)} KB`
}

/* Interleaved RGB → RGBA (16-bit output downshifted to 8). */
function toRgba({ width, height, data, colors, bits }) {
  const out = new Uint8ClampedArray(width * height * 4)
  const px = width * height
  const shift = bits === 16 ? 8 : 0
  for (let i = 0, p = 0, s = 0; i < px; i++, s += colors) {
    out[p++] = shift ? data[s] >> shift : data[s]
    out[p++] = shift ? data[s + 1] >> shift : data[s + 1]
    out[p++] = shift ? data[s + 2] >> shift : data[s + 2]
    out[p++] = 255
  }
  return out
}

/* Build the interactive working buffer: RGBA downscaled to WORK_MAX_EDGE. */
function buildWorking(img) {
  const rgba = toRgba(img)
  const scale = Math.min(1, WORK_MAX_EDGE / Math.max(img.width, img.height))
  if (scale === 1) return { data: rgba, width: img.width, height: img.height }
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const src = document.createElement('canvas')
  src.width = img.width
  src.height = img.height
  src.getContext('2d').putImageData(new ImageData(rgba, img.width, img.height), 0, 0)
  const dst = document.createElement('canvas')
  dst.width = w
  dst.height = h
  const dctx = dst.getContext('2d')
  dctx.imageSmoothingQuality = 'high'
  dctx.drawImage(src, 0, 0, w, h)
  return { data: dctx.getImageData(0, 0, w, h).data, width: w, height: h }
}

/* Working buffer from an already-decoded image element (a catalog derivative,
 * re-opened for editing). Same downscale cap as buildWorking. */
function buildWorkingFromImage(el) {
  const scale = Math.min(1, WORK_MAX_EDGE / Math.max(el.naturalWidth, el.naturalHeight))
  const w = Math.max(1, Math.round(el.naturalWidth * scale))
  const h = Math.max(1, Math.round(el.naturalHeight * scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(el, 0, 0, w, h)
  return { data: ctx.getImageData(0, 0, w, h).data, width: w, height: h }
}

/* Apply the op stack to the working buffer and paint it. Order: exposure →
 * white balance → tone (contrast + tonal regions, as a hue-preserving luma
 * curve) → color (vibrance + saturation). All math in 0..1 space. The tonal
 * regions use overlapping luma windows: blacks/whites peak at the extremes,
 * shadows/highlights at the lower/upper mids. */
function render(src, adj, canvas) {
  if (!src || !canvas) return
  const { data, width, height } = src
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const out = new Uint8ClampedArray(data.length) // clamps on assignment
  const expGain = Math.pow(2, adj.exposure)
  const c = adj.contrast / 100
  const t = (adj.temp / 100) * 0.4
  const ti = (adj.tint / 100) * 0.4
  const kHi = adj.highlights / 100
  const kSh = adj.shadows / 100
  const kWh = adj.whites / 100
  const kBl = adj.blacks / 100
  const vib = adj.vibrance / 100
  const sat = adj.saturation / 100
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255
    let g = data[i + 1] / 255
    let b = data[i + 2] / 255

    // 1 — exposure (linear gain)
    r *= expGain
    g *= expGain
    b *= expGain

    // 2 — white balance (channel scaling)
    r *= 1 + t
    b *= 1 - t
    g *= 1 - ti

    // 3 — tone: response curve on luma, applied to RGB as a ratio (keeps hue)
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const il = 1 - L
    let o = (L - 0.5) * (1 + c) + 0.5 // contrast S-curve
    o += kBl * 0.25 * il * il * il // blacks   — peaks at 0
    o += kSh * 0.6 * il * il * L // shadows  — lower-mid
    o += kHi * 0.6 * L * L * il // highlights— upper-mid
    o += kWh * 0.25 * L * L * L // whites   — peaks at 1
    if (L > 1e-4) {
      const ratio = o / L
      r *= ratio
      g *= ratio
      b *= ratio
    } else {
      r = o
      g = o
      b = o
    }

    // 4 — color: vibrance (weighted toward low-chroma pixels) then saturation
    const L2 = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const chroma = Math.max(r, g, b) - Math.min(r, g, b)
    const f = (1 + sat) * (1 + vib * (1 - chroma))
    r = L2 + (r - L2) * f
    g = L2 + (g - L2) * f
    b = L2 + (b - L2) * f

    out[i] = r * 255
    out[i + 1] = g * 255
    out[i + 2] = b * 255
    out[i + 3] = 255
  }
  ctx.putImageData(new ImageData(out, width, height), 0, 0)
}

function Row({ k, v }) {
  if (!v) return null
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="kol-helper-10 text-meta uppercase">{k}</dt>
      <dd className="text-emphasis break-words">{v}</dd>
    </div>
  )
}

/* Collapsible right-panel section (Lightroom-style). */
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-fg-08">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 kol-helper-10 uppercase tracking-widest text-meta transition-colors hover:text-body"
      >
        <span>{title}</span>
        <span className="text-meta">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="flex flex-col gap-3 px-3 pb-3">{children}</div>}
    </div>
  )
}

export default function Develop({ active = true }) {
  const inputRef = useRef(null)
  const canvasRef = useRef(null)
  const histRef = useRef(null) // histogram canvas (2d)
  const srcRef = useRef(null) // working buffer { data, width, height }
  const gpuRef = useRef(null) // WebGPU renderer, or null when on the CPU path
  const [srcVersion, setSrcVersion] = useState(0) // bumped when srcRef changes
  const [backend, setBackend] = useState('cpu') // 'cpu' | 'gpu'
  const [state, setState] = useState('idle') // idle | decoding | preview | done | error
  const [err, setErr] = useState(null)
  const [meta, setMeta] = useState(null)
  const [info, setInfo] = useState(null)
  const [previewMs, setPreviewMs] = useState(null)
  const [adj, setAdj] = useState(ZERO_ADJ)
  const [preview, setPreview] = useState(null) // hover-preview of a preset/profile (overrides adj for render)
  const [presets, setPresets] = useState(loadPresets)
  const [dragging, setDragging] = useState(false)
  const [showBefore, setShowBefore] = useState(false) // before/after compare
  const [zoom, setZoom] = useState('fit') // 'fit' | '100'
  const { reload, editTarget, setEditTarget, source } = useCatalog() ?? {}

  // Bring up the WebGPU backend once; stay on CPU if it doesn't init. If a
  // source already landed before init resolved, hand it over.
  useEffect(() => {
    let cancelled = false
    createGpuRenderer(canvasRef.current, {
      onHistogram: (bins) => drawHistogram(histRef.current, bins),
    })
      .then((r) => {
        if (cancelled) return r?.destroy?.()
        if (!r) return
        gpuRef.current = r
        setBackend('gpu')
        if (srcRef.current) {
          r.setImage(srcRef.current)
          setSrcVersion((v) => v + 1)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
      gpuRef.current?.destroy?.()
      gpuRef.current = null
    }
  }, [])

  // Re-render whenever the edit changes, a hover-preview is active, or a fresher
  // source buffer lands. `preview` (a preset/profile being hovered) overrides
  // the committed `adj` for the render only.
  useEffect(() => {
    if (!srcRef.current) return
    const a = showBefore ? ZERO_ADJ : (preview ?? adj)
    if (gpuRef.current) gpuRef.current.render(a)
    else render(srcRef.current, a, canvasRef.current)
  }, [adj, preview, showBefore, srcVersion])

  // Keyboard: \ (or Y) toggles before/after.
  useEffect(() => {
    const onKey = (e) => {
      if (!active) return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === '\\' || e.key === 'y' || e.key === 'Y') {
        setShowBefore((s) => !s)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  const setWorkingBuffer = useCallback((buf) => {
    srcRef.current = buf
    gpuRef.current?.setImage(buf)
    setSrcVersion((v) => v + 1)
  }, [])
  const setSource = useCallback((img) => setWorkingBuffer(buildWorking(img)), [setWorkingBuffer])

  // Round-trip: arriving from the Library with a catalog image to re-edit. Load
  // its derivative as the source and restore the stored op-stack. (Edits the
  // published derivative — true non-destructive-from-raw needs the raw kept.)
  useEffect(() => {
    if (!editTarget) return
    const url = (editTarget.cdn_url || '').replace(/\s+/g, '')
    if (!url.startsWith('http') && !url.startsWith('blob:')) {
      setEditTarget?.(null)
      return
    }
    let cancelled = false
    setState('decoding')
    setErr(null)
    const im = new Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => {
      if (cancelled) return
      setWorkingBuffer(buildWorkingFromImage(im))
      setAdj({ ...ZERO_ADJ, ...(editTarget.edit || {}) })
      setMeta({
        camera_make: editTarget.camera || '',
        camera_model: '',
        iso_speed: editTarget.iso,
        shutter: editTarget.shutter,
        aperture: editTarget.aperture,
        focal_len: editTarget.focal_len,
        timestamp: editTarget.shot_at ? new Date(editTarget.shot_at) : null,
      })
      setInfo({ fileName: editTarget.filename, width: im.naturalWidth, height: im.naturalHeight, colors: 4, bits: 8, ms: null })
      setState('done')
      setEditTarget?.(null)
    }
    im.onerror = () => {
      if (cancelled) return
      setErr('Could not load image for editing')
      setState('error')
      setEditTarget?.(null)
    }
    im.src = url
    return () => {
      cancelled = true
    }
  }, [editTarget, setWorkingBuffer, setEditTarget])

  const decode = useCallback(
    async (file) => {
      if (!file) return
      setState('decoding')
      setErr(null)
      setMeta(null)
      setInfo(null)
      setPreviewMs(null)
      setAdj(ZERO_ADJ)
      srcRef.current = null

      // One open() = one full decode, so each tier gets its own worker. The
      // worker transfers (and neuters) the buffer it's handed, so re-read the
      // file per pass rather than sharing one Uint8Array.
      const decodeTier = async (opts) => {
        const raw = new LibRaw()
        try {
          const t0 = performance.now()
          await raw.open(new Uint8Array(await file.arrayBuffer()), opts)
          const m = await raw.metadata(true)
          const img = await raw.imageData()
          return { img, meta: m, ms: Math.round(performance.now() - t0) }
        } finally {
          raw?.worker?.terminate?.()
        }
      }

      // Kick off both passes at once; await the cheap preview first.
      const previewP = decodeTier(PREVIEW_OPTS)
      const masterP = decodeTier(MASTER_OPTS)

      try {
        const p = await previewP
        setSource(p.img) // editing is live from here — half-res source is fine
        setMeta(p.meta)
        setPreviewMs(p.ms)
        setInfo({ fileName: file.name, fileSize: file.size, ms: null })
        setState('preview')
      } catch (e) {
        console.warn('[develop] preview failed', e)
      }

      try {
        const m = await masterP
        setSource(m.img) // upgrade the working buffer to the full-quality source
        setMeta(m.meta)
        setInfo({
          width: m.img.width,
          height: m.img.height,
          colors: m.img.colors,
          bits: m.img.bits,
          ms: m.ms,
          fileName: file.name,
          fileSize: file.size,
        })
        setState('done')
      } catch (e) {
        console.error('[develop] master decode failed', e)
        setErr(e?.message || String(e))
        setState((s) => (s === 'preview' ? 'preview' : 'error'))
      }
    },
    [setSource],
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    decode(e.dataTransfer?.files?.[0])
  }

  const set = (key) => (v) => setAdj((a) => ({ ...a, [key]: v }))
  const reset = () => setAdj(ZERO_ADJ)

  // Profile = a built-in base look (replaces the stack with the profile's values).
  const applyProfile = (name) => {
    const p = PROFILES.find((x) => x.name === name)
    setAdj({ ...ZERO_ADJ, ...(p?.adj || {}) })
  }
  // Presets = user-saved snapshots of the full op-stack (localStorage).
  const savePreset = () => {
    const name = window.prompt('Preset name')?.trim()
    if (!name) return
    const next = [...presets, { id: newId(), name, adj }]
    setPresets(next)
    persistPresets(next)
  }
  const applyPreset = (p) => {
    setPreview(null)
    setAdj({ ...ZERO_ADJ, ...p.adj })
  }
  const deletePreset = (id) => {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    persistPresets(next)
  }

  // Export the rendered working-res canvas as a JPEG "web master" — the
  // CDN-bound derivative (web delivery doesn't need the 51MP master). The B2
  // bucket push itself is a CLI step (the `bucket` wrapper), outside the app.
  const exportJpeg = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${(info?.fileName || 'export').replace(/\.[^.]+$/, '')}-web.jpg`
        a.click()
        URL.revokeObjectURL(url)
      },
      'image/jpeg',
      0.92,
    )
  }

  // Publish: render the canvas → JPEG, hand it to the `publish` Edge Function,
  // which uploads the bytes + writes the catalog row (secret stays server-side,
  // no login). The current op-stack rides along as the row's `edit`.
  const [publish, setPublish] = useState(null) // null | 'busy' | {ok} | {error}
  const publishToLibrary = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPublish('busy')
    canvas.toBlob(
      async (blob) => {
        if (!blob) return setPublish({ error: 'no image' })
        try {
          const image = await publishImage({
            blob,
            filename: `${(info?.fileName || 'export').replace(/\.[^.]+$/, '')}-web.jpg`,
            meta: {
              width: canvas.width,
              height: canvas.height,
              camera: [meta?.camera_make, meta?.camera_model].filter(Boolean).join(' ') || null,
              iso: meta?.iso_speed ?? null,
              shutter: meta?.shutter ?? null,
              aperture: meta?.aperture ?? null,
              focal_len: meta?.focal_len ?? null,
              shot_at:
                meta?.timestamp instanceof Date && !isNaN(meta.timestamp)
                  ? meta.timestamp.toISOString()
                  : null,
            },
            edit: adj,
            tags: [],
          })
          setPublish({ ok: image.filename })
          reload?.() // refresh the catalog so it shows in the filmstrip + library
        } catch (e) {
          setPublish({ error: e?.message || String(e) })
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  // Save local: same JPEG, stored in the browser (IndexedDB) instead of a cloud.
  const saveLocal = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPublish('busy')
    canvas.toBlob(
      async (blob) => {
        if (!blob) return setPublish({ error: 'no image' })
        try {
          const row = await saveLocalImage({
            blob,
            filename: `${(info?.fileName || 'export').replace(/\.[^.]+$/, '')}-web.jpg`,
            meta: {
              width: canvas.width,
              height: canvas.height,
              camera: [meta?.camera_make, meta?.camera_model].filter(Boolean).join(' ') || null,
              iso: meta?.iso_speed ?? null,
              shutter: meta?.shutter ?? null,
              aperture: meta?.aperture ?? null,
              focal_len: meta?.focal_len ?? null,
              shot_at:
                meta?.timestamp instanceof Date && !isNaN(meta.timestamp) ? meta.timestamp.toISOString() : null,
            },
            edit: adj,
            tags: [],
          })
          setPublish({ ok: `${row.filename} (local)` })
          if (source === 'local') reload?.()
        } catch (e) {
          setPublish({ error: e?.message || String(e) })
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  const hasImage = state === 'preview' || state === 'done'
  const busy = state === 'decoding' || state === 'preview'
  const isGpu = backend === 'gpu'

  const activeEdits = Object.entries(adj).filter(([, v]) => v !== 0)

  return (
    <div className="flex h-full">
      {/* LEFT — History + Info */}
      <aside className="hidden w-[220px] shrink-0 flex-col overflow-auto border-r border-fg-08 bg-[#1b1b1b] xl:flex">
        {hasImage && (
          <>
            <Section title="Presets">
              <Button variant="secondary" size="sm" onClick={savePreset}>
                Save current
              </Button>
              {presets.length === 0 ? (
                <span className="kol-mono-12 text-meta">No presets yet</span>
              ) : (
                <div className="flex flex-col">
                  {presets.map((p) => (
                    <div key={p.id} className="group flex items-center gap-1">
                      <button
                        onClick={() => applyPreset(p)}
                        onMouseEnter={() => setPreview({ ...ZERO_ADJ, ...p.adj })}
                        onMouseLeave={() => setPreview(null)}
                        className="flex-1 truncate py-1 text-left kol-mono-12 text-body transition-colors hover:text-emphasis"
                      >
                        {p.name}
                      </button>
                      <button
                        onClick={() => deletePreset(p.id)}
                        className="px-1 text-meta opacity-0 transition-opacity hover:text-body group-hover:opacity-100"
                        title="Delete preset"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section title="History">
              {activeEdits.length ? (
                <div className="kol-mono-12 text-body">
                  {activeEdits.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span className="capitalize text-meta">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="kol-mono-12 text-meta">No adjustments</span>
              )}
            </Section>
            <Section title="Info" defaultOpen={false}>
              <dl className="flex flex-col gap-3 kol-mono-12 text-body">
                <Row k="File" v={info?.fileName} />
                <Row
                  k="Camera"
                  v={meta ? [meta.camera_make, meta.camera_model].filter(Boolean).join(' ') : null}
                />
                <Row
                  k="Exposure"
                  v={
                    meta
                      ? [
                          fmtShutter(meta.shutter),
                          meta.aperture ? `f/${meta.aperture}` : null,
                          meta.iso_speed ? `ISO ${meta.iso_speed}` : null,
                          meta.focal_len ? `${meta.focal_len}mm` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : null
                  }
                />
                <Row
                  k="Pixels"
                  v={info?.width ? `${info.width}×${info.height} · ${info.colors}ch · ${info.bits}-bit` : null}
                />
                <Row k="Decode" v={info?.ms != null ? `${info.ms} ms` : hasImage ? 'full-res decoding…' : null} />
                <Row k="Engine" v={backend === 'gpu' ? 'WebGPU' : 'CPU'} />
              </dl>
            </Section>
          </>
        )}
      </aside>

      {/* CENTER — image stage */}
      <div className="flex min-w-0 flex-1 flex-col bg-black">
        <div className="flex shrink-0 items-center gap-3 border-b border-fg-08 bg-black/40 px-3 py-2">
          <Button
            variant="secondary"
            size="sm"
            iconLeft="image"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {hasImage ? 'Open another' : 'Choose file'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={RAW_ACCEPT}
            className="hidden"
            onChange={(e) => decode(e.target.files?.[0])}
          />
          <span className="truncate kol-mono-12 text-meta">
            {state === 'decoding'
              ? 'Decoding…'
              : state === 'preview'
                ? 'Refining full resolution…'
                : state === 'error'
                  ? `Decode failed: ${err}`
                  : hasImage
                    ? info?.fileName
                    : 'Drop a raw file to begin'}
          </span>
          {hasImage && (
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={showBefore ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setShowBefore((s) => !s)}
                title="Before / After (\)"
              >
                {showBefore ? 'Before' : 'After'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom((z) => (z === 'fit' ? '100' : 'fit'))}
                title="Zoom (click image)"
              >
                {zoom === 'fit' ? 'Fit' : '1:1'}
              </Button>
            </div>
          )}
        </div>
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative min-h-0 flex-1 p-4 ${
            zoom === 'fit' ? 'flex items-center justify-center overflow-hidden' : 'overflow-auto'
          }`}
        >
          <canvas
            ref={canvasRef}
            onClick={() => hasImage && setZoom((z) => (z === 'fit' ? '100' : 'fit'))}
            className={`block ${hasImage ? '' : 'hidden'} ${
              zoom === 'fit' ? 'max-h-full max-w-full cursor-zoom-in' : 'cursor-zoom-out'
            }`}
          />
          {!hasImage && (
            <span className="kol-helper-12 uppercase text-meta">
              {state === 'decoding' ? 'Decoding…' : 'Drop a raw file here'}
            </span>
          )}
          {dragging && (
            <div className="absolute inset-3 flex items-center justify-center rounded-lg border-2 border-dashed border-fg-40 bg-fg-04/40 kol-helper-12 uppercase text-emphasis">
              Drop to open
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — histogram + adjustments + export/publish */}
      <aside className="flex w-[300px] shrink-0 flex-col overflow-auto border-l border-fg-08 bg-[#1b1b1b]">
        {!hasImage && <div className="p-4 kol-mono-12 text-meta">Open a raw to start editing.</div>}
        {hasImage && (
          <>
            {isGpu && (
              <div className="border-b border-fg-08 p-3">
                <canvas ref={histRef} width={256} height={72} className="block h-[72px] w-full rounded bg-fg-04" />
              </div>
            )}
            <div className="flex items-center gap-2 border-b border-fg-08 px-3 py-2">
              <span className="kol-helper-10 uppercase tracking-widest text-meta">Profile</span>
              <select
                onChange={(e) => applyProfile(e.target.value)}
                defaultValue="Standard"
                className="ml-auto rounded bg-fg-08 px-2 py-1 kol-mono-12 text-body outline-none"
              >
                {PROFILES.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between border-b border-fg-08 px-3 py-2">
              <span className="kol-helper-10 uppercase tracking-widest text-meta">Adjustments</span>
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
            </div>
            {[...GROUPS, ...(isGpu ? [['Detail', DETAIL]] : [])].map(([title, group]) => (
              <Section key={title} title={title}>
                {group.map((s) => (
                  <LabeledControl key={s.key} label={s.label}>
                    <Slider
                      variant="minimal"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={adj[s.key]}
                      onChange={set(s.key)}
                    />
                  </LabeledControl>
                ))}
              </Section>
            ))}
            <div className="mt-auto flex flex-col gap-2 border-t border-fg-08 p-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" iconLeft="download" onClick={exportJpeg} title="Save a copy to your computer">
                  Export
                </Button>
                <Button variant="secondary" size="sm" disabled={publish === 'busy'} onClick={saveLocal} title="Save to the local (in-browser) library">
                  Save local
                </Button>
                {supabaseConfigured && (
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft="image"
                    disabled={publish === 'busy'}
                    onClick={publishToLibrary}
                    title="Publish to the shared cloud library"
                  >
                    {publish === 'busy' ? 'Publishing…' : 'Publish'}
                  </Button>
                )}
              </div>
              {publish?.ok && (
                <span className="kol-mono-12 text-[var(--kol-color-green-400)]">Published “{publish.ok}” ✓</span>
              )}
              {publish?.error && (
                <span className="kol-mono-12 text-[var(--kol-color-red-400)]">Publish failed: {publish.error}</span>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
