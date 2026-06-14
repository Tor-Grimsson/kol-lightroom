import { useEffect, useRef, useState } from 'react'

/**
 * Tracks which section id is currently in view. Borrowed pattern from vcap:
 * IntersectionObserver with an edge-lock so first/last sections stay active
 * when the user reaches the top/bottom of the page.
 */
export default function useScrollSpy(ids, { rootMargin = '-30% 0px -60% 0px', edgeOffset = 100 } = {}) {
  const [activeId, setActiveId] = useState(null)
  const edgeLockRef = useRef(null)
  const key = ids.join(',')

  useEffect(() => {
    if (!ids.length) { setActiveId(null); return }
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!elements.length) return

    const checkEdges = () => {
      const atTop = window.scrollY < edgeOffset
      const atBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - edgeOffset * 0.8
      if (atTop) {
        edgeLockRef.current = 'top'
        setActiveId(null)
      } else if (atBottom) {
        edgeLockRef.current = 'bottom'
        setActiveId(ids[ids.length - 1])
      } else {
        edgeLockRef.current = null
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (edgeLockRef.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      { rootMargin, threshold: 0 },
    )

    elements.forEach((el) => observer.observe(el))
    window.addEventListener('scroll', checkEdges, { passive: true })
    checkEdges()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', checkEdges)
    }
  }, [key, rootMargin, edgeOffset])

  return activeId
}
