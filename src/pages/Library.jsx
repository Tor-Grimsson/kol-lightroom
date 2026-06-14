import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'
import Input from '../components/atoms/Input.jsx'
import Tag from '../components/molecules/Tag.jsx'

/* Library — the image catalog (publish pipeline, parallel to the editor).
 * One card per row in the Supabase `images` table; bytes live in B2 (ARCH §5).
 * Filter by text + tag; each row carries the editor's parametric edit so a
 * future "open in develop" can restore it non-destructively. */

export default function Library() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState(supabaseConfigured ? 'loading' : 'unconfigured')
  const [err, setErr] = useState(null)
  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState(null)

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (error) {
        setErr(error.message)
        setStatus('error')
        return
      }
      setRows(data || [])
      setStatus('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const allTags = useMemo(() => {
    const s = new Set()
    rows.forEach((r) => (r.tags || []).forEach((t) => s.add(t)))
    return [...s].sort()
  }, [rows])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (activeTag && !(r.tags || []).includes(activeTag)) return false
      if (!needle) return true
      return [r.filename, r.camera, r.lens, ...(r.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [rows, q, activeTag])

  return (
    <main className="p-8 md:p-12 max-w-6xl">
      <p className="kol-helper-12 text-meta uppercase mb-2">kol-lightroom · library</p>
      <h1 className="kol-sans-display-01 text-emphasis mb-4">Image library</h1>
      <p className="kol-sans-body-01 text-body max-w-prose mb-8">
        The catalog — one entry per published image. Bytes live in the kolkrabbi B2 bucket;
        these rows hold the capture metadata and the editor's parametric edit.
      </p>

      {status === 'unconfigured' && (
        <div className="rounded-lg border border-dashed border-fg-16 p-8 text-center">
          <p className="kol-sans-body-01 text-body">Supabase isn't configured.</p>
          <p className="kol-mono-12 text-meta mt-2">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
          </p>
        </div>
      )}
      {status === 'error' && (
        <p className="kol-mono-14 text-[var(--kol-color-red-400)]">Failed to load: {err}</p>
      )}

      {status !== 'unconfigured' && status !== 'error' && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Input
              variant="filled"
              size="sm"
              width="240px"
              placeholder="Search filename, camera, tag…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {allTags.map((t) => (
              <Tag
                key={t}
                active={activeTag === t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
              >
                {t}
              </Tag>
            ))}
          </div>

          {status === 'ready' && filtered.length === 0 && (
            <p className="kol-mono-12 text-meta">
              {rows.length ? 'No images match the filter.' : 'No images yet — run scripts/ingest.mjs.'}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((r) => {
              const hasImg = typeof r.cdn_url === 'string' && r.cdn_url.startsWith('http')
              return (
                <a
                  key={r.id}
                  href={hasImg ? r.cdn_url : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col rounded-lg overflow-hidden border border-fg-08 bg-fg-04"
                >
                  <div className="aspect-[3/2] overflow-hidden bg-fg-04">
                    {hasImg ? (
                      <img
                        src={r.cdn_url}
                        alt={r.filename}
                        loading="lazy"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center kol-helper-10 text-meta uppercase">
                        no preview
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 flex flex-col gap-1">
                    <span className="kol-mono-12 text-emphasis truncate">{r.filename}</span>
                    <span className="kol-helper-10 text-meta uppercase truncate">
                      {[r.camera, r.iso ? `ISO ${r.iso}` : null].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
