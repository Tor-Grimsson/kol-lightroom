import { Children, useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'

export default function Carousel({ children, options = { align: 'start', loop: false, dragFree: true, containScroll: 'trimSnaps' }, className = '' }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback((api) => {
    setCanPrev(api.canScrollPrev())
    setCanNext(api.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const slides = Children.toArray(children)

  return (
    <div className={`kol-embla ${className}`.trim()}>
      <div className="kol-embla-viewport" ref={emblaRef}>
        <div className="kol-embla-container">
          {slides.map((child, i) => (
            <div key={i} className="kol-embla-slide">{child}</div>
          ))}
        </div>
      </div>
      <div className="kol-embla-controls">
        <button
          type="button"
          className="kol-embla-btn border border-fg-16 hover:border-fg-32 text-auto"
          aria-label="Previous"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
        >‹</button>
        <button
          type="button"
          className="kol-embla-btn border border-fg-16 hover:border-fg-32 text-auto"
          aria-label="Next"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
        >›</button>
      </div>
    </div>
  )
}
