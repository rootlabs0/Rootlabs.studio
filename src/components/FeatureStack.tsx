import { frame, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

// Yellow feature-stack section after the cream Features block: a sticky headline on the left, and on the right a
// deck of UI-mock cards that the page scroll deals one by one. The section is one viewport tall per card; the
// stage inside it is sticky, and scroll offset (in cards) drives every card's transform, so the motion is fully
// scrubbed. Each card step carries its own data-snap marker, so a finished gesture settles on exactly one card.

const BG = '#4445a2'
const PANEL = '#b19fff'

type PanelKind = 'browser' | 'scores' | 'components' | 'flow' | 'pipeline' | 'code' | 'chart' | 'services'

type Feature = {
  title: string
  body: string
  glyph: ReactNode
  panels: [PanelKind, PanelKind]
}

const FEATURES: Feature[] = [
  {
    title: 'Web Platforms',
    body: 'Fast, content-driven sites and web apps built to grow with your team.',
    glyph: <StripeGlyph />,
    panels: ['browser', 'scores'],
  },
  {
    title: 'Product Design',
    body: 'Interfaces and design systems grounded in how people actually work.',
    glyph: <SplitGlyph />,
    panels: ['components', 'flow'],
  },
  {
    title: 'Automation',
    body: 'Connect your tools and remove the busywork with custom workflows.',
    glyph: <StackGlyph />,
    panels: ['pipeline', 'code'],
  },
  {
    title: 'Infrastructure',
    body: 'Hosting, CI/CD and monitoring that quietly keeps everything running.',
    glyph: <GridGlyph />,
    panels: ['chart', 'services'],
  },
]

const COUNT = FEATURES.length
const pad = (n: number) => String(n).padStart(2, '0')

export function FeatureStack() {
  const trackRef = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false

  // 0 → COUNT-1 while the stage is pinned: the index of the card in focus, fractional between cards.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const step = useTransform(scrollYProgress, [0, 1], [0, COUNT - 1])
  // 0 → 1 while the section rises into view: draws the background lines in.
  const { scrollYProgress: arrival } = useScroll({ target: trackRef, offset: ['start end', 'start start'] })
  // What the deck actually follows: −1 → 0 while the section rises into view, then the pinned 0 → COUNT-1. At −1,
  // card 01 sits in the same parked-below pose every later card waits in, so it rises and rights itself on the way
  // in instead of arriving already in place.
  const deckStep = useTransform(() => step.get() + arrival.get() - 1)

  const stageRef = useRef<HTMLDivElement>(null)
  // Per card, the four front-face corner markers (TL, TR, BL, BR) the wires hang from.
  const anchors = useRef<(HTMLElement | null)[][]>(FEATURES.map(() => [null, null, null, null]))

  return (
    <section
      ref={trackRef}
      data-snap="start"
      className="relative z-20 text-charcoal"
      style={{ height: `${COUNT * 100}dvh`, backgroundColor: BG }}
    >
      {/* One snap point per card after the first (the section's own top covers card 01). */}
      {FEATURES.slice(1).map((f, i) => (
        <div
          key={f.title}
          aria-hidden
          data-snap="start"
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{ top: `${(i + 1) * 100}dvh` }}
        />
      ))}

      <div ref={stageRef} className="sticky top-0 h-dvh overflow-hidden">
        {/* Card deck. Perspective lives on the wrapper so every card tilts around the same vanishing point, set
            above and right of the deck so the boxes read from their top and right faces. It's also the size
            container the box depth (cqw) is measured against, so depth stays proportional to card width. */}
        <div
          className="@container absolute inset-x-6 top-[10vh] md:inset-x-auto md:right-[7vw] md:top-[14vh] md:w-[38vw]"
          style={{ perspective: 1600, perspectiveOrigin: '75% -20%' }}
        >
          {FEATURES.map((feature, i) => (
            <DeckCard
              key={feature.title}
              feature={feature}
              index={i}
              step={deckStep}
              still={still}
              anchorRef={(corner) => (el) => {
                anchors.current[i][corner] = el
              }}
            />
          ))}
        </div>

        <Wires stageRef={stageRef} anchors={anchors} step={deckStep} still={still} />

        {/* Pinned headline, bottom-left above the fixed brand bar. */}
        <div className="absolute bottom-28 left-6 md:left-12">
          <span className="mb-3 inline-block rounded-full border-2 border-charcoal px-3 pb-0.5 text-xl font-medium tracking-tight md:text-3xl">
            Engineering
          </span>
          <h2 className="text-white text-[clamp(3.25rem,7.4vw,9rem)] font-semibold leading-[0.9] tracking-[-0.045em]">
            We build
            <br />
            the systems
          </h2>
        </div>
      </div>
    </section>
  )
}

