import {
  cubicBezier,
  easeInOut,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  useMotionValue,
  type MotionValue,
  type Variants,
} from 'framer-motion'
import { Fragment, useLayoutEffect, useRef, useState, type Ref, type RefObject } from 'react'
import { COLUMNS, COMPRESS_GAP, COMPRESS_START } from './gridLayout'
import { wordOffset, type HeadingMetrics } from './headingLayout'
import { MorphingRings } from './MorphingRings'

// One pinned stage, one scroll timeline. The stage scrolls up into view below the hero like any section,
// carrying the heading (oversized, both lines centred), and pins once it fills the viewport. Phases are
// authored in vh of pinned scroll distance so lengthening one phase doesn't stretch the others; they are
// converted to scroll progress (0 → 1) below.
//      0–10vh    hold at peak size
//     10–120vh   words shrink to final size strictly one after another, scrubbed directly
//                by scroll; the grid compresses and lands exactly as "Business" lands  (SHRINK)
//    120–180vh   pause: heading rests at its final centred size (breathing room)
//    180–216vh   subtext snaps in and pushes the heading left; "can be hard." settles
//                left-aligned; the grid lines stay untouched                            (PUSH)
//    216–246vh   hold

const SCROLL_VH = 246 // total scroll distance while pinned; the section is this plus one viewport tall
const phase = (fromVh: number, toVh: number): [number, number] => [fromVh / SCROLL_VH, toVh / SCROLL_VH]

const SHRINK = phase(10, 120)
const PUSH = phase(180, 216)

// Grid line tone (--color-line).
const LINE_COLOR = '#232324'

// The hero's gradient carries on down the stage. It starts on --color-dusk, exactly where the hero's sky ends, and
// drains back to ink over the pinned scroll: quickly at first, matching the hero's own falloff at the seam, then a
// long tail, so the stage hands over seamlessly to the ink sections below. It sits on the tall outer box rather
// than the pinned stage, so while the heading is pinned the gradient keeps scrolling past behind it.
const DUSK_STOPS = [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8, 1]
const STAGE_BACKGROUND = `linear-gradient(to bottom, ${DUSK_STOPS.map(
  (t) => `color-mix(in srgb, var(--color-dusk) ${(100 * (1 - t) ** 2).toFixed(1)}%, var(--color-ink)) ${(t * SCROLL_VH).toFixed(1)}vh`,
).join(', ')})`

// Line 1 is ~9.1em wide; from lg, line 2 (~5.8em) plus the subtext hanging off it (2rem gap + 24rem) must also fit
// between the 3rem gutters, so below ~1200px the size scales with the viewport instead of overflowing it. Phones
// and tablets stack the subtext under line 2, so only line 1 has to fit (~80% of a phone's width).
const HEADLINE_CLASS =
  'whitespace-nowrap text-[8.4vw] font-semibold leading-[0.95] tracking-tight md:text-[3.825rem] lg:text-[length:min(7.225rem,calc((100vw_-_33rem)/5.82))]'

const WORDS = [
  { text: 'Scaling', line: 0 },
  { text: 'your', line: 0 },
  { text: 'business', line: 0 },
  { text: 'can', line: 1 },
  { text: 'be', line: 1 },
  { text: 'a grind', line: 1 },
]
// Strictly serial: SHRINK is cut into one equal slot per word, back to back with no overlap. A word
// finishes (and locks at scale 1) on the exact scroll position where the next word starts.
const WORD_WINDOW = 1 / 6
const WORD_STAGGER = WORD_WINDOW
const wordEnd = (index: number) => index * WORD_STAGGER + WORD_WINDOW
// The grid finishes compressing at the exact point "Business" reaches its final size.
const GRID_LOCK_WORD = 2 // "Business"

// Slow start, accelerating finish (ease-in cubic): each word eases off its peak size, then speeds up and
// lands hard at scale 1 right as its slot ends — the next word then starts from rest.
const wordEase = cubicBezier(0.32, 0, 0.67, 0)
// Ease-in-out quart for the subtext push: a pronounced speed ramp (slow → fast → slow).
const pushRamp = cubicBezier(0.76, 0, 0.24, 1)

