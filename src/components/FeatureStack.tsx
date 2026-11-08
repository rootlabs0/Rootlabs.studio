import {
  frame,
  interpolate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { FLOW_BG as BG, flowGrid } from './flowField'
import { PHONE_PORTRAIT, useMediaQuery } from './media'

// Feature-stack section after Square Share and the Bridge, dressed in the RootFlow sub-brand (navy ink, blueprint grid,
// royal-blue cards, gold accents; Syne display + Geist text): a sticky headline on the left, and on the right a
// deck of UI-mock cards that the page scroll deals one by one. The section is one viewport tall per card; the
// stage inside it is sticky, and scroll offset (in cards) drives every card's transform, so the motion is fully
// scrubbed. Each card step carries its own data-snap marker, so a finished gesture settles on exactly one card.

// The pinned stage's backdrop: RootFlow's blueprint grid (120px major / 24px minor) under a royal-blue glow behind
// the deck and a faint gold bloom.
const GRID = flowGrid()
const FIELD = [
  'radial-gradient(70% 80% at 100% 0%, rgba(26,62,150,0.55) 0%, rgba(20,44,112,0.22) 40%, transparent 72%)',
  'radial-gradient(40% 46% at 76% 48%, rgba(203,163,74,0.08), transparent 72%)',
  ...GRID,
  BG,
].join(', ')

// Edges: BridgeSection, above, ends in this stage's own field (navy, the top-right glow and the grid's lines carried
// on), so the stage picks it up with no edge; below, ContactSection fades the field out into its ink (flowField's
// edge band).

// Card surface: the deep royal panel with the brighter blue bloom in its top-right corner. Fully opaque, because
// it is the front face of a 3D box.
const CARD_BG = [
  'radial-gradient(120% 110% at 100% 0%, rgba(26,62,150,0.85) 0%, rgba(20,44,112,0.45) 38%, transparent 72%)',
  'linear-gradient(160deg, #111b3e 0%, #0c142e 55%, #0d1838 100%)',
].join(', ')

// Preview well: dot grid + a low gold bloom, like the radar panel on rootflow.cz.
const PANEL_BG = [
  'radial-gradient(52% 46% at 58% 42%, rgba(222,172,92,0.16), transparent 72%)',
  'radial-gradient(rgba(226,232,244,0.14) 1px, transparent 1.3px) 0 0 / 2.4cqw 2.4cqw',
  'rgba(6,9,18,0.55)',
].join(', ')
const PANEL_INNER_BG = 'linear-gradient(180deg, #16213a, #0b1222)'

const GOLD = 'linear-gradient(180deg, #fed495 0%, #e6b85f 45%, #c08b3e 100%)'

type PanelKind = 'inbox' | 'activity' | 'radar' | 'receivables' | 'pipeline' | 'tools' | 'chart' | 'report'

type Feature = {
  title: string
  body: string
  glyph: ReactNode
  panels: [PanelKind, PanelKind]
}

// Card copy follows rootflow.cz (in English): the office routine the system takes over — it handles what comes
// in, watches what would slip, connects the tools a company already uses, and turns the numbers into a report.
const FEATURES: Feature[] = [
  {
    title: 'Back Office',
    body: 'Orders, invoices and inquiries go from email straight into your systems.',
    glyph: <StripeGlyph />,
    panels: ['inbox', 'activity'],
  },
  {
    title: 'Monitoring',
    body: 'Payments, deadlines and competitor prices, watched so nothing slips.',
    glyph: <SplitGlyph />,
    panels: ['radar', 'receivables'],
  },
  {
    title: 'Integrations',
    body: 'E-shop, stock and accounting in sync, using the tools you already have.',
    glyph: <StackGlyph />,
    panels: ['pipeline', 'tools'],
  },
  {
    title: 'Reporting',
    body: 'A Monday email with revenue, receivables and anything that looks off.',
    glyph: <GridGlyph />,
    panels: ['chart', 'report'],
  },
]

const COUNT = FEATURES.length
const pad = (n: number) => String(n).padStart(2, '0')

// Phones held upright have no room for headline and deck side by side: the headline moves to the top, the deck
// sits under it, and the next card waits parked low with its header showing. Where it parks depends on the real
// screen height, so it is measured (px) rather than a fixed share of the viewport: PEEK of the card's width stays
// visible above the bottom edge (enough for its counter strip and title), and it never parks closer than
// PARK_GAP below the focused card.
const PEEK = 0.3
const PARK_GAP = 24 // px

export function FeatureStack() {
  const trackRef = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  const stacked = useMediaQuery(PHONE_PORTRAIT)

  // Phone geometry for the deck's poses, in px: how far below the focused card the waiting card parks, and the
  // height of the screen. 0 while side by side (the poses are then in vh).
  const deckRef = useRef<HTMLDivElement>(null)
  const parkedY = useMotionValue(0)
  const screenH = useMotionValue(0)
  useLayoutEffect(() => {
    const deck = deckRef.current
    if (!stacked || !deck) {
      screenH.set(0)
      return
    }
    const measure = () => {
      // The smallest viewport (browser toolbars showing): stable while they collapse, and the card peeks either way.
      const view = document.documentElement.clientHeight
      const cardHeight = (deck.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0
      parkedY.set(Math.max(view - deck.offsetTop - deck.offsetWidth * PEEK, cardHeight + PARK_GAP))
      screenH.set(view)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(deck)
    if (deck.firstElementChild) observer.observe(deck.firstElementChild)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [stacked, parkedY, screenH])

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
      id="work"
      data-snap="start"
      className="relative z-20 font-geist text-flow-chalk"
      // svh: the track's length is fixed, so the page below doesn't shift as a phone's toolbar collapses.
      style={{ height: `${COUNT * 100}svh`, backgroundColor: BG }}
    >
      {/* One snap point per card after the first (the section's own top covers card 01). */}
      {FEATURES.slice(1).map((f, i) => (
        <div
          key={f.title}
          aria-hidden
          data-snap="start"
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{ top: `${(i + 1) * 100}svh` }}
        />
      ))}

      <div ref={stageRef} className="sticky top-0 h-dvh overflow-hidden">
        {/* Blueprint backdrop, pinned with the stage so the grid holds still while the deck moves over it. */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: FIELD }}>
          <GridAccents />
        </div>

        {/* Card deck. Perspective lives on the wrapper so every card tilts around the same vanishing point, set
            above and right of the deck so the boxes read from their top and right faces. It's also the size
            container the box depth (cqw) is measured against, so depth stays proportional to card width.
            Side by side it is capped by height too, so a phone on its side still fits a whole card under the nav. */}
        <div
          ref={deckRef}
          className="@container absolute right-[7vw] top-[max(14vh,5rem)] w-[min(38vw,80svh)] phone:inset-x-6 phone:top-[11.5rem] phone:w-auto"
          style={{ perspective: 1600, perspectiveOrigin: '75% -20%' }}
        >
          {FEATURES.map((feature, i) => (
            <DeckCard
              key={feature.title}
              feature={feature}
              index={i}
              step={deckStep}
              parkedY={parkedY}
              screenH={screenH}
              still={still}
              anchorRef={(corner) => (el) => {
                anchors.current[i][corner] = el
              }}
            />
          ))}
        </div>

        <Wires stageRef={stageRef} anchors={anchors} step={deckStep} still={still} />

        {/* Pinned headline, bottom-left above the fixed brand bar; on upright phones, top-left above the deck. */}
        <div className="absolute bottom-28 left-6 md:left-12 phone:bottom-auto phone:top-[4.5rem]">
          <span className="mb-3 inline-flex items-center gap-[0.4em] rounded-full border border-flow-line-2 bg-flow-ink/55 px-3 pb-0.5 pt-px text-xl font-medium tracking-tight text-flow-muted backdrop-blur-sm md:text-3xl">
            <span
              aria-hidden
              className="size-[0.3em] rounded-full bg-flow-amber shadow-[0_0_0_0.18em_rgb(203_163_74/0.16),0_0_0.7em_rgb(203_163_74/0.7)]"
            />
            Engineering
          </span>
          <h2 className="font-syne text-[clamp(3.25rem,7.4vw,9rem)] font-semibold leading-[0.95] tracking-[-0.035em] text-flow-chalk [text-shadow:0_0_28px_rgb(7_9_21/0.92),0_2px_10px_rgb(7_9_21/0.7)]">
            Root<span className="text-flow-gold">Flow</span>
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
// Vertical poses side by side, in vh: two ahead (off-screen below), parked, in focus, gone.
const POSE_Y_VH = [115, 74, 0, -62]

function DeckCard({
  feature,
  index,
  step,
  parkedY,
  screenH,
  still,
  anchorRef,
}: {
  feature: Feature
  index: number
  step: MotionValue<number>
  parkedY: MotionValue<number>
  screenH: MotionValue<number>
  still: boolean
  anchorRef: (corner: number) => (el: HTMLElement | null) => void
}) {
  const range = [index - 2, index - 1, index, index + 1]
  const [sideBySideY] = useState(() => interpolate(range, POSE_Y_VH))
  // Stacked on a phone (screenH set): the same four poses, in px around the measured parking spot.
  const y = useTransform(() => {
    const s = step.get()
    const view = screenH.get()
    if (!view) return `${sideBySideY(s)}vh`
    const parked = parkedY.get()
    return `${interpolate(range, [parked + view * 0.5, parked, 0, -view * 0.7])(s)}px`
  })
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
const WIRE_COLOR = '#cba34a'
const WIRE_OPACITY = 0.6
// Wire ends are drawn as RootFlow's hollow square grid nodes / selection handles rather than round dots.
const NODE = 6

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
  const dots = useRef<(SVGRectElement | null)[]>([])

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
      // Terminal nodes on the four corners this pair uses.
      ;[points[pair][2], points[pair][3], points[pair + 1][0], points[pair + 1][1]].forEach(([x, y], k) => {
        const dot = dots.current[pair * 4 + k]
        if (!dot) return
        dot.setAttribute('x', String(x - NODE / 2))
        dot.setAttribute('y', String(y - NODE / 2))
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
        <rect
          key={n}
          ref={(el) => {
            dots.current[n] = el
          }}
          width={NODE}
          height={NODE}
          fill={BG}
          stroke={WIRE_COLOR}
          strokeWidth={1}
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
// at the front edge to darker at the back so the 90° corner against the navy front reads crisply.
const EDGE = 'inset 0 0 0 1px rgba(226,232,244,0.05)'

type FaceSpec = { name: string; className: string; transform: string; origin: string; background: string; size: 'w' | 'h' | 'full' }

const BOX_FACES: FaceSpec[] = [
  {
    name: 'top',
    className: 'inset-x-0 bottom-full',
    size: 'h',
    origin: '50% 100%',
    transform: `translateZ(${HALF_DEPTH}) rotateX(90deg)`,
    background: 'linear-gradient(to top, #243c70, #15264a)',
  },
  {
    name: 'right',
    className: 'inset-y-0 left-full',
    size: 'w',
    origin: '0% 50%',
    transform: `translateZ(${HALF_DEPTH}) rotateY(90deg)`,
    background: 'linear-gradient(to right, #1a2d58, #0e1a36)',
  },
  {
    name: 'left',
    className: 'inset-y-0 right-full',
    size: 'w',
    origin: '100% 50%',
    transform: `translateZ(${HALF_DEPTH}) rotateY(-90deg)`,
    background: 'linear-gradient(to left, #121d3c, #0a1226)',
  },
  {
    name: 'bottom',
    className: 'inset-x-0 top-full',
    size: 'h',
    origin: '50% 0%',
    transform: `translateZ(${HALF_DEPTH}) rotateX(-90deg)`,
    background: 'linear-gradient(to bottom, #0d1630, #080d1d)',
  },
  {
    name: 'back',
    className: 'inset-0',
    size: 'full',
    origin: '50% 50%',
    transform: `translateZ(-${HALF_DEPTH}) rotateY(180deg)`,
    background: 'linear-gradient(135deg, #111b3e, #0b1226)',
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
        className={size ? 'size-full border border-flow-line-2' : ''}
        style={{ opacity, background, boxShadow: size ? EDGE : undefined }}
      >
        {children}
      </motion.div>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div
      className="@container relative border border-flow-line-2 text-flow-chalk shadow-[inset_0_1px_0_rgb(226_232_244/0.08),0_40px_80px_-48px_rgb(0_0_0/0.9)]"
      style={{ background: CARD_BG }}
    >
      {/* Gold glint along the top edge, like the lit segments on RootFlow's grid lines. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-px left-[18%] h-px w-[46%] bg-gradient-to-r from-transparent via-flow-amber to-transparent"
      />

      {/* Counter strip */}
      <div className="flex border-b border-flow-line text-[3.4cqw] leading-none tabular-nums">
        <span className="border-r border-flow-line px-[2cqw] py-[1.8cqw] text-flow-amber">{pad(index + 1)}</span>
        <span className="border-r border-flow-line px-[2cqw] py-[1.8cqw] text-flow-faint">{pad(COUNT)}</span>
      </div>

      {/* Glyph column + copy */}
      <div className="grid grid-cols-[13cqw_1fr]">
        <div className="border-r border-flow-line p-[2.4cqw]">{feature.glyph}</div>
        <div className="px-[2.4cqw] pb-[4cqw] pt-[1.6cqw]">
          <h3 className="font-syne text-[9.4cqw] font-semibold leading-[0.95] tracking-[-0.045em]">{feature.title}</h3>
          <p className="mt-[2.4cqw] max-w-[80%] text-[3.7cqw] leading-[1.2] text-flow-muted">{feature.body}</p>
        </div>
      </div>

      {/* Preview sub-panels */}
      <div className="grid grid-cols-2 gap-[2cqw] px-[2cqw] pb-[2cqw]">
        {feature.panels.map((kind) => (
          <div
            key={kind}
            className="aspect-[1/0.95] overflow-hidden rounded-[1.6cqw] border border-flow-line pl-[4cqw] pt-[4cqw]"
            style={{ background: PANEL_BG }}
          >
            <div
              className="h-full rounded-tl-[1.2cqw] border-l border-t border-flow-line-2 p-[2.4cqw] text-[1.9cqw] leading-tight shadow-[inset_0_1px_0_rgb(226_232_244/0.08)]"
              style={{ background: PANEL_INNER_BG }}
            >
              <MockPanel kind={kind} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Glyphs: blunt marks for the card's left column, filled with RootFlow's gold gradient. The gradient spans the
// whole 40×40 glyph (userSpaceOnUse) so multi-part marks shade as one piece.

const GLYPH_GLOW = 'drop-shadow(0 0 1.4cqw rgba(203,163,74,0.35))'

function GoldFill({ id }: { id: string }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="38">
      <stop offset="0.08" stopColor="#ffe0a6" />
      <stop offset="0.52" stopColor="#ebbc62" />
      <stop offset="1" stopColor="#c48d40" />
    </linearGradient>
  )
}

function StripeGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" style={{ filter: GLYPH_GLOW }}>
      <defs>
        <clipPath id="fs-stripe">
          <circle cx="20" cy="20" r="19" />
        </clipPath>
        <GoldFill id="fs-gold-stripe" />
      </defs>
      <g clipPath="url(#fs-stripe)" fill="url(#fs-gold-stripe)">
        {[3, 11, 19, 27, 35].map((y) => (
          <rect key={y} x="0" y={y - 2.5} width="40" height="5" />
        ))}
      </g>
    </svg>
  )
}

function SplitGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" fill="url(#fs-gold-split)" style={{ filter: GLYPH_GLOW }}>
      <defs>
        <GoldFill id="fs-gold-split" />
      </defs>
      <rect x="2" y="4" width="5" height="32" />
      <rect x="10" y="4" width="28" height="32" />
    </svg>
  )
}

function StackGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" fill="url(#fs-gold-stack)" style={{ filter: GLYPH_GLOW }}>
      <defs>
        <GoldFill id="fs-gold-stack" />
      </defs>
      <rect x="6" y="3" width="28" height="3" />
      <rect x="4" y="9" width="32" height="3" />
      <rect x="2" y="15" width="36" height="22" />
    </svg>
  )
}

function GridGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="w-full" fill="url(#fs-gold-grid)" style={{ filter: GLYPH_GLOW }}>
      <defs>
        <GoldFill id="fs-gold-grid" />
      </defs>
      {[2, 21].flatMap((x) => [2, 21].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="17" height="17" />))}
    </svg>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Blueprint accents on the stage grid: hollow square nodes on a few intersections and gold glints running along a
// few lines, as on rootflow.cz. Coordinates are in grid cells (120px), so they land exactly on the drawn lines.

const CELL = 120
const GRID_NODES: [number, number][] = [
  [2, 1], [5, 1], [9, 1], [1, 3], [7, 3], [11, 2], [4, 5], [10, 5], [6, 6],
]
// [axis, line index, from cell, to cell]
const GRID_GLINTS: ['h' | 'v', number, number, number][] = [
  ['h', 1, 2, 5],
  ['v', 7, 1, 3],
  ['h', 5, 8, 11],
  ['h', 3, 0, 2],
]

function GridAccents() {
  return (
    <>
      {GRID_GLINTS.map(([axis, line, from, to]) => (
        <span
          key={`${axis}${line}${from}`}
          className={`absolute from-transparent via-flow-amber/70 to-transparent ${axis === 'h' ? 'h-px bg-gradient-to-r' : 'w-px bg-gradient-to-b'}`}
          style={
            axis === 'h'
              ? { top: line * CELL - 0.5, left: from * CELL, width: (to - from) * CELL }
              : { left: line * CELL - 0.5, top: from * CELL, height: (to - from) * CELL }
          }
        />
      ))}
      {GRID_NODES.map(([col, row]) => (
        <span
          key={`${col}-${row}`}
          className="absolute size-[7px] border border-flow-line-2 bg-flow-ink"
          style={{ left: col * CELL - 3.5, top: row * CELL - 3.5 }}
        />
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------------------------------------------
// Tiny product-UI mocks for the preview panels, drawn from what rootflow.cz shows the system doing (the hero's
// "System handled" feed, the competitor price radar, the Monday owner report). All sizing is in the card's cqw so
// they scale with it.

const AMBER_DOT = 'shrink-0 rounded-full bg-flow-amber shadow-[0_0_0_0.5cqw_rgb(203_163_74/0.16),0_0_1.4cqw_rgb(203_163_74/0.7)]'

function PanelTitle({ children }: { children: ReactNode }) {
  return <div className="mb-[1.6cqw] text-[2.3cqw] font-semibold">{children}</div>
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-[1cqw] border-b border-flow-line pb-[1cqw]">{children}</div>
}

function Pill({ on = false, children }: { on?: boolean; children: ReactNode }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-[1cqw] py-[0.3cqw] inset-ring ${on ? 'bg-flow-amber/15 text-flow-amber inset-ring-flow-amber/40' : 'bg-flow-chalk/5 text-flow-faint inset-ring-flow-line-2'}`}
    >
      {children}
    </span>
  )
}

function MockPanel({ kind }: { kind: PanelKind }) {
  switch (kind) {
    case 'inbox':
      return (
        <div>
          <PanelTitle>Inbox</PanelTitle>
          <div className="space-y-[1.2cqw]">
            {[
              ['Order #2041', 'Pohoda'],
              ['Supplier invoice', 'Accounts'],
              ['Complaint', 'Filed'],
              ['New inquiry', 'CRM'],
            ].map(([item, to]) => (
              <Row key={item}>
                <span className="flex items-center gap-[1cqw]">
                  <span className={`size-[1.2cqw] ${AMBER_DOT}`} />
                  {item}
                </span>
                <span className="whitespace-nowrap text-flow-faint">→ {to}</span>
              </Row>
            ))}
          </div>
        </div>
      )
    case 'activity':
      return (
        <div>
          <PanelTitle>System handled</PanelTitle>
          <div className="space-y-[1.8cqw]">
            {[
              ['Invoice issued', 'From the timesheet, no retyping'],
              ['Documents requested', 'Client knows what’s missing'],
              ['Reminder sent', 'Right after the due date'],
            ].map(([what, note]) => (
              <div key={what} className="flex gap-[1.2cqw]">
                <span
                  className="grid size-[2.6cqw] shrink-0 place-items-center rounded-full text-[1.5cqw] font-bold text-flow-ink shadow-[0_0_1.6cqw_-0.2cqw_rgb(203_163_74/0.6)]"
                  style={{ background: GOLD }}
                >
                  ✓
                </span>
                <div>
                  <div className="font-semibold">{what}</div>
                  <div className="text-flow-faint">{note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'radar':
      return (
        <div>
          <PanelTitle>Price radar</PanelTitle>
          <div className="space-y-[1.2cqw]">
            {['A', 'B', 'C', 'D'].map((id) => {
              const moved = id === 'C'
              return (
                <Row key={id}>
                  <span className="flex items-center gap-[1cqw]">
                    <span
                      className={`grid size-[2.4cqw] shrink-0 place-items-center rounded-[0.4cqw] border text-[1.5cqw] font-semibold ${moved ? 'border-flow-amber text-flow-amber' : 'border-flow-line-2 text-flow-faint'}`}
                    >
                      {id}
                    </span>
                    Competitor {id}
                  </span>
                  <Pill on={moved}>{moved ? 'New promo' : 'No change'}</Pill>
                </Row>
              )
            })}
          </div>
          <div className="mt-[1.6cqw] text-flow-amber">✉ Alert emailed instantly</div>
        </div>
      )
    case 'receivables':
      return (
        <div>
          <PanelTitle>Receivables</PanelTitle>
          <div className="space-y-[1.2cqw]">
            {[
              { id: 'INV-0412', state: 'Reminded', on: true },
              { id: 'INV-0399', state: 'Disputed → you', on: true },
              { id: 'INV-0415', state: 'Due Fri', on: false },
              { id: 'INV-0408', state: 'Paid', on: false },
            ].map(({ id, state, on }) => (
              <Row key={id}>
                <span className="font-mono">{id}</span>
                <Pill on={on}>{state}</Pill>
              </Row>
            ))}
          </div>
          <div className="mt-[1.6cqw] flex justify-between">
            <span className="text-flow-faint">Overdue</span>
            <span className="font-semibold tabular-nums">48,200 CZK</span>
          </div>
        </div>
      )
    case 'pipeline':
      return (
        <div>
          <PanelTitle>Workflows</PanelTitle>
          <div className="space-y-[1.2cqw]">
            {[
              ['Web form → CRM', 'Live'],
              ['Shoptet → Pohoda', 'Live'],
              ['Timesheet → Payroll', 'Live'],
              ['Supplier PDF → Stock', 'Draft'],
            ].map(([name, state]) => (
              <Row key={name}>
                <span>{name}</span>
                <Pill on={state === 'Live'}>{state}</Pill>
              </Row>
            ))}
          </div>
        </div>
      )
    case 'tools':
      return (
        <div>
          <PanelTitle>Your tools</PanelTitle>
          <div className="grid grid-cols-2 gap-[1cqw]">
            {['Pohoda', 'Money S3', 'Fakturoid', 'Shoptet', 'Raynet', 'Gmail', 'Excel', 'Slack'].map((name) => (
              <span
                key={name}
                className="flex items-center gap-[0.8cqw] rounded-[0.6cqw] border border-flow-line-2 bg-flow-ink/40 px-[1cqw] py-[0.8cqw]"
              >
                <span className={`size-[1cqw] ${AMBER_DOT}`} />
                {name}
              </span>
            ))}
          </div>
        </div>
      )
    case 'chart':
      return (
        <div className="flex h-full flex-col">
          <PanelTitle>Weekly revenue</PanelTitle>
          <div className="flex flex-1 items-end gap-[0.8cqw] pb-[1cqw]">
            {[40, 55, 35, 70, 60, 85, 65, 90].map((h, n, all) => {
              const now = n === all.length - 1
              return (
                <span
                  key={n}
                  className={`flex-1 rounded-t-[0.4cqw] ${now ? 'shadow-[0_0_2cqw_-0.4cqw_rgb(203_163_74/0.7)]' : 'bg-flow-chalk/12'}`}
                  style={{ height: `${h}%`, background: now ? GOLD : undefined }}
                />
              )
            })}
          </div>
        </div>
      )
    case 'report':
      return (
        <div>
          <PanelTitle>Monday report</PanelTitle>
          <div className="space-y-[1.2cqw]">
            {[
              ['Revenue', '412k CZK'],
              ['Receivables', '86k CZK'],
              ['New inquiries', '23'],
            ].map(([label, value]) => (
              <Row key={label}>
                <span className="text-flow-muted">{label}</span>
                <span className="font-semibold tabular-nums">{value}</span>
              </Row>
            ))}
          </div>
          <div className="mt-[1.6cqw] rounded-[0.6cqw] bg-flow-amber/15 px-[1.2cqw] py-[0.8cqw] text-flow-amber inset-ring inset-ring-flow-amber/40">
            Order #2033 is below margin
          </div>
        </div>
      )
  }
}
