import LibRaw from 'libraw-wasm'
import { buildWorking, render } from './pipeline.js'
import { createGpuRenderer } from '../pages/gpuRenderer.js'

/* Batch engine — apply one edit (op-stack) to many raws and produce JPEGs.
 * Decode (libraw-wasm, fast half-size) → working buffer → render → JPEG.
 * Prefers the GPU pipeline (full ops incl. spatial Clarity/Texture/Sharpen/NR/
 * Dehaze, on an OffscreenCanvas); falls back to the shared CPU pipeline
 * (tone/color only) when WebGPU is unavailable. */

const BATCH_OPTS = { useCameraWb: true, outputBps: 8, halfSize: true, userQual: 0 }

async function decodeFile(file) {
  const raw = new LibRaw()
  try {
    await raw.open(new Uint8Array(await file.arrayBuffer()), BATCH_OPTS)
    return await raw.imageData()
  } finally {
    raw?.worker?.terminate?.()
  }
}

const blobFrom = (canvas) =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))

/* Process a list of File objects with `adj`. Returns [{ name, blob } | { name, error }].
 * onProgress({ done, total, name }) fires after each file. */
export async function runBatch(files, adj, { onProgress } = {}) {
  const results = []
  const total = files.length

  // Prefer GPU (full ops); fall back to CPU (tone/color).
  let gpu = null
  try {
    gpu = await createGpuRenderer(new OffscreenCanvas(64, 64))
  } catch {
    gpu = null
  }
  const cpuCanvas = gpu ? null : document.createElement('canvas')

  for (let i = 0; i < total; i++) {
    const file = files[i]
    onProgress?.({ done: i, total, name: file.name, engine: gpu ? 'gpu' : 'cpu' })
    try {
      const buf = buildWorking(await decodeFile(file))
      let blob
      if (gpu) {
        gpu.setImage(buf)
        blob = await gpu.exportBlob(adj)
      } else {
        render(buf, adj, cpuCanvas)
        blob = await blobFrom(cpuCanvas)
      }
      results.push({ name: `${file.name.replace(/\.[^.]+$/, '')}-web.jpg`, blob })
    } catch (e) {
      results.push({ name: file.name, error: String(e?.message ?? e) })
    }
    onProgress?.({ done: i + 1, total, name: file.name })
  }

  gpu?.destroy?.()
  return results
}
