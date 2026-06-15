/* Local image store — IndexedDB. The "local storage" publish target: image
 * bytes (a Blob) + metadata + the edit op-stack live in the browser, on this
 * machine only. Private, free, offline; NOT shared and NOT on the deployed site
 * (that's the trade vs the cloud targets). Rows expose a blob: URL as `cdn_url`
 * so the rest of the app (filmstrip, grid, loupe, round-trip) treats them the
 * same as cloud rows. */

const DB = 'kol-lightroom'
const STORE = 'images'

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function uid() {
  try {
    return crypto.randomUUID()
  } catch {
    return `l${Math.random().toString(36).slice(2)}`
  }
}

export async function saveLocalImage({ blob, filename, meta = {}, edit = {}, tags = [] }) {
  const db = await open()
  const row = {
    id: uid(),
    created_at: new Date().toISOString(),
    filename,
    blob,
    bytes: blob.size,
    width: meta.width ?? null,
    height: meta.height ?? null,
    camera: meta.camera ?? null,
    lens: meta.lens ?? null,
    iso: meta.iso ?? null,
    shutter: meta.shutter ?? null,
    aperture: meta.aperture ?? null,
    focal_len: meta.focal_len ?? null,
    shot_at: meta.shot_at ?? null,
    edit,
    tags,
  }
  await tx(db, 'readwrite', (s) => s.put(row))
  return row
}

export async function listLocalImages() {
  const db = await open()
  const rows = await tx(db, 'readonly', (s) => s.getAll())
  return (rows || [])
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((r) => ({ ...r, cdn_url: r.blob ? URL.createObjectURL(r.blob) : null }))
}

export async function deleteLocalImage(id) {
  const db = await open()
  await tx(db, 'readwrite', (s) => s.delete(id))
}
