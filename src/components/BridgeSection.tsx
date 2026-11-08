import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { FLOW_BG, flowGrid } from './flowField'

// The hand-off between SquareShare (SquareShareSection) and RootFlow (FeatureStack): one long, quiet stretch of
// RootFlow's navy, with a single line of copy floating in the middle. SquareShare's light panel ends above it on a
// pixel seam (PixelSeam edge="out") where this navy rises into the light as squares, so the section starts solid
// navy, and it ends as RootFlow's stage field, exactly where the stage begins.
//
//   - Base: RootFlow's navy, plus the stage's top-right royal glow carried up from the bottom edge.
//   - Grid: the stage's blueprint grid, its lines measured from the bottom edge so they run straight on into the
//     stage's, rising out of nothing over the bottom half.
//   - Glow: a violet bloom (SquareShare's accent) above a wide royal-blue one (RootFlow) behind the heading, in the
//     order the page runs, rising and falling with scroll so it peaks while the heading is centred.
//
// The section is 180svh. A snap marker 40svh in makes a finished gesture rest with the heading dead centre, so the
// wheel crosses it in two even glides (dashboard → heading → RootFlow) instead of skipping it.

const SECTION_HEIGHT = 180 // svh: fixed, so the page below never shifts as a phone's toolbar collapses
const REST_OFFSET = (SECTION_HEIGHT - 100) / 2 // svh: where the viewport's top sits when the heading is centred

// The stage's top-right glow (FeatureStack's FIELD: 70% of the width by 80% of its 100dvh height, centred on its
// top-right corner), re-centred on this section's bottom-right corner so it carries on up across the seam.
const STAGE_GLOW =
  'radial-gradient(70% 80dvh at 100% 100%, rgba(26,62,150,0.55) 0%, rgba(20,44,112,0.22) 40%, transparent 72%)'
const BASE = `${STAGE_GLOW}, ${FLOW_BG}`

// Shifted by the section's height, so the lines sit where the stage's do at its top edge.
const GRID = flowGrid(`${SECTION_HEIGHT}svh`).join(', ')
const GRID_MASK =
  'linear-gradient(to top, #000 5%, rgba(0,0,0,0.87) 15%, rgba(0,0,0,0.58) 25%, rgba(0,0,0,0.26) 35%, rgba(0,0,0,0.03) 45%, transparent 50%)'

const GLOW = [
  'radial-gradient(60% 34% at 50% 56%, rgba(26,62,150,0.22), transparent 70%)',
  'radial-gradient(46% 28% at 50% 45%, rgba(168,85,247,0.11), transparent 70%)',
].join(', ')

const WORDS = ["You", 'know', "what's", 'also', 'cool?']
const EASE = [0.22, 1, 0.36, 1] as const // the site's entrance ease
const WORD_SECONDS = 1.1
const WORD_STAGGER = 0.08

export function BridgeSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const still = useReducedMotion() ?? false

  // 0 → 1 from the section's top entering to its bottom leaving; 0.5 is the resting point (heading centred).
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const glow = useTransform(scrollYProgress, [0.18, 0.5, 0.82], [0, 1, 0])

  // Words rise in once the heading clears the bottom quarter of the viewport, so the reveal plays while the glide
  // carrying it to centre is still settling.
  const inView = useInView(headingRef, { once: true, margin: '0px 0px -25% 0px' })
  const reveal = still || inView

  return (
    <section
      ref={sectionRef}
      className="relative z-20 flex items-center justify-center overflow-hidden px-6 font-geist text-paper"
      style={{ height: `${SECTION_HEIGHT}svh`, background: BASE }}
    >
      <div
        aria-hidden
        data-snap="start"
        className="pointer-events-none absolute inset-x-0 h-px"
        style={{ top: `${REST_OFFSET}svh` }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: GRID, maskImage: GRID_MASK, WebkitMaskImage: GRID_MASK }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: GLOW, opacity: still ? 1 : glow }}
      />

      <h2
        ref={headingRef}
        className="relative max-w-[14ch] text-balance text-center text-[clamp(2.5rem,5.4vw,5.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] md:max-w-none"
      >
        {WORDS.map((word, i) => (
          <span key={word}>
            <motion.span
              className="inline-block will-change-transform"
              initial={still ? false : { opacity: 0, y: '0.45em', filter: 'blur(10px)' }}
              animate={reveal ? { opacity: 1, y: '0em', filter: 'blur(0px)' } : undefined}
              transition={{ duration: WORD_SECONDS, delay: i * WORD_STAGGER, ease: EASE }}
            >
              {word}
            </motion.span>
            {i < WORDS.length - 1 && ' '}
          </span>
        ))}
      </h2>
    </section>
  )
}