// Entrance: the first time the stage comes into view (or straight away if the page loads with it on screen),
// each word rises into place from behind a mask, one after another. It is time-based and runs on an inner layer
// of each word, so the scroll-driven scale/offset on the word itself is never touched and simply carries on once
// the word has landed. Same curve as the hero's entrance.
const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const
const ENTRANCE_DURATION = 1.1 // s per word
const ENTRANCE_STAGGER = 0.07 // s between consecutive words
// Clip window for the reveal: the word's own box, padded so ascenders, descenders and side bearings are never cut.
// The rising text starts fully below its bottom edge. Removed once the word has landed.
const ENTRANCE_MASK = 'inset(-0.5em -0.25em -0.2em -0.25em)'
// When the entrance fires: as soon as the top of the stage has scrolled into view, i.e. right as the hero starts to
// leave. The stage sits directly under the full-height hero, so its top edge touches the viewport's bottom edge at
// scroll 0; this small inset keeps it from firing on page load before the user has scrolled at all. (The heading
// itself is centred in the stage, so it only reaches the viewport a little later — raise the inset to start the
// rise later, lower it to start sooner.)
const ENTRANCE_TRIGGER_INSET = '4%'
const wordEntrance: Variants = {
  hidden: { y: '130%', opacity: 0 },
  shown: (index: number) => ({
    y: '0%',
    opacity: 1,
    transition: { duration: ENTRANCE_DURATION, delay: index * ENTRANCE_STAGGER, ease: ENTRANCE_EASE },
  }),
}

// Scale for one word, scrubbed straight from scroll: no spring, no timing of its own.
function useWordShrink(
  shrink: MotionValue<number>,
  oversize: MotionValue<number>,
  version: MotionValue<number>,
  index: number,
) {
  const start = index * WORD_STAGGER
  return useTransform([shrink, oversize, version], ([t, peak]: number[]) => {
    const local = Math.min(Math.max((t - start) / WORD_WINDOW, 0), 1)
    return peak + (1 - peak) * wordEase(local)
  })
}

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

// The heading's vertical path while pinned, in vh of scroll → vh of translateY, to past the stage exit. Before
// the stage pins, the page itself carries the heading up into view. From there, one continuous curve:
//   crawl      (content):    a slow upward drift through shrink, pause and push whose speed dips to its minimum
//                            at the focal centre (it never reaches zero) and picks back up toward the end;
//   departure  (stage exit): accelerates away upward, so it has cleared the viewport before the next section's
//                            heading comes into view.
// The joint is velocity-matched, so the motion stays fluid from frame to frame.
const PATH_EXIT_FROM = SCROLL_VH // the stage starts scrolling away here
const PATH_FOCUS = PATH_EXIT_FROM / 2
const CRAWL_MIN = 0.02 // vh moved per vh scrolled at the focal centre
const CRAWL_EDGE = 0.06 // …and at either end of the crawl, where it hands over to approach / departure
const CRAWL_CURVE = (CRAWL_EDGE - CRAWL_MIN) / (PATH_EXIT_FROM - PATH_FOCUS) ** 2
const DEPART_ACCEL = 0.008 // quadratic term of the departure

const crawl = (s: number) => -(CRAWL_MIN * (s - PATH_FOCUS) + (CRAWL_CURVE * (s - PATH_FOCUS) ** 3) / 3)

function headingPathVh(s: number) {
  if (s <= PATH_EXIT_FROM) return crawl(Math.max(s, 0))
  const d = s - PATH_EXIT_FROM
  return Math.max(crawl(PATH_EXIT_FROM) - CRAWL_EDGE * d - DEPART_ACCEL * d * d, -150)
}

