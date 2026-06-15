/* WebGPU backend for the develop pipeline (ARCH §5 — the parametric pipeline).
 *
 * Multi-pass, all on the GPU:
 *   1. base   — tone + color op stack over the uploaded source        → baseTex
 *   2. blur S — separable Gaussian, small radius (sharpen/texture/NR)  → blurSTex
 *   3. blur L — separable Gaussian, large radius (clarity/dehaze)      → blurLTex
 *   4. final  — spatial ops combine base + both blurs                 → canvas
 *   5. histo  — compute pass over baseTex → 256×RGB bins (read back)
 *
 * Each adjustment change is a couple of uniform writes + this pass chain; no
 * per-pixel JS. createGpuRenderer() resolves null when WebGPU is unavailable so
 * the caller can fall back to the CPU op stack (basic ops only). The tone/color
 * math is a port of the CPU render() in Develop.jsx — keep them in sync. */

const VS = /* wgsl */ `
struct VSOut { @builtin(position) pos : vec4<f32>, @location(0) uv : vec2<f32> };
@vertex
fn vs(@builtin(vertex_index) i : u32) -> VSOut {
  var p = array<vec2<f32>, 3>(vec2<f32>(-1.0,-1.0), vec2<f32>(3.0,-1.0), vec2<f32>(-1.0,3.0));
  var o : VSOut;
  o.pos = vec4<f32>(p[i], 0.0, 1.0);
  o.uv = p[i] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
  return o;
}
const LUMA = vec3<f32>(0.2126, 0.7152, 0.0722);
`

const BASE_WGSL =
  VS +
  /* wgsl */ `
struct Adj { a : vec4<f32>, b : vec4<f32>, c : vec4<f32> };
@group(0) @binding(0) var img  : texture_2d<f32>;
@group(0) @binding(1) var samp : sampler;
@group(0) @binding(2) var<uniform> adj : Adj;
@fragment
fn fs(in : VSOut) -> @location(0) vec4<f32> {
  var rgb = textureSampleLevel(img, samp, in.uv, 0.0).rgb;
  let expGain = adj.a.x; let contrast = adj.a.y; let temp = adj.a.z; let tint = adj.a.w;
  let kHi = adj.b.x; let kSh = adj.b.y; let kWh = adj.b.z; let kBl = adj.b.w;
  let vib = adj.c.x; let sat = adj.c.y;
  rgb = rgb * expGain;
  rgb.r = rgb.r * (1.0 + temp);
  rgb.b = rgb.b * (1.0 - temp);
  rgb.g = rgb.g * (1.0 - tint);
  let L = dot(rgb, LUMA);
  let il = 1.0 - L;
  var o = (L - 0.5) * (1.0 + contrast) + 0.5;
  o = o + kBl * 0.25 * il * il * il;
  o = o + kSh * 0.6  * il * il * L;
  o = o + kHi * 0.6  * L * L * il;
  o = o + kWh * 0.25 * L * L * L;
  if (L > 1e-4) { rgb = rgb * (o / L); } else { rgb = vec3<f32>(o, o, o); }
  let L2 = dot(rgb, LUMA);
  let chroma = max(rgb.r, max(rgb.g, rgb.b)) - min(rgb.r, min(rgb.g, rgb.b));
  let f = (1.0 + sat) * (1.0 + vib * (1.0 - chroma));
  rgb = vec3<f32>(L2) + (rgb - vec3<f32>(L2)) * f;
  return vec4<f32>(rgb, 1.0);
}
`

const BLUR_WGSL =
  VS +
  /* wgsl */ `
struct Blur { texel : vec2<f32>, dir : vec2<f32>, radius : f32, sigma : f32, pad : vec2<f32> };
@group(0) @binding(0) var src  : texture_2d<f32>;
@group(0) @binding(1) var samp : sampler;
@group(0) @binding(2) var<uniform> b : Blur;
@fragment
fn fs(in : VSOut) -> @location(0) vec4<f32> {
  let R = i32(b.radius);
  var sum = vec3<f32>(0.0);
  var wsum = 0.0;
  for (var i = -R; i <= R; i = i + 1) {
    let fi = f32(i);
    let w = exp(-(fi * fi) / (2.0 * b.sigma * b.sigma));
    let uv = in.uv + b.dir * b.texel * fi;
    sum = sum + textureSampleLevel(src, samp, uv, 0.0).rgb * w;
    wsum = wsum + w;
  }
  return vec4<f32>(sum / wsum, 1.0);
}
`

