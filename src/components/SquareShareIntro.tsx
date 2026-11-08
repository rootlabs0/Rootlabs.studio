import { motion, useInView, useReducedMotion, useScroll, useTransform, type Target } from 'framer-motion'
import { useRef } from 'react'

// The opening of the Square Share area: one black screen that announces the product with its mark and name, then
// hands over to the showcase hero below.
//
//   Opening (plays once, when the screen is half in view):
//     - the "Our SaaS" pill, then the mark builds itself from its pieces: the three flush squares pop in one by
//       one along the L (corner, up, across), then the small detached L slides out of the corner (square, then
//       share);
//     - "Square Share" rises in word by word, unblurring, as the Bridge's heading does;
//     - the Rootlabs line fades up underneath.
//   Hand-over (tied to scroll, so it plays both ways and never jumps): as the screen scrolls away the group trails
//   at half speed, the pill and line fade first, then the name and mark shrink a touch and blur out, while the
//   showcase's black hero rises in underneath with its own entrance. Both are pure black, so there is no seam.
//
// The name is set the way Square Share sets it in its own header (Geist 600, -0.025em, the mark at 22/18 of the
// type size). Wheel snapping rests here (the section's top) and next on the showcase hero, one screen on.

const EASE = [0.22, 1, 0.36, 1] as const // the site's entrance ease (Square Share's curve too)
const PURPLE_GLOW = 'radial-gradient(42% 32% at 50% 50%, rgba(168,85,247,0.13), transparent 72%)'
// The Features section's ink (--color-ink, #0a0a0c) sits directly above: it carries on over the top edge and eases
// (smoothstep) into this screen's pure black, so the two never show an edge.
const INK_FADE =
  'linear-gradient(to bottom, rgba(10,10,12,1) 0px, rgba(10,10,12,0.896) 72px, rgba(10,10,12,0.648) 144px, rgba(10,10,12,0.352) 216px, rgba(10,10,12,0.104) 288px, rgba(10,10,12,0) 360px)'

const WORDS = ['Square', 'Share'] as const
const WORD_FROM: Target = { opacity: 0, y: '0.45em', filter: 'blur(10px)' }
const WORD_TO: Target = { opacity: 1, y: '0em', filter: 'blur(0px)' }

// The mark (icons.tsx, SquareShareLogo) in its pieces, on its 7 x 7 grid: the three squares in build order.
const SQUARES = [
  { x: 0, y: 4 },
  { x: 0, y: 1 },
  { x: 3, y: 4 },
] as const

type Reveal = (from: Target, to: Target, delay: number, duration: number) => object

// Props for a one-shot entrance: hidden at `from` until `play`, then eased to `to`. Under reduced motion everything
// renders at `to` straight away.
const makeReveal =
  (play: boolean, still: boolean): Reveal =>
  (from, to, delay, duration) =>
    still
      ? { initial: false, animate: to }
      : { initial: from, animate: play ? to : undefined, transition: { duration, delay, ease: EASE } }

export function SquareShareIntro() {
  const ref = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reveal = makeReveal(still || inView, still)

  // 0 with the intro filling the screen, 1 once it has scrolled fully out above. The showcase hero's rest point is
  // about 0.8–0.95 of the way, so everything here is gone well before the page settles there.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Passed through a JS mapper on purpose: mapped straight off useScroll, framer-motion hands opacity and filter to
  // a native scroll timeline, which doesn't hold the end of a range (the name came back at 60% opacity on the hero's
  // rest point). A function transform keeps every value below on the JS path, clamped.
  const away = useTransform(scrollYProgress, (v) => Math.min(Math.max(v, 0), 1))
  const trail = useTransform(away, [0, 1], ['0vh', '50vh']) // half the scroll speed
  const asideOpacity = useTransform(away, [0, 0.3], [1, 0])
  const glowOpacity = useTransform(away, [0, 0.45], [1, 0])
  const nameOpacity = useTransform(away, [0.1, 0.55], [1, 0])
  const nameScale = useTransform(away, [0, 0.6], [1, 0.86])
  const nameBlur = useTransform(away, [0.1, 0.55], ['blur(0px)', 'blur(10px)'])

  return (
    <section
      ref={ref}
      aria-labelledby="ss-intro-title"
      className="relative flex h-dvh items-center justify-center overflow-hidden bg-black px-5"
      style={{ backgroundImage: INK_FADE }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={still ? undefined : { opacity: glowOpacity }}
      >
        <motion.div className="absolute inset-0" style={{ background: PURPLE_GLOW }} {...reveal({ opacity: 0 }, { opacity: 1 }, 0.1, 1.8)} />
      </motion.div>

      <motion.div className="relative flex flex-col items-center text-center" style={still ? undefined : { y: trail }}>
        <motion.div style={still ? undefined : { opacity: asideOpacity }}>
          <motion.span
            className="inline-block rounded-full border border-paper px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm"
            {...reveal({ opacity: 0, y: 8 }, { opacity: 1, y: 0 }, 0, 0.8)}
          >
            Our SaaS
          </motion.span>
        </motion.div>

        {/* Square Share's header lockup, scaled up: 22px mark, 10px gap, 18px name → 1.2222em, 0.5556em, 1em. */}
        <motion.div
          className="mt-[clamp(1.5rem,4vh,2.5rem)] flex items-center gap-[0.5556em] whitespace-nowrap text-[length:clamp(2rem,9vw,6rem)] font-semibold leading-none tracking-[-0.025em] text-white"
          style={still ? undefined : { opacity: nameOpacity, scale: nameScale, filter: nameBlur }}
        >
          <AnimatedMark reveal={reveal} />
          <h2 id="ss-intro-title">
            {WORDS.map((word, i) => (
              <span key={word}>
                <motion.span className="inline-block" {...reveal(WORD_FROM, WORD_TO, 0.55 + i * 0.08, 1.1)}>
                  {word}
                </motion.span>
                {i < WORDS.length - 1 && ' '}
              </span>
            ))}
          </h2>
        </motion.div>

        <motion.p
          className="mt-[clamp(1.25rem,3.5vh,2rem)] max-w-[44ch] text-[clamp(1rem,1.3vw,1.25rem)] leading-snug text-paper/55"
          style={still ? undefined : { opacity: asideOpacity }}
        >
          <motion.span className="block" {...reveal({ opacity: 0, y: 12 }, { opacity: 1, y: 0 }, 0.95, 0.9)}>
            A Rootlabs company. Start taking payments on any website with an embeddable store or a one-line purchase
            button.
          </motion.span>
        </motion.p>
      </motion.div>
    </section>
  )
}

// The Square Share mark, assembling: each square grows into its cell in turn, then the detached L slides out from
// the corner it shares with them. Translations on the <g> are in the mark's own 7 x 7 units.
function AnimatedMark({ reveal }: { reveal: Reveal }) {
  return (
    <svg
      viewBox="0 0 7 7"
      className="size-[1.2222em] shrink-0"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {SQUARES.map((square, i) => (
        <motion.rect
          key={`${square.x}-${square.y}`}
          x={square.x}
          y={square.y}
          width={3}
          height={3}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          {...reveal({ opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1 }, 0.15 + i * 0.1, 0.6)}
        />
      ))}
      <motion.g {...reveal({ opacity: 0, x: -1.5, y: 1.5 }, { opacity: 1, x: 0, y: 0 }, 0.5, 0.8)}>
        <rect x="4" y="0" width="3" height="1" />
        <rect x="6" y="0" width="1" height="3" />
      </motion.g>
    </svg>
  )
}
