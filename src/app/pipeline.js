/* The CPU image pipeline — shared by the live editor (Develop) and batch.
 * Tone/color op-stack over a decoded RGBA working buffer. Spatial/Detail ops are
 * GPU-only and not part of this CPU path; batch applies tone/color. Keep the op
 * math in sync with the WGSL in gpuRenderer.js and the GPU editor path. */

// Long-edge cap for the working buffer (interactive + batch).
export const WORK_MAX_EDGE = 1600

/* Interleaved RGB → RGBA (16-bit output downshifted to 8). */
export function toRgba({ width, height, data, colors, bits }) {
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

/* Build the working buffer: RGBA downscaled to WORK_MAX_EDGE. */
export function buildWorking(img) {
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

/* Working buffer from an already-decoded image element (catalog derivative). */
export function buildWorkingFromImage(el) {
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

/* Apply the tone/color op stack to a working buffer and paint it to a canvas.
 * Order: exposure → white balance → tone (contrast + tonal regions, as a
 * hue-preserving luma curve) → color (vibrance + saturation). 0..1 space. */
export function render(src, adj, canvas) {
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
    r *= expGain
    g *= expGain
    b *= expGain
    r *= 1 + t
    b *= 1 - t
    g *= 1 - ti
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const il = 1 - L
    let o = (L - 0.5) * (1 + c) + 0.5
    o += kBl * 0.25 * il * il * il
    o += kSh * 0.6 * il * il * L
    o += kHi * 0.6 * L * L * il
    o += kWh * 0.25 * L * L * L
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