const FINAL_WGSL =
  VS +
  /* wgsl */ `
struct Sp { v : vec4<f32>, w : vec4<f32> }; // clarity, texture, sharp, noise | dehaze,_,_,_
@group(0) @binding(0) var baseT : texture_2d<f32>;
@group(0) @binding(1) var blurS : texture_2d<f32>;
@group(0) @binding(2) var blurL : texture_2d<f32>;
@group(0) @binding(3) var samp  : sampler;
@group(0) @binding(4) var<uniform> sp : Sp;
@fragment
fn fs(in : VSOut) -> @location(0) vec4<f32> {
  var rgb = textureSampleLevel(baseT, samp, in.uv, 0.0).rgb;
  let bs = textureSampleLevel(blurS, samp, in.uv, 0.0).rgb;
  let bl = textureSampleLevel(blurL, samp, in.uv, 0.0).rgb;
  let clarity = sp.v.x; let texture = sp.v.y; let sharp = sp.v.z; let noise = sp.v.w;
  let dehaze = sp.w.x;
  let detailS = rgb - bs;
  let detailL = rgb - bl;
  rgb = mix(rgb, bs, clamp(noise, 0.0, 1.0));        // noise reduction
  rgb = rgb + detailS * (sharp * 2.0);               // sharpening (small radius)
  let lt = dot(detailS, LUMA);
  rgb = rgb + vec3<f32>(lt) * (texture * 1.5);        // texture (luma high-freq)
  let L = dot(rgb, LUMA);
  let mid = 1.0 - min(abs(L - 0.5) * 2.0, 1.0);       // midtone weight (peak at 0.5)
  rgb = rgb + detailL * (clarity * mid);              // clarity (large radius, midtones)
  if (dehaze > 0.0) {
    rgb = rgb + detailL * (dehaze * 0.5);
    rgb = (rgb - vec3<f32>(0.5)) * (1.0 + dehaze * 0.4) + vec3<f32>(0.5);
  }
  return vec4<f32>(clamp(rgb, vec3<f32>(0.0), vec3<f32>(1.0)), 1.0);
}
`

const HIST_WGSL = /* wgsl */ `
@group(0) @binding(0) var img : texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> bins : array<atomic<u32>>;
@compute @workgroup_size(8, 8)
fn cs(@builtin(global_invocation_id) gid : vec3<u32>) {
  let dim = textureDimensions(img);
  if (gid.x >= dim.x || gid.y >= dim.y) { return; }
  let c = textureLoad(img, vec2<i32>(i32(gid.x), i32(gid.y)), 0);
  let r = u32(clamp(c.r, 0.0, 1.0) * 255.0);
  let g = u32(clamp(c.g, 0.0, 1.0) * 255.0);
  let b = u32(clamp(c.b, 0.0, 1.0) * 255.0);
  atomicAdd(&bins[r], 1u);
  atomicAdd(&bins[256u + g], 1u);
  atomicAdd(&bins[512u + b], 1u);
}
`

// Blur kernels: small = sharpen/texture/NR detail, large = clarity/dehaze.
const SMALL = { radius: 3, sigma: 2.0 }
const LARGE = { radius: 10, sigma: 6.0 }

