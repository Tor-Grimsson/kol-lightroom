import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'
import { listLocalImages } from './localStore.js'

/* CatalogContext — the single source of truth for the image catalog across the
 * whole app (Library grid, Develop, the Filmstrip). Loads the `images` rows
 * once, holds the current selection, and exposes a reload (e.g. after a
 * publish). URLs are normalized here so the paste-damage guard lives in one
 * place. */

const CatalogCtx = createContext(null)
export const useCatalog = () => useContext(CatalogCtx)

// URLs can't hold whitespace; strip any that crept in (SQL-editor line wraps).
const normalize = (r) => ({
  ...r,
  cdn_url: typeof r.cdn_url === 'string' ? r.cdn_url.replace(/\s+/g, '') : r.cdn_url,
})

export function CatalogProvider({ children }) {
  const [images, setImages] = useState([])
  const [status, setStatus] = useState(supabaseConfigured ? 'loading' : 'unconfigured')
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [editTarget, setEditTarget] = useState(null) // a catalog image to open in Develop
  const [source, setSource] = useState('cloud') // 'cloud' (Supabase) | 'local' (IndexedDB)

  const apply = useCallback((rows) => {
    setImages(rows)
    setStatus('ready')
    setSelectedId((cur) => (rows.some((r) => r.id === cur) ? cur : rows[0]?.id ?? null))
  }, [])

  const reload = useCallback(async () => {
    setError(null)
    if (source === 'local') {
      setStatus('loading')
      apply(await listLocalImages())
      return
    }
    if (!supabase) {
      setStatus('unconfigured')
      return
    }
    setStatus('loading')
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
      setStatus('error')
      return
    }
    apply((data || []).map(normalize))
  }, [source, apply])

  useEffect(() => {
    reload()
  }, [reload])

  const selected = images.find((i) => i.id === selectedId) || null

  return (
    <CatalogCtx.Provider
      value={{ images, status, error, selectedId, setSelectedId, selected, reload, editTarget, setEditTarget, source, setSource }}
    >
      {children}
    </CatalogCtx.Provider>
  )
}
