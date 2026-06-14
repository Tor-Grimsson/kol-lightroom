import { useEffect } from 'react'

/**
 * Observes all elements with [data-reveal] inside a ref'd container,
 * adds `.is-revealed` when each scrolls into view.
 */
export default function useReveal(ref) {
  useEffect(() => {
    const root = ref?.current ?? document
    const nodes = root.querySelectorAll('[data-reveal]')
    if (!nodes.length) return

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-revealed')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    )

    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [ref])
}
