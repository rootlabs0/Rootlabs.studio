import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Fragment, useRef } from 'react'

// Same grid line tone as the hero (--color-line), so the grid reads as continuing onto the dark section.
const LINE_ON_INK = '#232324'

// The statement, line by line. Each word is its own span so the gaps can breathe without touching layout.
const STATEMENT = [
  ['Rootlabs', 'exists', 'to'],
  ['make', 'the', 'hard'],
  ['stuff', 'easy'],
]

// Heading motion over the section's whole pass through the viewport (`pass`: 0 = section top at the viewport
// bottom, 0.5 = section locked at the top — its resting, as-designed state — 1 = section scrolled out).
// Everything is 0 / 1 at 0.5, so wherever snapping lands the section, the heading looks exactly as laid out.
const PASS_DRIFT_VH = 50 // total y travel: the heading moves at ~75% of scroll speed (a layer deeper than the page)
const PASS_SCALE = 0.08 // total scale travel: 1.04 on the way in → 1 at rest → 0.96 on the way out
// Extra space per word gap (vw). Wide as it arrives and tightening into place, then gently drawn in as it
// leaves. Ease-out into rest and ease-in out of it, so the gap's rate of change is zero at rest (no kink).
const GAP_IN_VW = 1.4
const GAP_OUT_VW = -0.45

function BreathingWord({ word, index, gap }: { word: string; index: number; gap: MotionValue<number> }) {
  // Word n in a line shifts by n gaps, which widens or narrows every gap in the line equally.
  const x = useTransform(gap, (g) => `${(g * index).toFixed(3)}vw`)
  return (
    <motion.span className="inline-block will-change-transform" style={{ x }}>
      {word}
    </motion.span>
  )
}

// Dark editorial section after the purple statement: a single centred grid line continues in the hero's line tone, an
// About pill and a three-line statement sit on the first grid line.
export function AboutSection() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  // Parallax depth + breathing across the whole pass (see PASS_* / GAP_* above). All transforms.
  const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const motionScale = reduceMotion ? 0 : 1
  const statementY = useTransform(pass, (p) => `${motionScale * PASS_DRIFT_VH * (p - 0.5)}vh`)
  const statementScale = useTransform(pass, (p) => 1 - motionScale * PASS_SCALE * (p - 0.5))
  const wordGap = useTransform(pass, (p) => {
    if (reduceMotion) return 0
    if (p <= 0.5) return GAP_IN_VW * (1 - p / 0.5) ** 2 // ease-out into rest
    return GAP_OUT_VW * ((p - 0.5) / 0.5) ** 2 // ease-in away from rest
  })

  return (
    <section ref={ref} data-snap="start" className="relative z-20 min-h-svh overflow-hidden bg-ink text-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: LINE_ON_INK }} />
      </div>

      {/* Ink backing so the grid lines break around the text block, as in an editorial layout. */}
      <motion.div
        className="relative ml-[11.5vw] mt-[33vh] w-fit origin-left bg-ink py-4 pr-6 will-change-transform"
        style={{ y: statementY, scale: statementScale }}
      >
        <span className="inline-block rounded-full border border-paper px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm">
          About
        </span>
        <h2 className="mt-3 text-[7.92vw] font-semibold leading-[0.92] tracking-tight">
          <span className="sr-only">Rootlabs exists to make the hard stuff easy</span>
          {STATEMENT.map((line) => (
            <span key={line.join(' ')} aria-hidden className="block whitespace-nowrap">
              {line.map((word, i) => (
                <Fragment key={word}>
                  {i > 0 && ' '}
                  <BreathingWord word={word} index={i} gap={wordGap} />
                </Fragment>
              ))}
            </span>
          ))}
        </h2>
      </motion.div>

    </section>
  )
}
