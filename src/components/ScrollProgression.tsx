import {
  cubicBezier,
  easeInOut,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  type MotionValue,
} from 'framer-motion'
import { Fragment, useLayoutEffect, useRef, type ReactNode, type Ref, type RefObject } from 'react'
import { COLUMNS, COLUMN_WIDTH, COMPRESS_GAP, COMPRESS_START } from './gridLayout'
import { wordOffset, type HeadingMetrics } from './headingLayout'
import { HeroExitContext } from './heroExit'
import { MorphingRings } from './MorphingRings'

// One pinned stage, one scroll timeline. Phases are authored in vh of scroll distance so lengthening one
// phase doesn't stretch the others; they are converted to scroll progress (0 → 1) below.
//      0–80vh    hero headline slides off to the left                                  (HERO_EXIT)
//     10–110vh   hero rings straighten into the column grid lines                      (MORPH)
//    110–200vh   columns fill red bottom-up; background locks red                      (FILL)
//    200–250vh   heading elevates from below the stage, oversized, both lines centred  (ENTER)
//    250–260vh   hold at peak size
//    260–370vh   words shrink to final size strictly one after another, scrubbed directly
//                by scroll; the grid compresses and lands exactly as "Business" lands  (SHRINK)
//    370–430vh   pause: heading rests at its final centred size (breathing room)
//    430–466vh   subtext snaps in and pushes the heading left; "can be hard." settles
//                left-aligned; the grid lines stay untouched                            (PUSH)
//    466–496vh   hold

const SCROLL_VH = 496 // total scroll distance while pinned; the section is this plus one viewport tall
const phase = (fromVh: number, toVh: number): [number, number] => [fromVh / SCROLL_VH, toVh / SCROLL_VH]

const HERO_EXIT = phase(0, 80)
const MORPH = phase(10, 110)
const FILL = phase(110, 200)
const ENTER = phase(200, 250)
const SHRINK = phase(260, 370)
const PUSH = phase(430, 466)

// Fill offsets within FILL, slightly irregular so the columns read as a skyline, not a wipe.
const FILL_STARTS = [0.1, 0, 0.35, 0.6, 0.5, 0.25]
const FILL_DURATION = 0.4

const HEADLINE_CLASS =
  'whitespace-nowrap text-[7.225vw] font-semibold leading-[0.95] tracking-tight md:text-[3.825rem] lg:text-[7.225rem]'

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

function mixHex(a: string, b: string, t: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const mixed = [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t))
  return `rgb(${mixed.join(', ')})`
}

// The heading's vertical path, in vh of scroll → vh of translateY, from its entrance to past the stage exit.
// One continuous curve with no flat stretches, so every bit of scroll moves it:
//   approach   (ENTER):      rises from below the viewport fast, decelerating smoothly into…
//   crawl      (content):    a slow upward drift through shrink, pause and push whose speed dips to its minimum
//                            at the focal centre (it never reaches zero) and picks back up toward the end;
//   departure  (stage exit): accelerates away upward, so it has cleared the viewport before the next section's
//                            heading comes into view.
// Joints are velocity-matched, so the motion stays fluid from frame to frame.
const PATH_ENTER_FROM = 200
const PATH_ENTER_TO = 250
const PATH_EXIT_FROM = SCROLL_VH // the stage starts scrolling away here
const PATH_FOCUS = (PATH_ENTER_TO + PATH_EXIT_FROM) / 2
const CRAWL_MIN = 0.02 // vh moved per vh scrolled at the focal centre
const CRAWL_EDGE = 0.06 // …and at either end of the crawl, where it hands over to approach / departure
const CRAWL_CURVE = (CRAWL_EDGE - CRAWL_MIN) / (PATH_EXIT_FROM - PATH_FOCUS) ** 2
const DEPART_ACCEL = 0.008 // quadratic term of the departure

const crawl = (s: number) => -(CRAWL_MIN * (s - PATH_FOCUS) + (CRAWL_CURVE * (s - PATH_FOCUS) ** 3) / 3)

function headingPathVh(s: number) {
  if (s <= PATH_ENTER_FROM) return 100
  if (s <= PATH_ENTER_TO) {
    // Cubic ease-out from 100vh, riding on top of the crawl so its final velocity equals the crawl's.
    const u = (s - PATH_ENTER_FROM) / (PATH_ENTER_TO - PATH_ENTER_FROM)
    return crawl(s) + (100 - crawl(PATH_ENTER_FROM)) * (1 - u) ** 3
  }
  if (s <= PATH_EXIT_FROM) return crawl(s)
  const d = s - PATH_EXIT_FROM
  return Math.max(crawl(PATH_EXIT_FROM) - CRAWL_EDGE * d - DEPART_ACCEL * d * d, -150)
}