export async function createGpuRenderer(canvas, { onHistogram } = {}) {
  if (typeof navigator === 'undefined' || !navigator.gpu || !canvas) return null

  let adapter
  try {
    adapter = await navigator.gpu.requestAdapter()
  } catch {
    return null
  }
  if (!adapter) return null
  let device
  try {
    device = await adapter.requestDevice()
  } catch {
    return null
  }

  const context = canvas.getContext('webgpu')
  if (!context) {
    device.destroy?.()
    return null
  }
  const format = navigator.gpu.getPreferredCanvasFormat()
  context.configure({ device, format, alphaMode: 'opaque' })

  const HDR = 'rgba16float'
  const baseMod = device.createShaderModule({ code: BASE_WGSL })
  const blurMod = device.createShaderModule({ code: BLUR_WGSL })
  const finalMod = device.createShaderModule({ code: FINAL_WGSL })
  const histMod = device.createShaderModule({ code: HIST_WGSL })

  const basePipe = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: baseMod, entryPoint: 'vs' },
    fragment: { module: baseMod, entryPoint: 'fs', targets: [{ format: HDR }] },
    primitive: { topology: 'triangle-list' },
  })
  const blurPipe = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: blurMod, entryPoint: 'vs' },
    fragment: { module: blurMod, entryPoint: 'fs', targets: [{ format: HDR }] },
    primitive: { topology: 'triangle-list' },
  })
  const finalPipe = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: finalMod, entryPoint: 'vs' },
    fragment: { module: finalMod, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  })
  const histPipe = device.createComputePipeline({
    layout: 'auto',
    compute: { module: histMod, entryPoint: 'cs' },
  })

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })

  const toneBuf = device.createBuffer({ size: 48, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  const spatialBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  const toneData = new Float32Array(12)
  const spatialData = new Float32Array(8)

  // Four static blur uniforms (texel set per image; dir/radius/sigma constant).
  const mkBlurBuf = () => device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  const blurBufs = { sh: mkBlurBuf(), sv: mkBlurBuf(), lh: mkBlurBuf(), lv: mkBlurBuf() }

  const binsBuf = device.createBuffer({
    size: 256 * 3 * 4,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  })
  const histReadBuf = device.createBuffer({
    size: 256 * 3 * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  })
  const zeros = new Uint32Array(256 * 3)

  const mkTarget = (w, h) =>
    device.createTexture({
      size: [w, h],
      format: HDR,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    })

  let srcTex = null
  let baseTex = null
  let tmpTex = null
  let blurSTex = null
  let blurLTex = null
  let bg = null // all bind groups for the current image
  let histBusy = false

  const writeBlur = (buf, w, h, dir, k) => {
    device.queue.writeBuffer(buf, 0, new Float32Array([1 / w, 1 / h, dir[0], dir[1], k.radius, k.sigma, 0, 0]))
  }

  const setImage = ({ data, width, height }) => {
    canvas.width = width
    canvas.height = height
    ;[srcTex, baseTex, tmpTex, blurSTex, blurLTex].forEach((t) => t?.destroy())
    srcTex = device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    device.queue.writeTexture({ texture: srcTex }, data, { bytesPerRow: width * 4, rowsPerImage: height }, [width, height])
    baseTex = mkTarget(width, height)
    tmpTex = mkTarget(width, height)
    blurSTex = mkTarget(width, height)
    blurLTex = mkTarget(width, height)

    writeBlur(blurBufs.sh, width, height, [1, 0], SMALL)
    writeBlur(blurBufs.sv, width, height, [0, 1], SMALL)
    writeBlur(blurBufs.lh, width, height, [1, 0], LARGE)
    writeBlur(blurBufs.lv, width, height, [0, 1], LARGE)

    const tex = (t) => t.createView()
    bg = {
      base: device.createBindGroup({
        layout: basePipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(srcTex) },
          { binding: 1, resource: sampler },
          { binding: 2, resource: { buffer: toneBuf } },
        ],
      }),
      sh: device.createBindGroup({
        layout: blurPipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(baseTex) },
          { binding: 1, resource: sampler },
          { binding: 2, resource: { buffer: blurBufs.sh } },
        ],
      }),
      sv: device.createBindGroup({
        layout: blurPipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(tmpTex) },
          { binding: 1, resource: sampler },
          { binding: 2, resource: { buffer: blurBufs.sv } },
        ],
      }),
      lh: device.createBindGroup({
        layout: blurPipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(baseTex) },
          { binding: 1, resource: sampler },
          { binding: 2, resource: { buffer: blurBufs.lh } },
        ],
      }),
      lv: device.createBindGroup({
        layout: blurPipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(tmpTex) },
          { binding: 1, resource: sampler },
          { binding: 2, resource: { buffer: blurBufs.lv } },
        ],
      }),
      final: device.createBindGroup({
        layout: finalPipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(baseTex) },
          { binding: 1, resource: tex(blurSTex) },
          { binding: 2, resource: tex(blurLTex) },
          { binding: 3, resource: sampler },
          { binding: 4, resource: { buffer: spatialBuf } },
        ],
      }),
      hist: device.createBindGroup({
        layout: histPipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: tex(baseTex) },
          { binding: 1, resource: { buffer: binsBuf } },
        ],
      }),
    }
  }

  const colorAttach = (view) => ({
    colorAttachments: [{ view, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }],
  })

  const render = (adj) => {
    if (!bg) return
    toneData[0] = Math.pow(2, adj.exposure)
    toneData[1] = adj.contrast / 100
    toneData[2] = (adj.temp / 100) * 0.4
    toneData[3] = (adj.tint / 100) * 0.4
    toneData[4] = adj.highlights / 100
    toneData[5] = adj.shadows / 100
    toneData[6] = adj.whites / 100
    toneData[7] = adj.blacks / 100
    toneData[8] = adj.vibrance / 100
    toneData[9] = adj.saturation / 100
    device.queue.writeBuffer(toneBuf, 0, toneData)

    spatialData[0] = adj.clarity / 100
    spatialData[1] = adj.texture / 100
    spatialData[2] = adj.sharpness / 100
    spatialData[3] = adj.noise / 100
    spatialData[4] = adj.dehaze / 100
    device.queue.writeBuffer(spatialBuf, 0, spatialData)

    const enc = device.createCommandEncoder()
    const draw = (pipe, group, view) => {
      const p = enc.beginRenderPass(colorAttach(view))
      p.setPipeline(pipe)
      p.setBindGroup(0, group)
      p.draw(3)
      p.end()
    }
    draw(basePipe, bg.base, baseTex.createView())
    draw(blurPipe, bg.sh, tmpTex.createView())
    draw(blurPipe, bg.sv, blurSTex.createView())
    draw(blurPipe, bg.lh, tmpTex.createView())
    draw(blurPipe, bg.lv, blurLTex.createView())
    draw(finalPipe, bg.final, context.getCurrentTexture().createView())

    const runHist = onHistogram && !histBusy
    if (runHist) {
      device.queue.writeBuffer(binsBuf, 0, zeros)
      const cp = enc.beginComputePass()
      cp.setPipeline(histPipe)
      cp.setBindGroup(0, bg.hist)
      cp.dispatchWorkgroups(Math.ceil(canvas.width / 8), Math.ceil(canvas.height / 8))
      cp.end()
      enc.copyBufferToBuffer(binsBuf, 0, histReadBuf, 0, zeros.byteLength)
    }
    device.queue.submit([enc.finish()])

    if (runHist) {
      histBusy = true
      histReadBuf
        .mapAsync(GPUMapMode.READ)
        .then(() => {
          const bins = new Uint32Array(histReadBuf.getMappedRange().slice(0))
          histReadBuf.unmap()
          histBusy = false
          onHistogram(bins)
        })
        .catch(() => {
          histBusy = false
        })
    }
  }

  // Render the full pipeline (incl. spatial ops) and read it back as a blob.
  // Used by batch with an OffscreenCanvas; waits for the GPU before reading.
  const exportBlob = async (adj, type = 'image/jpeg', quality = 0.92) => {
    render(adj)
    await device.queue.onSubmittedWorkDone()
    if (typeof canvas.convertToBlob === 'function') return canvas.convertToBlob({ type, quality })
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  }

  const destroy = () => {
    ;[srcTex, baseTex, tmpTex, blurSTex, blurLTex].forEach((t) => t?.destroy())
    ;[toneBuf, spatialBuf, blurBufs.sh, blurBufs.sv, blurBufs.lh, blurBufs.lv, binsBuf, histReadBuf].forEach((b) =>
      b?.destroy(),
    )
    device.destroy?.()
  }

  return { setImage, render, exportBlob, destroy }
}
