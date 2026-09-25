import { useReducedMotion, useTransform, type MotionValue } from 'framer-motion'

// Parallax depth for the page. Sections scroll at 1:1; content inside a section can lag behind it as the
// section leaves the viewport, so the next section (painted later, on top) slides over it. A layer drifting
// down by D vh while its section scrolls up one viewport effectively moves at (100 − D)% of scroll speed:
// the larger the drift, the "further away" the layer reads.
//
// Every value here is a translateY in vh — compositor-only, no layout — and is 0 under reduced motion.

/** Rate presets (vh of drift over one viewport of section exit). */
export const DEPTH = {
  /** Primary headline: clearly behind the incoming section, still readable as it goes. */
  heading: 40,
  /** Secondary copy: slightly deeper than its headline, so the two separate as they leave. */
  secondary: 55,
  /** Second line of a stepped headline: between foreground and the first line. */
  stepped: 22,
} as const

/** translateY that lags a layer behind its section while `exit` runs 0 → 1. */
export function useDepthDrift(exit: MotionValue<number>, driftVh: number) {
  const still = useReducedMotion() ?? false
  return useTransform(exit, [0, 1], ['0vh', `${still ? 0 : driftVh}vh`])
}