export function ScrollProgression() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // The line layer is viewport-fixed, so it outlives the pinned stage. It stays hidden while the stage is pinned
  // and only comes back once the stage has fully left, as straight lines for the page's grid on the sections below.
  const { scrollYProgress: stageExit } = useScroll({ target: ref, offset: ['end end', 'end start'] })
  const linesOpacity = useTransform(stageExit, (exit) => clamp01((exit - 0.95) / 0.05))
  const straightLines = useMotionValue(1)
  const lineWidth = useMotionValue(1)
  const lineColor = useMotionValue(LINE_COLOR)

  const still = useReducedMotion() ?? false
  // The heading's own path (headingPathVh) handles its exit: it accelerates away instead of lagging, so it is
  // gone before the next section's heading comes into view.

  const shrink = useTransform(scrollYProgress, SHRINK, [0, 1])

  // Speed ramp: eases off the mark, accelerates hard through the middle, then brakes into the final layout.
  const push = useTransform(scrollYProgress, PUSH, [0, 1], { ease: pushRamp })

  // Reduced motion: the heading just rides with the page, no crawl or departure.
  const headingY = useTransform([scrollYProgress, stageExit], ([p, exit]: number[]) =>
    still ? '0vh' : `${headingPathVh(p * SCROLL_VH + exit * 100)}vh`,
  )

  // Layout-driven values, measured from untransformed layout boxes (offset* ignores transforms).
  const firstLineRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const subtextRef = useRef<HTMLParagraphElement>(null)
  const metricsRef = useRef<HeadingMetrics | null>(null)
  const metricsVersion = useMotionValue(0) // bumped on every re-measure so word transforms recompute
  const headingRef = useRef<HTMLDivElement>(null)
  const oversize = useMotionValue(1.4) // peak scale: widest line fills the space between the side gutters
  const centreOffset = useMotionValue(0) // px that centre "can be hard." under the first line
  const pushDistance = useMotionValue(0) // px the finished heading moves left so heading + subtext sit centred
  // Fires once, as the top of the stage scrolls into view (see ENTRANCE_TRIGGER_INSET).
  const headingInView = useInView(ref, { once: true, margin: `0px 0px -${ENTRANCE_TRIGGER_INSET} 0px` })

  // One scroll-linked scale per word (fixed six-word heading, so fixed hook calls).
  const wordScales = [
    useWordShrink(shrink, oversize, metricsVersion, 0),
    useWordShrink(shrink, oversize, metricsVersion, 1),
    useWordShrink(shrink, oversize, metricsVersion, 2),
    useWordShrink(shrink, oversize, metricsVersion, 3),
    useWordShrink(shrink, oversize, metricsVersion, 4),
    useWordShrink(shrink, oversize, metricsVersion, 5),
  ]

  // The grid narrows from the start of SHRINK and lands on the same scroll position "Business" does.
  const gridCompress = useTransform(shrink, [0, wordEnd(GRID_LOCK_WORD)], [0, 1], { ease: easeInOut })

  // During SHRINK the block stays put around its fixed anchor. Only once every word has landed does the
  // incoming subtext push it: the block slides left and "can be hard." goes from centred to left-aligned.
  const headingX = useTransform([push, pushDistance, metricsVersion], ([t, d]: number[]) => -d * t)
  const secondLineX = useTransform([push, centreOffset, metricsVersion], ([t, c]: number[]) => c * (1 - t))
  // The grid stays put while the push moves the heading: the lines are never shifted.
  const gridShift = useMotionValue(0)

  const subtextOpacity = useTransform(push, [0, 0.2], [0, 1])
  const subtextX = useTransform(push, [0, 1], [40, 0])

  // Must be declared AFTER every transform that reads the measured values: multi-input useTransform
  // subscribes in its own layout effect and does not recompute on subscribe, so a value set before that
  // subscription is silently missed until another input happens to change.
  useLayoutEffect(() => {
    const block = headingRef.current
    const first = firstLineRef.current
    const subtext = subtextRef.current
    const wordEls = wordRefs.current
    if (!block || !first || !subtext || wordEls.length !== WORDS.length || wordEls.some((el) => !el)) return
    const measure = () => {
      const words = WORDS.map((word, i) => ({ x: wordEls[i]!.offsetLeft, w: wordEls[i]!.offsetWidth, line: word.line }))
      const lineWidths = [0, 1].map((line) => {
        const onLine = words.filter((w) => w.line === line)
        const last = onLine[onLine.length - 1]
        return last.x + last.w - onLine[0].x
      })
      const lineTwoOffset = (lineWidths[0] - lineWidths[1]) / 2
      metricsRef.current = {
        words,
        lineOffsets: [0, lineTwoOffset],
        anchorX: lineWidths[0] / 2,
        lineHeight: first.offsetHeight,
      }

      // The block is centred and the peak grows symmetrically from its centre: fill between the side gutters.
      const gutter = parseFloat(getComputedStyle(block.parentElement!).paddingLeft) || 0
      oversize.set((window.innerWidth - gutter * 2) / lineWidths[0])
      centreOffset.set(lineTwoOffset)
      // The subtext hangs off the right of line two (absolute on desktop, stacked below on phones and tablets).
      const groupWidth = Math.max(lineWidths[0], subtext.offsetLeft + subtext.offsetWidth)
      pushDistance.set((groupWidth - lineWidths[0]) / 2)
      // Bump last, and always: MotionValue.set() with an unchanged value doesn't notify, and StrictMode's
      // remount can cancel a pending update — a counter that always changes guarantees dependents recompute.
      metricsVersion.set(metricsVersion.get() + 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    ;[first, subtext, ...wordEls].forEach((el) => observer.observe(el!))
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [metricsVersion, oversize, centreOffset, pushDistance])

  const renderLine = (line: number) =>
    WORDS.map(
      (word, i) =>
        word.line === line && (
          <Fragment key={word.text}>
            {i > 0 && WORDS[i - 1].line === line && ' '}
            <Word
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              index={i}
              text={word.text}
              scales={wordScales}
              oversize={oversize}
              metricsRef={metricsRef}
              metricsVersion={metricsVersion}
              revealed={still || headingInView}
              still={still}
            />
          </Fragment>
        ),
    )

  return (
    <div
      ref={ref}
      data-snap="end"
      style={{ height: `${SCROLL_VH + 100}vh`, backgroundColor: 'var(--color-ink)', backgroundImage: STAGE_BACKGROUND }}
      className="relative"
    >
      <div className="sticky top-0 isolate h-dvh overflow-hidden">
        {/* Viewport-fixed grid lines for the page below the stage. Fixed (not absolute) so the stage's overflow
            never clips them; they stay in the stage's stacking context so they paint below the headings. */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-visible"
          style={{ opacity: linesOpacity }}
        >
          <MorphingRings
            morph={straightLines}
            columns={COLUMNS}
            strokeWidth={lineWidth}
            stroke={lineColor}
            compress={gridCompress}
            shift={gridShift}
            compressStart={COMPRESS_START}
            compressGap={COMPRESS_GAP}
          />
        </motion.div>

        <motion.div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 will-change-transform md:px-12">
          <motion.div ref={headingRef} className="text-paper will-change-transform" style={{ x: headingX, y: headingY }}>
            <div>
              <h2 className="sr-only">Scaling your business can be a grind</h2>
              <div ref={firstLineRef} aria-hidden className={`${HEADLINE_CLASS} relative w-fit`}>
                {renderLine(0)}
              </div>
              <motion.div className="relative flex w-fit flex-col will-change-transform" style={{ x: secondLineX }}>
                <div aria-hidden className={`${HEADLINE_CLASS} relative`}>
                  {renderLine(1)}
                </div>
                {/* Out of flow on desktop so the heading block (and its measurements) is only as wide as the headline.
                    Phones and tablets have no room beside line 2, so it stacks below. */}
                <motion.p
                  ref={subtextRef}
                  className="mt-6 max-w-[70vw] text-lg leading-snug text-paper/85 md:max-w-96 md:text-2xl lg:absolute lg:bottom-3 lg:left-full lg:mt-0 lg:ml-8 lg:w-96 lg:max-w-none"
                  style={{ opacity: subtextOpacity, x: subtextX }}
                >
                  Growing digital infrastructure is hard, and the roots run deep…
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

type WordProps = {
  ref: Ref<HTMLSpanElement>
  index: number
  text: string
  scales: MotionValue<number>[]
  oversize: MotionValue<number>
  metricsRef: RefObject<HeadingMetrics | null>
  metricsVersion: MotionValue<number>
  revealed: boolean // play the entrance
  still: boolean // reduced motion: no entrance, the word is simply there
}

// One word of the heading: scales with scroll on its own window and moves from its peak box to its final
// box around the heading's fixed anchor (see headingLayout.ts). Larger words stack above smaller ones, so a word
// that has already shrunk tucks underneath a neighbour that is still oversized.
function Word({ ref, index, text, scales, oversize, metricsRef, metricsVersion, revealed, still }: WordProps) {
  const scale = scales[index]
  const inputs = [metricsVersion, oversize, scale]
  const x = useTransform(inputs, ([, peak, s]: number[]) => wordOffset(metricsRef.current, s, peak, index).x)
  const y = useTransform(inputs, ([, peak, s]: number[]) => wordOffset(metricsRef.current, s, peak, index).y)
  const zIndex = useTransform(scale, (s) => Math.round(s * 1000))
  // The reveal mask only exists while the word is entering; afterwards the word is exactly as before.
  const [masked, setMasked] = useState(!still)

  return (
    <motion.span
      ref={ref}
      className="relative inline-block origin-bottom-left align-bottom will-change-transform"
      style={{ x, y, scale, zIndex, clipPath: masked && !still ? ENTRANCE_MASK : undefined }}
    >
      <motion.span
        className="inline-block"
        custom={index}
        variants={wordEntrance}
        initial={still ? false : 'hidden'}
        animate={revealed ? 'shown' : 'hidden'}
        onAnimationComplete={(definition) => definition === 'shown' && setMasked(false)}
      >
        {text}
      </motion.span>
    </motion.span>
  )
}
