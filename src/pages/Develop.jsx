import { useRef, useState, useCallback, useEffect } from 'react'
import LibRaw from 'libraw-wasm'
import Button from '../components/atoms/Button.jsx'
import Slider from '../components/atoms/Slider.jsx'
import Divider from '../components/atoms/Divider.jsx'
import LabeledControl from '../components/molecules/LabeledControl.jsx'
import { createGpuRenderer } from './gpuRenderer.js'
import { publishImage, supabaseConfigured } from '../lib/supabase.js'

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

export default function Develop() {
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
  const [dragging, setDragging] = useState(false)

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

  // Re-render whenever an adjustment changes or a fresher source buffer lands.
  useEffect(() => {
    if (!srcRef.current) return
    if (gpuRef.current) gpuRef.current.render(adj)
    else render(srcRef.current, adj, canvasRef.current)
  }, [adj, srcVersion])

  const setSource = useCallback((img) => {
    const buf = buildWorking(img)
    srcRef.current = buf
    gpuRef.current?.setImage(buf)
    setSrcVersion((v) => v + 1)
  }, [])

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

  return (
    <main className="p-8 md:p-12 max-w-6xl">
      <p className="kol-helper-12 text-meta uppercase mb-2">kol-lightroom · develop</p>
      <h1 className="kol-sans-display-01 text-emphasis mb-4">Raw decode</h1>
      <p className="kol-sans-body-01 text-body max-w-prose mb-8">
        Drop a raw file (NEF, CR2/CR3, DNG, ARW, RAF, TIFF…) to decode it in-browser via
        LibRaw compiled to WebAssembly. Demosaic and camera white balance run in a Web
        Worker; the result is painted to a canvas at full resolution.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed p-8 mb-8 flex flex-col items-center gap-4 text-center transition-colors ${
          dragging ? 'border-fg-40 bg-fg-04' : 'border-fg-16'
        }`}
      >
        <p className="kol-sans-body-01 text-body">
          {state === 'decoding'
            ? 'Decoding…'
            : state === 'preview'
              ? 'Refining full resolution…'
              : 'Drop a raw file here'}
        </p>
        <Button
          variant="secondary"
          iconLeft="image"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={RAW_ACCEPT}
          className="hidden"
          onChange={(e) => decode(e.target.files?.[0])}
        />
      </div>

      {state === 'error' && (
        <p className="kol-mono-14 text-[var(--kol-color-red-400)] mb-8">Decode failed: {err}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="min-w-0 rounded-lg overflow-hidden border border-fg-08 bg-fg-04">
          <canvas ref={canvasRef} className={`block max-w-full h-auto ${hasImage ? '' : 'hidden'}`} />
          {!hasImage && (
            <div className="aspect-[3/2] flex items-center justify-center">
              <span className="kol-helper-12 text-meta uppercase">
                {state === 'decoding' ? 'Decoding…' : 'No image'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {hasImage && (
            <div className="flex flex-col gap-5">
              {isGpu && (
                <canvas
                  ref={histRef}
                  width={256}
                  height={72}
                  className="block w-full h-[72px] rounded bg-fg-04 border border-fg-08"
                />
              )}
              <div className="flex items-center justify-between">
                <span className="kol-helper-10 text-meta uppercase tracking-widest">Adjustments</span>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Reset
                </Button>
              </div>
              {[...GROUPS, ...(isGpu ? [['Detail', DETAIL]] : [])].map(([title, group]) => (
                <div key={title} className="flex flex-col gap-3">
                  <span className="kol-helper-10 text-subtle uppercase tracking-widest">{title}</span>
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
                </div>
              ))}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" iconLeft="download" onClick={exportJpeg}>
                    Export
                  </Button>
                  {supabaseConfigured && (
                    <Button
                      variant="primary"
                      size="sm"
                      iconLeft="image"
                      disabled={publish === 'busy'}
                      onClick={publishToLibrary}
                    >
                      {publish === 'busy' ? 'Publishing…' : 'Publish to library'}
                    </Button>
                  )}
                </div>
                {publish?.ok && (
                  <span className="kol-mono-12 text-[var(--kol-color-green-400)]">
                    Published “{publish.ok}” ✓
                  </span>
                )}
                {publish?.error && (
                  <span className="kol-mono-12 text-[var(--kol-color-red-400)]">
                    Publish failed: {publish.error}
                  </span>
                )}
              </div>
            </div>
          )}

          {info && meta && (
            <>
              {hasImage && <Divider />}
              <dl className="kol-mono-12 text-body flex flex-col gap-3">
                <Row k="File" v={info.fileName} />
                <Row k="Size" v={fmtBytes(info.fileSize)} />
                <Row k="Camera" v={[meta.camera_make, meta.camera_model].filter(Boolean).join(' ')} />
                <Row
                  k="Exposure"
                  v={[
                    fmtShutter(meta.shutter),
                    meta.aperture ? `f/${meta.aperture}` : null,
                    meta.iso_speed ? `ISO ${meta.iso_speed}` : null,
                    meta.focal_len ? `${meta.focal_len}mm` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <Row
                  k="Shot"
                  v={
                    meta.timestamp instanceof Date && !isNaN(meta.timestamp)
                      ? meta.timestamp.toLocaleString()
                      : null
                  }
                />
                <Row
                  k="Pixels"
                  v={info.width ? `${info.width}×${info.height} · ${info.colors}ch · ${info.bits}-bit` : null}
                />
                <Row k="Preview" v={previewMs != null ? `${previewMs} ms · ½-res` : null} />
                <Row k="Decode" v={info.ms != null ? `${info.ms} ms` : 'full-res decoding…'} />
                <Row k="Engine" v={backend === 'gpu' ? 'WebGPU' : 'CPU'} />
              </dl>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
