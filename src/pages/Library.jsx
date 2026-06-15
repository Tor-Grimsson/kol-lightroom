import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalog } from '../app/CatalogContext.jsx'
import Input from '../components/atoms/Input.jsx'
import Tag from '../components/molecules/Tag.jsx'
import Button from '../components/atoms/Button.jsx'

/* Library module — Grid + Loupe (the image viewer), Lightroom-style.
 *   Grid (G):  catalog thumbnails. Click selects, double-click opens Loupe.
 *   Loupe (E): one big image + metadata; arrows move through the catalog.
 *   D:         jump to Develop with the selection. */

// Usable image URL — http(s) (cloud) or blob: (local IndexedDB).
const httpUrl = (r) => {
  const u = r?.cdn_url
  return typeof u === 'string' && (u.startsWith('http') || u.startsWith('blob:')) ? u : null
}
const fmtShutter = (s) => (!s || s <= 0 ? null : s >= 1 ? `${s.toFixed(1)}s` : `1/${Math.round(1 / s)}s`)

export default function Library({ active = true }) {
  const { images, status, error, selectedId, setSelectedId, selected, setEditTarget, source, setSource } = useCatalog()
  const navigate = useNavigate()
  const openInDevelop = useCallback(
    (img) => {
      if (img) setEditTarget?.(img)
      navigate('/develop')
    },
    [setEditTarget, navigate],
  )
  const [view, setView] = useState('grid') // 'grid' | 'loupe'
  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [thumb, setThumb] = useState(190) // grid thumbnail size (px)

  const allTags = useMemo(() => {
    const s = new Set()
    images.forEach((r) => (r.tags || []).forEach((t) => s.add(t)))
    return [...s].sort()
  }, [images])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return images.filter((r) => {
      if (activeTag && !(r.tags || []).includes(activeTag)) return false
      if (!needle) return true
      return [r.filename, r.camera, r.lens, ...(r.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [images, q, activeTag])

  // Move selection through the filtered set (loupe arrows + grid).
  const step = useCallback(
    (dir) => {
      const list = filtered.length ? filtered : images
      if (!list.length) return
      const i = Math.max(0, list.findIndex((r) => r.id === selectedId))
      setSelectedId(list[(i + dir + list.length) % list.length].id)
    },
    [filtered, images, selectedId, setSelectedId],
  )

  // Keyboard: G grid · E/Enter loupe · ←/→ navigate · D develop. Ignore while typing.
  useEffect(() => {
    const onKey = (e) => {
      if (!active) return
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'g' || e.key === 'G') setView('grid')
      else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') setView('loupe')
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key === 'd' || e.key === 'D') openInDevelop(selected)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, openInDevelop, selected, active])

  if (status === 'unconfigured') {
    return (
      <div className="flex h-full items-center justify-center p-12 text-center">
        <div>
          <p className="kol-sans-body-01 text-body">Supabase isn't configured.</p>
          <p className="mt-2 kol-mono-12 text-meta">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-fg-08 px-4 py-2.5">
        <div className="flex overflow-hidden rounded border border-fg-08" title="Storage source">
          {['cloud', 'local'].map((s) => (
            <button
              key={s}
              onClick={() => setSource?.(s)}
              className={`px-2.5 py-1 kol-mono-12 uppercase transition-colors ${
                source === s ? 'bg-fg-08 text-emphasis' : 'text-meta hover:text-body'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Input
          variant="filled"
          size="sm"
          width="220px"
          placeholder="Search filename, camera, tag…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {allTags.map((t) => (
            <Tag key={t} active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)}>
              {t}
            </Tag>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {view === 'grid' && (
            <input
              type="range"
              min={120}
              max={340}
              value={thumb}
              onChange={(e) => setThumb(+e.target.value)}
              className="slider-black w-24 cursor-pointer"
              title="Thumbnail size"
            />
          )}
          <span className="kol-mono-12 text-meta">{filtered.length} photos</span>
          <div className="flex overflow-hidden rounded border border-fg-08">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              iconLeft="grid"
              onClick={() => setView('grid')}
              title="Grid (G)"
            />
            <Button
              variant={view === 'loupe' ? 'secondary' : 'ghost'}
              size="sm"
              iconLeft="image"
              onClick={() => setView('loupe')}
              title="Loupe (E)"
            />
          </div>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {status === 'error' && (
          <p className="p-4 kol-mono-14 text-[var(--kol-color-red-400)]">Failed to load: {error}</p>
        )}

        {view === 'grid' ? (
          <div className="h-full overflow-auto p-4">
            {status === 'ready' && filtered.length === 0 && (
              <p className="kol-mono-12 text-meta">
                {images.length ? 'No images match the filter.' : 'No images yet — publish one from Develop.'}
              </p>
            )}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumb}px, 1fr))` }}
            >
              {filtered.map((r) => {
                const url = httpUrl(r)
                const active = r.id === selectedId
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    onDoubleClick={() => {
                      setSelectedId(r.id)
                      setView('loupe')
                    }}
                    title={`${r.filename} — double-click to view`}
                    className={`group flex flex-col overflow-hidden rounded-md border-2 bg-fg-04 text-left transition-all ${
                      active ? 'border-white' : 'border-transparent hover:border-fg-24'
                    }`}
                  >
                    <div className="aspect-[3/2] overflow-hidden bg-fg-04">
                      {url ? (
                        <img
                          src={url}
                          alt={r.filename}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center kol-helper-10 uppercase text-meta">
                          no preview
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 px-2.5 py-1.5">
                      <span className="truncate kol-mono-12 text-emphasis">{r.filename}</span>
                      <span className="truncate kol-helper-10 uppercase text-meta">
                        {[r.camera, r.iso ? `ISO ${r.iso}` : null].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <Loupe image={selected} onDevelop={() => openInDevelop(selected)} onStep={step} />
        )}
      </div>
    </div>
  )
}

/* Loupe — single-image viewer with a metadata panel. */
function Loupe({ image, onDevelop, onStep }) {
  if (!image) {
    return (
      <div className="flex h-full items-center justify-center kol-helper-12 uppercase text-meta">
        No selection
      </div>
    )
  }
  const url = httpUrl(image)
  const edit = image.edit && typeof image.edit === 'object' ? Object.entries(image.edit) : []
  return (
    <div className="flex h-full">
      {/* stage */}
      <div className="relative flex min-w-0 flex-1 items-center justify-center bg-black p-4">
        {url ? (
          <img src={url} alt={image.filename} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="kol-helper-12 uppercase text-meta">no preview</span>
        )}
        <button
          onClick={() => onStep(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 kol-mono-14 text-body hover:bg-black/70"
          title="Previous (←)"
        >
          ‹
        </button>
        <button
          onClick={() => onStep(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 kol-mono-14 text-body hover:bg-black/70"
          title="Next (→)"
        >
          ›
        </button>
      </div>

      {/* info */}
      <aside className="hidden w-[260px] shrink-0 flex-col gap-4 overflow-auto border-l border-fg-08 p-4 lg:flex">
        <div className="flex flex-col gap-1">
          <span className="kol-mono-12 text-emphasis break-words">{image.filename}</span>
          <span className="kol-helper-10 uppercase text-meta">
            {image.width && image.height ? `${image.width}×${image.height}` : ''}
          </span>
        </div>
        <Meta k="Camera" v={[image.camera, image.lens].filter(Boolean).join(' · ')} />
        <Meta
          k="Exposure"
          v={[fmtShutter(image.shutter), image.aperture && `f/${image.aperture}`, image.iso && `ISO ${image.iso}`, image.focal_len && `${image.focal_len}mm`]
            .filter(Boolean)
            .join(' · ')}
        />
        <Meta k="Shot" v={image.shot_at ? new Date(image.shot_at).toLocaleString() : null} />
        {(image.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.tags.map((t) => (
              <Tag key={t} size="sm">
                {t}
              </Tag>
            ))}
          </div>
        )}
        {edit.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="kol-helper-10 uppercase tracking-widest text-meta">Edit</span>
            <div className="kol-mono-12 text-body">
              {edit.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-meta">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <Button variant="primary" size="sm" iconLeft="image" onClick={onDevelop} className="mt-auto">
          Open in Develop
        </Button>
      </aside>
    </div>
  )
}

function Meta({ k, v }) {
  if (!v) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="kol-helper-10 uppercase tracking-widest text-meta">{k}</span>
      <span className="kol-mono-12 text-body break-words">{v}</span>
    </div>
  )
}
