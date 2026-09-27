import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { forwardRef, useRef } from 'react'
import { COMPRESSED_LINES, COMPRESS_GAP, COLUMNS } from './gridLayout'
import { DEPTH } from './parallax'

// 15% ink flattened over --color-signal (washed purple): opaque, so it matches the page-wide line layer exactly.
const LINE_ON_RED = '#7a5f80'

// The grid band narrows by this share of the viewport width as the next (beige) section scrolls in.
const TIGHTEN_VW = 8
const BAND_VW = (COLUMNS - 1) * COMPRESS_GAP // span between the first and last line
const SCALE = (BAND_VW - TIGHTEN_VW) / BAND_VW
const CENTER_VW = COMPRESSED_LINES[0] + BAND_VW / 2

// `left` stays static; the movement is a translateX, so tightening the band never triggers layout.
function GridLine({ left, progress }: { left: number; progress: MotionValue<number> }) {
  const x = useTransform(progress, [0, 1], ['0vw', `${(CENTER_VW + (left - CENTER_VW) * SCALE - left).toFixed(3)}vw`])
  return (
    <motion.div
      className="absolute inset-y-0 w-px will-change-transform"
      style={{ left: `${left}vw`, x, backgroundColor: LINE_ON_RED }}
    />
  )
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

// Entry windows, as shares of the section's entry (0 = top edge at the viewport bottom, 1 = locked at the top).
// Short windows (0.4 each, vs 0.85 originally), so the rise itself is about twice as fast. They start late on
// purpose: the lines stay below the viewport until the previous section's heading has fully left (≈538vh of
// page scroll), keeping the two headings from ever being on screen together.
const FIRST_RISE: [number, number] = [0.35, 0.75]
const SECOND_RISE: [number, number] = [0.45, 0.85]
// Rise offset still to travel at progress p within a window: quadratic ease-out, so each line's extra speed
// over its section tapers to exactly zero as it settles — no velocity jump where the rise hands over to the
// section's own motion.
const riseLeft = (p: number, [from, to]: [number, number]) => (1 - clamp01((p - from) / (to - from))) ** 2

const LINE_CLASS = 'block text-[10.4vw] font-semibold leading-[0.95] tracking-tight'

// Continues the red stage directly below it: same red, same compressed grid, then a two-line statement whose
// second line is stepped to the right. Opaque, so it also hides the page-wide fixed grid layer and draws its own.
// Its arrival is scroll-jacked (data-scroll-lock): a downward scroll at the end of the stage above triggers a
// locked, speed-ramped glide that lifts this section into view while its lines rise into their resting places.
export const RedStatement = forwardRef<HTMLElement>((_props, forwardedRef) => {
  const internalRef = useRef<HTMLElement>(null)

  // Assign the forwarded ref to the internal ref
  if (forwardedRef) {
    if (typeof forwardedRef === 'function') {
      forwardedRef(internalRef.current)
    } else {
      forwardedRef.current = internalRef.current
    }
  }

  const reduceMotion = useReducedMotion()
  // 0 when the section's top edge enters at the bottom of the viewport, 1 when it locks at the top.
  const { scrollYProgress } = useScroll({ target: internalRef, offset: ['start end', 'start start'] })

  const riseVh = reduceMotion ? 0 : 70
  // 0 when this section's bottom edge reaches the viewport bottom, 1 once it has scrolled out: the beige section arrives over this span.
  const { scrollYProgress: exitProgress } = useScroll({ target: internalRef, offset: ['end end', 'end start'] })

  // Entry: each line rises from below on overlapping, compressed windows (FIRST_RISE / SECOND_RISE), riding the
  // programmatic speed-ramp glide (data-scroll-lock, see SmoothScroll.tsx).
  // Exit (parallax depth): as the beige section slides over, the first line lags furthest behind and the
  // stepped second line less, so the two lines separate in depth. Both are 0 under reduced motion.
  const firstDrift = reduceMotion ? 0 : DEPTH.heading
  const secondDrift = reduceMotion ? 0 : DEPTH.stepped
  const firstY = useTransform(
    [scrollYProgress, exitProgress],
    ([enter, exit]: number[]) => `${riseVh * riseLeft(enter, FIRST_RISE) + firstDrift * exit}vh`,
  )
  const secondY = useTransform(
    [scrollYProgress, exitProgress],
    ([enter, exit]: number[]) => `${riseVh * riseLeft(enter, SECOND_RISE) + secondDrift * exit}vh`,
  )

  return (
    <section
      ref={internalRef}
      data-snap="start"
      data-scroll-lock
      className="relative z-20 flex min-h-dvh items-center overflow-hidden bg-signal pb-16"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {COMPRESSED_LINES.map((left) => (
          <GridLine key={left} left={left} progress={exitProgress} />
        ))}
      </div>

      <h2 className="relative w-full text-[#231e25]">
        <span className="sr-only">It doesn’t have to be…</span>
        <motion.span aria-hidden className={`${LINE_CLASS} ml-[13vw] will-change-transform`} style={{ y: firstY }}>
          It doesn’t
        </motion.span>
        <motion.span aria-hidden className={`${LINE_CLASS} ml-[36.5vw] will-change-transform`} style={{ y: secondY }}>
          have to be…
        </motion.span>
      </h2>
    </section>
  )
})