// A card's pose as a function of its distance from focus:
//   one card ahead  → parked low, tipped back and turned so its top and right faces show, header peeking above the fold
//   in focus        → nearly square-on, with a hair of rotation so a sliver of the right face keeps it solid
//   one card behind → flipped back and away up-left, fading out (the next card slides over it)
function DeckCard({
  feature,
  index,
  step,
  still,
  anchorRef,
}: {
  feature: Feature
  index: number
  step: MotionValue<number>
  still: boolean
  anchorRef: (corner: number) => (el: HTMLElement | null) => void
}) {
  const range = [index - 2, index - 1, index, index + 1]
  const y = useTransform(step, range, ['115vh', '74vh', '0vh', '-62vh'])
  const x = useTransform(step, range, ['0vw', '0vw', '0vw', still ? '0vw' : '-12vw'])
  // +X tips the top away (shows the top face); −Y swings the right edge forward (shows the right face).
  const rotateX = useTransform(step, range, still ? [0, 0, 0, 0] : [36, 30, 3, 38])
  const rotateY = useTransform(step, range, still ? [0, 0, 0, 0] : [-30, -24, -5, -18])
  const rotateZ = useTransform(step, range, still ? [0, 0, 0, 0] : [6, 4, -1.2, -9])
  const scale = useTransform(step, range, [1, 1, 1, still ? 1 : 0.74])
  const opacity = useTransform(step, (s) => cardOpacity(index, s))

  // Opacity < 1 on the box itself would flatten its 3D context, so the box stays opaque and each face fades.
  return (
    <motion.article
      className="absolute inset-x-0 top-0 will-change-transform"
      style={{ y, x, rotateX, rotateY, rotateZ, scale, zIndex: index, transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}
    >
      <Face opacity={opacity} className="relative" transform={`translateZ(${HALF_DEPTH})`}>
        <FeatureCard feature={feature} index={index} />
        {/* Zero-size corner markers: their screen rects are the projected 3D corners the wires attach to. */}
        {CORNERS.map((pos, corner) => (
          <span key={corner} ref={anchorRef(corner)} aria-hidden className={`absolute size-0 ${pos}`} />
        ))}
      </Face>
      {BOX_FACES.map((face) => (
        <Face key={face.name} opacity={opacity} {...face} />
      ))}
    </motion.article>
  )
}

// Fade in as a card comes up from far below, out as it flies away behind the next one. Shared with the wires so
// they fade with the cards they hang from.
function cardOpacity(index: number, s: number) {
  const d = s - index
  if (d <= -2 || d >= 1) return 0
  if (d < -1.6) return (d + 2) / 0.4
  if (d > 0.55) return (1 - d) / 0.45
  return 1
}

// ---------------------------------------------------------------------------------------------------------------
// Wires: thin lines hanging between each card's bottom corners and the next card's top corners, so the deck reads
// as one wired-together object. Endpoints are the projected corner markers, re-read after every rendered frame,
// so they stay pinned to the cuboids through every tilt. Control points are driven by scroll: each wire bows out
// along its normal as a sine of the scroll position, with the wires of a pair a third of a turn out of phase, so
// as the cards change they swing round each other and twist, then relax as the deck settles.

const CORNERS = ['left-0 top-0', 'right-0 top-0', 'left-0 bottom-0', 'right-0 bottom-0']
// [corner on card i, corner on card i+1]: two straight drops plus one crossing wire. Every second pair is mirrored
// left↔right (corner ^ 1: TL↔TR, BL↔BR), so the crossing wire alternates BR→TL / BL→TR down the deck.
const WIRES: [number, number][] = [
  [2, 0],
  [3, 1],
  [3, 0],
]
const WIRE_COLOR = '#ffffff'
const WIRE_OPACITY = 0.55

function Wires({
  stageRef,
  anchors,
  step,
  still,
}: {
  stageRef: RefObject<HTMLDivElement | null>
  anchors: RefObject<(HTMLElement | null)[][]>
  step: MotionValue<number>
  still: boolean
}) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])

  const update = () => {
    const stage = stageRef.current
    if (!stage) return
    const origin = stage.getBoundingClientRect()
    const s = step.get()
    const points = anchors.current.map((corners) =>
      corners.map((el) => {
        const r = el?.getBoundingClientRect()
        return r ? [r.left - origin.left, r.top - origin.top] : [0, 0]
      }),
    )

    for (let pair = 0; pair < COUNT - 1; pair++) {
      const visible = Math.min(cardOpacity(pair, s), cardOpacity(pair + 1, s))
      const mirror = pair % 2 === 1 ? 1 : 0
      WIRES.forEach(([baseFrom, baseTo], k) => {
        const from = baseFrom ^ mirror
        const to = baseTo ^ mirror
        const n = pair * WIRES.length + k
        const path = paths.current[n]
        if (!path) return
        const [ax, ay] = points[pair][from]
        const [bx, by] = points[pair + 1][to]
        const dx = bx - ax
        const dy = by - ay
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        // One full twist per card change, phase-shifted per wire; bow scales with span but stays delicate.
        const twist = still ? 0 : Math.sin((s - pair) * Math.PI * 2 + (k * Math.PI * 2) / 3)
        const bow = Math.min(len * 0.3, 120) * twist
        const c1x = ax + dx * 0.3 + nx * bow
        const c1y = ay + dy * 0.3 + ny * bow
        const c2x = ax + dx * 0.7 - nx * bow * 0.8
        const c2y = ay + dy * 0.7 - ny * bow * 0.8
        path.setAttribute('d', `M ${ax} ${ay} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${bx} ${by}`)
        path.style.opacity = String(visible * WIRE_OPACITY)
      })
      // Terminal dots on the four corners this pair uses.
      ;[points[pair][2], points[pair][3], points[pair + 1][0], points[pair + 1][1]].forEach(([x, y], k) => {
        const dot = dots.current[pair * 4 + k]
        if (!dot) return
        dot.setAttribute('cx', String(x))
        dot.setAttribute('cy', String(y))
        dot.style.opacity = String(visible)
      })
    }
  }

  // Redraw after the cards' transforms for this frame have been written, so the read positions are current.
  useMotionValueEvent(step, 'change', () => frame.postRender(update))
  useEffect(() => {
    const redraw = () => frame.postRender(update)
    redraw()
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  })

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible" fill="none">
      {Array.from({ length: (COUNT - 1) * WIRES.length }, (_, n) => (
        <path
          key={n}
          ref={(el) => {
            paths.current[n] = el
          }}
          stroke={WIRE_COLOR}
          strokeWidth={1}
          strokeLinecap="round"
          style={{ opacity: 0 }}
        />
      ))}
      {Array.from({ length: (COUNT - 1) * 4 }, (_, n) => (
        <circle
          key={n}
          ref={(el) => {
            dots.current[n] = el
          }}
          r={2.5}
          fill={WIRE_COLOR}
          style={{ opacity: 0 }}
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Box geometry. The front face (the card itself, in normal flow) sets the box's width and height; the other faces
// are pinned to its edges and hinged 90° back through the depth. Each is hinged on the edge it shares with the
// front, which sits at z = +HALF_DEPTH, so their far edges meet the back face at z = −HALF_DEPTH.

const DEPTH = '9cqw'
const HALF_DEPTH = '4.5cqw'

// Lit from the top right: top brightest, right face mid, left and bottom in shadow. Each side runs from lighter
// at the front edge to darker at the back so the 90° corner against the white front reads crisply.
const EDGE = 'inset 0 0 0 1px rgba(255,255,255,0.6)'

type FaceSpec = { name: string; className: string; transform: string; origin: string; background: string; size: 'w' | 'h' | 'full' }

const BOX_FACES: FaceSpec[] = [
  {
    name: 'top',
    className: 'inset-x-0 bottom-full',
    size: 'h',
    origin: '50% 100%',
    transform: `translateZ(${HALF_DEPTH}) rotateX(90deg)`,
    background: 'linear-gradient(to top, #ffffff, #f4e7c8)',
  },
  {
    name: 'right',
    className: 'inset-y-0 left-full',
    size: 'w',
    origin: '0% 50%',
    transform: `translateZ(${HALF_DEPTH}) rotateY(90deg)`,
    background: 'linear-gradient(to right, #fff8ea, #e2d3b1)',
  },
  {
    name: 'left',
    className: 'inset-y-0 right-full',
    size: 'w',
    origin: '100% 50%',
    transform: `translateZ(${HALF_DEPTH}) rotateY(-90deg)`,
    background: 'linear-gradient(to left, #efe2c4, #c9b893)',
  },
  {
    name: 'bottom',
    className: 'inset-x-0 top-full',
    size: 'h',
    origin: '50% 0%',
    transform: `translateZ(${HALF_DEPTH}) rotateX(-90deg)`,
    background: 'linear-gradient(to bottom, #dccca8, #b8a57f)',
  },
  {
    name: 'back',
    className: 'inset-0',
    size: 'full',
    origin: '50% 50%',
    transform: `translateZ(-${HALF_DEPTH}) rotateY(180deg)`,
    background: 'linear-gradient(135deg, #f4e7c8, #d6c49f)',
  },
]

function Face({
  opacity,
  className,
  transform,
  origin = '50% 50%',
  background,
  size,
  children,
}: {
  opacity: MotionValue<number>
  className: string
  transform: string
  origin?: string
  background?: string
  size?: FaceSpec['size']
  children?: ReactNode
}) {
  // Outer div is placed in 3D; the inner one fades (a fading leaf can't flatten anything).
  return (
    <div
      className={`${size ? 'absolute' : ''} ${className}`}
      style={{
        width: size === 'w' ? DEPTH : undefined,
        height: size === 'h' ? DEPTH : undefined,
        transform,
        transformOrigin: origin,
        backfaceVisibility: 'hidden',
      }}
    >
      <motion.div
        className={size ? 'size-full border border-charcoal' : ''}
        style={{ opacity, background, boxShadow: size ? EDGE : undefined }}
      >
        {children}
      </motion.div>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div className="@container border border-charcoal bg-white shadow-[0_30px_60px_-30px_rgba(34,32,31,0.45)]">
      {/* Counter strip */}
      <div className="flex border-b border-charcoal text-[3.4cqw] leading-none">
        <span className="border-r border-charcoal px-[2cqw] py-[1.8cqw]">{pad(index + 1)}</span>
        <span className="border-r border-charcoal px-[2cqw] py-[1.8cqw]">{pad(COUNT)}</span>
      </div>

      {/* Glyph column + copy */}
      <div className="grid grid-cols-[13cqw_1fr]">
        <div className="border-r border-charcoal p-[2.4cqw]">{feature.glyph}</div>
        <div className="px-[2.4cqw] pb-[4cqw] pt-[1.6cqw]">
          <h3 className="text-[9.4cqw] font-semibold leading-[0.95] tracking-[-0.04em]">{feature.title}</h3>
          <p className="mt-[2.4cqw] max-w-[80%] text-[3.7cqw] leading-[1.2]">{feature.body}</p>
        </div>
      </div>

      {/* Preview sub-panels */}
      <div className="grid grid-cols-2 gap-[2cqw] px-[2cqw] pb-[2cqw]">
        {feature.panels.map((kind) => (
          <div key={kind} className="aspect-[1/0.95] overflow-hidden pl-[4cqw] pt-[4cqw]" style={{ backgroundColor: PANEL }}>
            <div className="h-full border-l border-t border-charcoal/30 bg-white p-[2.4cqw] text-[1.9cqw] leading-tight">
              <MockPanel kind={kind} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Glyphs: blunt black marks for the card's left column.

function StripeGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full">
      <defs>
        <clipPath id="fs-stripe">
          <circle cx="20" cy="20" r="19" />
        </clipPath>
      </defs>
      <g clipPath="url(#fs-stripe)" fill="#22201f">
        {[3, 11, 19, 27, 35].map((y) => (
          <rect key={y} x="0" y={y - 2.5} width="40" height="5" />
        ))}
      </g>
    </svg>
  )
}

function SplitGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" fill="#22201f">
      <rect x="2" y="4" width="5" height="32" />
      <rect x="10" y="4" width="28" height="32" />
    </svg>
  )
}

function StackGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" fill="#22201f">
      <rect x="6" y="3" width="28" height="3" />
      <rect x="4" y="9" width="32" height="3" />
      <rect x="2" y="15" width="36" height="22" />
    </svg>
  )
}

function GridGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" fill="#22201f">
      {[2, 21].flatMap((x) => [2, 21].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="17" height="17" />))}
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Tiny product-UI mocks for the preview panels. All sizing is in the card's cqw so they scale with it.

function Bar({ w, className = 'bg-charcoal/15' }: { w: string; className?: string }) {
  return <div className={`h-[1.2cqw] rounded-full ${className}`} style={{ width: w }} />
}

function PanelTitle({ children }: { children: ReactNode }) {
  return <div className="mb-[1.6cqw] text-[2.3cqw] font-semibold">{children}</div>
}

function MockPanel({ kind }: { kind: PanelKind }) {
  switch (kind) {
    case 'browser':
      return (
        <div>
          <div className="mb-[2cqw] flex items-center gap-[0.8cqw]">
            {[0, 1, 2].map((n) => (
              <span key={n} className="size-[1.2cqw] rounded-full bg-charcoal/25" />
            ))}
            <span className="ml-[1cqw] h-[1.8cqw] flex-1 rounded-full bg-charcoal/10" />
          </div>
          <div className="mb-[1.6cqw] h-[11cqw] rounded-[0.8cqw] bg-gradient-to-br from-[#f4b93e] to-[#f36cf2]" />
          <div className="space-y-[1cqw]">
            <Bar w="80%" className="bg-charcoal/70" />
            <Bar w="60%" />
            <Bar w="70%" />
          </div>
        </div>
      )
    case 'scores':
      return (
        <div>
          <PanelTitle>Performance</PanelTitle>
          <div className="grid grid-cols-2 gap-[2cqw]">
            {[99, 100, 98, 100].map((score, n) => (
              <div key={n} className="grid aspect-square place-items-center rounded-full border-[0.7cqw] border-[#3fbf6b] font-semibold">
                {score}
              </div>
            ))}
          </div>
        </div>
      )
    case 'components':
      return (
        <div>
          <PanelTitle>Components</PanelTitle>
          <div className="mb-[1.6cqw] flex gap-[1cqw]">
            <span className="rounded-full bg-[#7a5cf0] px-[1.6cqw] py-[0.6cqw] text-white">Primary</span>
            <span className="rounded-full border border-charcoal/40 px-[1.6cqw] py-[0.6cqw]">Ghost</span>
          </div>
          <div className="mb-[1.6cqw] rounded-[0.6cqw] border border-charcoal/20 px-[1.2cqw] py-[1cqw] text-charcoal/50">
            Search…
          </div>
          <div className="grid grid-cols-4 gap-[0.8cqw]">
            {['#22201f', '#7a5cf0', '#b19fff', '#f4b93e', '#f36cf2', '#b5ff4f', '#fff1d3', '#e5e5e5'].map((c) => (
              <span key={c} className="aspect-square rounded-[0.5cqw] border border-charcoal/10" style={{ background: c }} />
            ))}
          </div>
        </div>
      )
    case 'flow':
      return (
        <div className="relative h-full">
          <PanelTitle>User flow</PanelTitle>
          <div className="flex flex-col items-start gap-[2.4cqw]">
            {['Sign up', 'Onboarding', 'Dashboard'].map((label, n) => (
              <div key={label} className="flex items-center gap-[1cqw]" style={{ marginLeft: `${n * 5}cqw` }}>
                <span className="size-[1.6cqw] rounded-full bg-[#7a5cf0]" />
                <span className="rounded-[0.6cqw] border border-charcoal/30 px-[1.2cqw] py-[0.6cqw]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'pipeline':
      return (
        <div>
          <PanelTitle>Workflows</PanelTitle>
          <div className="space-y-[1.2cqw]">
            {[
              ['New lead → CRM', 'Live'],
              ['Invoice → Slack', 'Live'],
              ['Form → Sheet', 'Draft'],
              ['Order → Email', 'Live'],
            ].map(([name, state]) => (
              <div key={name} className="flex items-center justify-between border-b border-charcoal/10 pb-[1cqw]">
                <span>{name}</span>
                <span
                  className={`rounded-full px-[1cqw] py-[0.3cqw] ${state === 'Live' ? 'bg-[#3fbf6b]/20 text-[#1d7a40]' : 'bg-charcoal/10'}`}
                >
                  {state}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    case 'code':
      return (
        <div className="-m-[2.4cqw] h-[calc(100%+4.8cqw)] bg-charcoal p-[2.4cqw] font-mono text-[#e5e5e5]">
          <div className="text-[#b19fff]">on(&apos;order.paid&apos;)</div>
          <div className="pl-[2cqw]">.then(sync)</div>
          <div className="pl-[2cqw]">.then(notify)</div>
          <div className="mt-[2cqw] text-[#3fbf6b]">✓ 1,284 runs</div>
          <div className="text-white/40">0 failures</div>
        </div>
      )
    case 'chart':
      return (
        <div className="flex h-full flex-col">
          <PanelTitle>Requests</PanelTitle>
          <div className="flex flex-1 items-end gap-[0.8cqw] pb-[1cqw]">
            {[40, 55, 35, 70, 60, 85, 65, 90, 75].map((h, n) => (
              <span key={n} className="flex-1 rounded-t-[0.4cqw] bg-[#7a5cf0]" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      )
    case 'services':
      return (
        <div>
          <PanelTitle>Services</PanelTitle>
          <div className="space-y-[1.4cqw]">
            {['api', 'web', 'worker', 'db'].map((name) => (
              <div key={name} className="flex items-center gap-[1cqw]">
                <span className="size-[1.4cqw] rounded-full bg-[#3fbf6b]" />
                <span className="flex-1 font-mono">{name}</span>
                <span className="text-charcoal/50">99.99%</span>
              </div>
            ))}
          </div>
        </div>
      )
  }
}
