import { cubicBezier, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { Fragment, useRef } from 'react'

// Warm ink-on-cream grid line, opaque so it reads as the same grid continuing onto the light section.
const LINE_ON_CREAM = '#22201f'

const speedRamp = cubicBezier(0.76, 0, 0.24, 1)

// Two-step pixel notch on the top corners only.
const CLIP_TOP_STEPS =
  'polygon(8% 0, 92% 0, 92% 4%, 96% 4%, 96% 8%, 100% 8%, 100% 100%, 0 100%, 0 8%, 4% 8%, 4% 4%, 8% 4%)'
// Single pixel notch on all four corners.
const CLIP_ALL_STEPS =
  'polygon(7% 0, 93% 0, 93% 5%, 100% 5%, 100% 95%, 93% 95%, 93% 100%, 7% 100%, 7% 95%, 0 95%, 0 5%, 7% 5%)'

type Card = {
  className: string
  clip: string
  fill: string
  rise: [string, string]
  range: [number, number]
}

const CARDS: Card[] = [
  {
    className: 'left-[33vw] bottom-[-14vw] z-10 w-[33vw] aspect-[4/3]',
    clip: CLIP_TOP_STEPS,
    fill: 'radial-gradient(circle at 35% 30%, #c98a52 0%, transparent 55%), radial-gradient(circle at 75% 70%, #5b3a2a 0%, transparent 60%), linear-gradient(160deg, #8a5a3a, #3b2519)',
    rise: ['30vh', '0vh'],
    range: [0, 0.9],
  },
  {
    className: 'left-[27vw] bottom-[-3vw] z-20 w-[9vw] aspect-[3/4]',
    clip: CLIP_ALL_STEPS,
    fill: 'radial-gradient(circle at 50% 35%, #e8cdb4 0%, transparent 50%), linear-gradient(200deg, #3a3437, #151314)',
    rise: ['45vh', '0vh'],
    range: [0.1, 1],
  },
  {
    className: 'left-[63vw] bottom-[-2vw] z-20 w-[11vw] aspect-[1/1]',
    clip: CLIP_ALL_STEPS,
    fill: 'radial-gradient(circle at 30% 20%, #b58bd0 0%, transparent 55%), radial-gradient(circle at 70% 80%, #d7e36a 0%, transparent 45%), linear-gradient(135deg, #4a3a5c, #1e1826)',
    rise: ['55vh', '0vh'],
    range: [0.15, 1],
  },
]

function CollageCard({ card, progress, still }: { card: Card; progress: MotionValue<number>; still: boolean }) {
  const y = useTransform(progress, card.range, still ? ['0vh', '0vh'] : card.rise, { ease: speedRamp })
  return (
    <motion.div
      aria-hidden
      className={`absolute will-change-transform ${card.className}`}
      style={{ y, filter: 'drop-shadow(0 18px 30px rgba(34, 32, 31, 0.22))' }}
    >
      <div className="size-full" style={{ clipPath: card.clip, background: card.fill }} />
    </motion.div>
  )
}

// The statement, line by line. Each word is its own span so the gaps can breathe without touching layout.
const STATEMENT = [
  ['Root', 'Labs', 'is'],
  ['here', 'to', 'make', 'the'],
  ['hard', 'stuff', 'easy.'],
]

// Heading motion over the section's whole pass through the viewport (`pass`: 0 = section top at the viewport
// bottom, 0.5 = section locked at the top — its resting, as-designed state — 1 = section scrolled out).
// Everything is 0 / 1 at 0.5, so wherever snapping lands the section, the heading looks exactly as laid out.
const PASS_DRIFT_VH = 50 // total y travel: the heading moves at ~75% of scroll speed (deeper than the cards)
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

// Light editorial section after the purple statement: a single centred grid line continues in warm beige, an
// About pill and a three-line statement sit on the first grid line, and a stepped media collage rises
// into place along the bottom edge as the section scrolls in.
export function AboutSection() {
  const ref = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion() ?? false
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  // Parallax depth + breathing across the whole pass (see PASS_* / GAP_* above). The collage cards (foreground
  // media) keep 1:1, so the statement reads as a deeper layer and the cards slide past it. All transforms.
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
    <section ref={ref} data-snap="start" className="relative z-20 min-h-dvh overflow-hidden bg-cream text-charcoal">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: LINE_ON_CREAM }} />
      </div>

      {/* Cream backing so the grid lines break around the text block, as in an editorial layout. */}
      <motion.div
        className="relative ml-[11.5vw] mt-[16vh] w-fit origin-left bg-cream py-4 pr-6 will-change-transform"
        style={{ y: statementY, scale: statementScale }}
      >
        <span className="inline-block rounded-full border border-charcoal px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm">
          About
        </span>
        <h2 className="mt-3 text-[8.8vw] font-semibold leading-[0.92] tracking-tight">
          <span className="sr-only">Root Labs is here to make the hard stuff easy.</span>
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

      {CARDS.map((card) => (
        <CollageCard key={card.className} card={card} progress={scrollYProgress} still={reduceMotion} />
      ))}
    </section>
  )
}
