import { useEffect, type RefObject } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/**
 * The scroll-in entrance, driven by a data attribute so it costs no renders. An element still below the fold gets
 * data-ss-state="armed" (hidden by the stylesheet), then "play" once enough of it scrolls in. The initial markup
 * carries no state, so without JavaScript, under reduced motion, or when the element is already on screen at load,
 * everything just stays visible.
 */
export function useEntrance(ref: RefObject<HTMLElement | null>, threshold = 0.25): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia(REDUCED_MOTION).matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.dataset.ssState = 'armed'
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.ssState = 'play'
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      delete el.dataset.ssState
    }
  }, [ref, threshold])
}

/** Plays an entrance again from the start. */
export function replayEntrance(el: HTMLElement): void {
  el.dataset.ssState = 'armed'
  // Reading layout flushes the "armed" styles, so the animation restarts.
  el.getBoundingClientRect()
  el.dataset.ssState = 'play'
}
