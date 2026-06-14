/**
 * Section — labeled control group for inspector/editor panels.
 *
 * A small-caps label above a vertical content stack. Used across the editor
 * inspector panels (palette / pattern / type modes): `<Section label="Aspect">…</Section>`.
 */
export default function Section({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <p className="kol-helper-10 uppercase tracking-widest text-meta">{label}</p>
      )}
      {children}
    </div>
  )
}