type ScrollProgressionProps = {
  /** Content shown on the stage before the red takes over (the hero). */
  children: ReactNode
}

export function ScrollProgression({ children }: ScrollProgressionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const heroExit = useTransform(scrollYProgress, HERO_EXIT, [0, 1])
  const morph = useTransform(scrollYProgress, MORPH, [0, 1])
  const fill = useTransform(scrollYProgress, FILL, [0, 1])

  // Background is driven by the same `fill` value as the columns, so it locks red exactly as the last column lands.
  const backgroundColor = useTransform(fill, [0.75, 1], ['#0a0a0c', '#9b7fa8'])
  // The line layer is viewport-fixed, so it outlives the pinned stage. The red section below the stage draws
  // its own lines over this layer, so the fixed lines only need to return to --color-line (the page's grid on
  // dark) once the stage has fully left — otherwise dark lines would flash across the leaving red stage.
  const { scrollYProgress: stageExit } = useScroll({ target: ref, offset: ['end end', 'end start'] })
  // Line colour: --color-line on the dark hero, 15% ink flattened over red (both opaque, so overlaps never double up).
  const lineColor = useTransform([fill, stageExit], ([f, exit]: number[]) =>
    mixHex('#232324', '#7a5f80', clamp01((f - 0.6) / 0.4) * (1 - clamp01((exit - 0.95) / 0.05))),
  )
  const heroVisibility = useTransform(heroExit, (v) => (v < 1 ? 'visible' : 'hidden'))

  // Parallax depth. The line layer is the deepest plane: while its cords are still curved (the only time a
  // vertical shift is visible on it), it creeps upward at a fraction of scroll speed. The straight lines
  // overscan the viewport by 22%, so the offset never exposes an end.
  const still = useReducedMotion() ?? false
  const linesY = useTransform(scrollYProgress, [0, MORPH[1]], ['0vh', still ? '0vh' : '-6vh'])
  // The heading's own path (headingPathVh) handles its exit: it accelerates away instead of lagging, so it is
  // gone before the next section's heading comes into view.

  // Scroll velocity thickens the grid lines while moving and relaxes them at rest.
  const velocity = useSpring(useVelocity(scrollYProgress), { stiffness: 300, damping: 40 })
  // Full stretch at ~3 viewports/second, independent of how long the section is.
  const fastScroll = 300 / SCROLL_VH
  // Rounded to 0.5px steps: stroke-width is an SVG geometry attribute, so every change re-lays-out the paths.
  // A MotionValue only notifies when its value actually changes, so this touches the DOM a handful of times
  // per gesture instead of on every frame, with the same visible thickening.
  const lineStretch = useTransform(velocity, (v) => {
    const t = Math.min(Math.abs(v) / fastScroll, 1)
    return Math.round((1 + 3 * t) * 2) / 2
  })

  const shrink = useTransform(scrollYProgress, SHRINK, [0, 1])

  // Speed ramp: eases off the mark, accelerates hard through the middle, then brakes into the final layout.
  const push = useTransform(scrollYProgress, PUSH, [0, 1], { ease: pushRamp })

  // Smooth elevation from below the stage — no pop, no fade. Hidden until it starts so nothing peeks.
  const headingY = useTransform([scrollYProgress, stageExit], ([p, exit]: number[]) => {
    const s = p * SCROLL_VH + exit * 100
    // Reduced motion: keep only the entrance (as a straight rise), no crawl or departure.
    if (still)
      return `${s < PATH_ENTER_TO ? 100 * (1 - Math.max(0, (s - PATH_ENTER_FROM) / (PATH_ENTER_TO - PATH_ENTER_FROM))) : 0}vh`
    return `${headingPathVh(s)}vh`
  })
  const headingVisibility = useTransform(scrollYProgress, (v) => (v > ENTER[0] ? 'visible' : 'hidden'))

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
      // The subtext hangs off the right of line two (absolute on desktop, stacked below on mobile).
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
            />
          </Fragment>
        ),
    )

  return (
    <div ref={ref} data-snap="end" style={{ height: `${SCROLL_VH + 100}vh` }} className="relative">
      <motion.div className="sticky top-0 isolate h-dvh overflow-hidden" style={{ backgroundColor }}>
        {/* Negative z: paints above the stage's background colour but below the z-0 line layer. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {Array.from({ length: COLUMNS }, (_, i) => (
            <ColumnPanel key={i} index={i} shrink={gridCompress} shift={gridShift} fill={fill} />
          ))}
        </div>

        {/* One continuous, viewport-fixed line layer for the whole page: hero rings → grid lines. Fixed (not
            absolute) so the stage's overflow never clips it; it stays in the stage's stacking context so it
            paints above the red panels and below the headings. */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-visible will-change-transform"
          style={{ y: linesY }}
        >
          <MorphingRings
            morph={morph}
            columns={COLUMNS}
            strokeWidth={lineStretch}
            stroke={lineColor}
            compress={gridCompress}
            shift={gridShift}
            compressStart={COMPRESS_START}
            compressGap={COMPRESS_GAP}
          />
        </motion.div>

        <motion.div className="absolute inset-0 z-[16]" style={{ visibility: heroVisibility }}>
          <HeroExitContext.Provider value={heroExit}>{children}</HeroExitContext.Provider>
        </motion.div>

        {/* Click-through: this full-screen layer sits above the hero, whose heading is interactive. */}
        <motion.div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 will-change-transform md:px-12">
          <motion.div
            ref={headingRef}
            className="text-[#231e25] will-change-transform"
            style={{ x: headingX, y: headingY, visibility: headingVisibility }}
          >
            <div>
              <h2 className="sr-only">Scaling your business can be a grind</h2>
              <div ref={firstLineRef} aria-hidden className={`${HEADLINE_CLASS} relative w-fit`}>
                {renderLine(0)}
              </div>
              <motion.div className="relative flex w-fit flex-col will-change-transform" style={{ x: secondLineX }}>
                <div aria-hidden className={`${HEADLINE_CLASS} relative`}>
                  {renderLine(1)}
                </div>
                {/* Out of flow on desktop so the heading block (and its measurements) is only as wide as the headline. */}
                <motion.p
                  ref={subtextRef}
                  className="mt-6 max-w-[70vw] text-lg leading-snug text-ink/85 md:absolute md:bottom-3 md:left-full md:mt-0 md:ml-8 md:w-96 md:text-2xl"
                  style={{ opacity: subtextOpacity, x: subtextX }}
                >
                  Growing digital infrastructure is hard, and the roots run deep…
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}

type ColumnPanelProps = {
  index: number
  shrink: MotionValue<number>
  shift: MotionValue<number>
  fill: MotionValue<number>
}

// A red panel: fills bottom-up, then compresses into a narrow centred rhythm in lockstep with the heading
// (`shrink`) and shifts with it (`shift`, px). Its lines live in the shared MorphingRings layer.
function ColumnPanel({ index, shrink: compressT, shift, fill }: ColumnPanelProps) {
  const x = useTransform([compressT, shift], ([t, px]: number[]) => {
    const from = index * COLUMN_WIDTH
    return `calc(${from + (COMPRESS_START + index * COMPRESS_GAP - from) * t}vw + ${px}px)`
  })
  const scaleX = useTransform(compressT, [0, 1], [1, COMPRESS_GAP / COLUMN_WIDTH])

  const fillStart = FILL_STARTS[index] ?? 0
  const panelScaleY = useTransform(fill, [fillStart, fillStart + FILL_DURATION], [0, 1], { ease: easeInOut })

  return (
    <motion.div
      className="absolute inset-y-0 left-0 origin-left will-change-transform"
      style={{ x, scaleX, width: `${COLUMN_WIDTH}vw` }}
    >
      <motion.div className="size-full origin-bottom bg-signal" style={{ scaleY: panelScaleY }} />
    </motion.div>
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
}

// One word of the heading: scales with scroll on its own window and moves from its peak box to its final
// box around the heading's fixed anchor (see headingLayout.ts). Larger words stack above smaller ones, so a word
// that has already shrunk tucks underneath a neighbour that is still oversized.
function Word({ ref, index, text, scales, oversize, metricsRef, metricsVersion }: WordProps) {
  const scale = scales[index]
  const inputs = [metricsVersion, oversize, scale]
  const x = useTransform(inputs, ([, peak, s]: number[]) => wordOffset(metricsRef.current, s, peak, index).x)
  const y = useTransform(inputs, ([, peak, s]: number[]) => wordOffset(metricsRef.current, s, peak, index).y)
  const zIndex = useTransform(scale, (s) => Math.round(s * 1000))

  return (
    <motion.span
      ref={ref}
      className="relative inline-block origin-bottom-left align-bottom will-change-transform"
      style={{ x, y, scale, zIndex }}
    >
      {text}
    </motion.span>
  )
}
