import { useNavigate } from 'react-router-dom'
import { useCatalog } from './CatalogContext.jsx'

/* Filmstrip — the persistent horizontal catalog strip along the bottom of every
 * module (Lightroom's connective tissue). Click a frame to select it; a frame
 * double-click jumps into Develop with it. Selection is shared app-wide via the
 * catalog context, so grid ↔ filmstrip ↔ loupe all stay in sync. */

function Frame({ img, active, onSelect, onOpen }) {
  const u = img.cdn_url
  const url = typeof u === 'string' && (u.startsWith('http') || u.startsWith('blob:')) ? u : null
  return (
    <button
      onClick={onSelect}
      onDoubleClick={onOpen}
      title={img.filename}
      className={`group relative shrink-0 h-[78px] w-[104px] overflow-hidden rounded-sm border-2 transition-all ${
        active ? 'border-white' : 'border-transparent opacity-65 hover:opacity-100'
      }`}
    >
      {url ? (
        <img src={url} alt={img.filename} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-fg-08 kol-helper-10 text-meta">—</div>
      )}
    </button>
  )
}

export default function Filmstrip() {
  const { images, status, selectedId, setSelectedId, setEditTarget } = useCatalog()
  const navigate = useNavigate()

  if (status === 'unconfigured') return null

  return (
    <div className="flex h-[100px] shrink-0 items-center gap-1.5 overflow-x-auto border-t border-fg-08 bg-black/40 px-3">
      {status === 'loading' && (
        <span className="px-2 kol-helper-10 uppercase text-meta">Loading catalog…</span>
      )}
      {status === 'ready' && images.length === 0 && (
        <span className="px-2 kol-helper-10 uppercase text-meta">No images yet</span>
      )}
      {images.map((img) => (
        <Frame
          key={img.id}
          img={img}
          active={img.id === selectedId}
          onSelect={() => setSelectedId(img.id)}
          onOpen={() => {
            setSelectedId(img.id)
            setEditTarget?.(img)
            navigate('/develop')
          }}
        />
      ))}
    </div>
  )
}
