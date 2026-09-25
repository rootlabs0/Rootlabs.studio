import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

// The page's single line layer, drawn in viewport pixels as one continuous path system. Each line is a cord
// running top to bottom: at morph 0 it traces the arc of a ring centred just past the bottom-right corner, at
// morph 1 it is a straight vertical line; from then on the same paths *are* the grid, compressing and
// shifting with the heading. Nothing is swapped or re-created at the hero → red hand-off.
//
// Density: the hero starts with a dense fan of evenly spaced arcs, and every cord keeps its own evenly
// spaced destination, so nothing groups or bunches. The fan thins by opacity alone, in two waves that each
// double the visible spacing: first every odd cord fades, then the cord midway between two structural
// lines. Only the structural lines (one per column's left edge) are left when the red arrives. The set of
// paths never changes; nothing is removed from the DOM.
//
// Cords stay apart: arcs are nested, targets strictly increase left to right, and every cord shares one
// easing value (verified numerically: neighbouring cords never intersect on screen at any point of the morph).

// Cords per column in the hero; the first of each group lands on the column's left edge (structural line).
const SUBDIVISIONS = 4
// Scroll windows (in morph progress) over which each fade wave runs.
const FADE_WAVES: [number, number][] = [
  [0.2, 0.55], // odd cords
  [0.5, 0.9], // mid cords
]
const SAMPLES = 96
// The cords sag downward by this share of the viewport height as they straighten, in lockstep with scroll.
const DRIFT = 0.12
// Cords extend this far past the top and bottom edges so drift never exposes an end.
const OVERSCAN = 0.1 + DRIFT
// Focal point just outside the bottom-right corner, so every cord's off-arc stretch is hidden off-screen.
const FOCUS_X = 1.03
const FOCUS_Y = 1.03
// Smallest and largest ring radius as a share of the focus-to-top-left distance.
const R_MIN = 0.08
const R_MAX = 1.08

// tier 0 = structural (always visible), 1 = fades first, 2 = fades second.
type Cord = { from: [number, number][]; column: number; tier: 0 | 1 | 2 }

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

// Straight target line, walked bottom → top at constant speed (u = 0…1).
const lineY = (u: number, h: number) => (1 + OVERSCAN) * h - u * (1 + 2 * OVERSCAN) * h

function buildCords(w: number, h: number, columns: number): Cord[] {
  const cx = w * FOCUS_X
  const cy = h * FOCUS_Y
  const reach = Math.hypot(cx, cy)
  // `columns` structural lines in the end, one per column's left edge.
  const count = columns * SUBDIVISIONS
  // Hidden tail that carries each arc off-screen to the right after its top.
  const tail = w

  return Array.from({ length: count }, (_, i) => {
    // i = 0 is the biggest ring and lands on the left edge; radii shrink evenly toward the corner.
    const r = reach * (R_MAX - ((R_MAX - R_MIN) * i) / (count - 1))
    const arc = Math.PI * r
    // The source curve, walked at constant speed like the target line: the left half of the ring from its
    // bottom up to its top, then straight on along the top's horizontal tangent, off-screen right. Tangent
    // and speed match at the join, so the curve — and every blend of it with the line — has no corner.
    const from = Array.from({ length: SAMPLES + 1 }, (_, k): [number, number] => {
      const s = (k / SAMPLES) * (arc + tail)
      if (s <= arc) {
        const theta = Math.PI / 2 + s / r
        return [cx + r * Math.cos(theta), cy + r * Math.sin(theta)]
      }
      return [cx + (s - arc), cy - r]
    })
    const tier = i % SUBDIVISIONS === 0 ? 0 : i % 2 === 1 ? 1 : 2
    return { from, column: i / SUBDIVISIONS, tier }
  })
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

type Grid = { w: number; h: number; columns: number; start: number; gap: number; compress: number; shift: number }

// Where a column line sits (px) once the grid has compressed toward a narrow centred rhythm and shifted.
// Linear in `column`, so fractional columns (minor lines) stay evenly spaced between the majors at every stage.
function columnX(column: number, g: Grid) {
  const from = (column * 100) / g.columns
  return ((from + (g.start + column * g.gap - from) * g.compress) * g.w) / 100 + g.shift
}

// Catmull-Rom through the samples, emitted as cubic Béziers: C1-continuous, so no facets at any zoom.
function smoothPath(pts: [number, number][]) {
  const f = (n: number) => n.toFixed(1)
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, pts.length - 1)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

function buildPath(cords: Cord[], morph: number, g: Grid) {
  const e = easeInOutCubic(clamp01(morph))
  const drift = e * DRIFT * g.h
  let d = ''
  for (const { from, column } of cords) {
    const tx = columnX(column, g)
    const pts = from.map(([fx, fy], k): [number, number] => {
      const ty = lineY(k / SAMPLES, g.h)
      return [fx + (tx - fx) * e, fy + (ty - fy) * e + drift]
    })
    d += smoothPath(pts)
  }
  return d
}

type MorphingRingsProps = {
  /** 0 = hero rings, 1 = straight, evenly spaced column lines. */
  morph: MotionValue<number>
  columns: number
  strokeWidth: MotionValue<number>
  stroke: MotionValue<string>
  /** 0 = evenly spaced columns, 1 = compressed rhythm (grid geometry in vw, matching the red panels). */
  compress: MotionValue<number>
  /** Horizontal shift of the whole grid in px. */
  shift: MotionValue<number>
  compressStart: number
  compressGap: number
}

export function MorphingRings({
  morph,
  columns,
  strokeWidth,
  stroke,
  compress,
  shift,
  compressStart,
  compressGap,
}: MorphingRingsProps) {
  const { w, h } = useViewport()
  const cords = useMemo(() => buildCords(w, h, columns), [w, h, columns])
  const tiers = useMemo(() => [0, 1, 2].map((tier) => cords.filter((c) => c.tier === tier)), [cords])
  const d0 = useMotionValue('')
  const d1 = useMotionValue('')
  const d2 = useMotionValue('')

  useEffect(() => {
    const update = () => {
      const g: Grid = {
        w,
        h,
        columns,
        start: compressStart,
        gap: compressGap,
        compress: compress.get(),
        shift: shift.get(),
      }
      const t = morph.get()
      d0.set(buildPath(tiers[0], t, g))
      d1.set(buildPath(tiers[1], t, g))
      d2.set(buildPath(tiers[2], t, g))
    }
    update()
    const stops = [morph.on('change', update), compress.on('change', update), shift.on('change', update)]
    return () => stops.forEach((stop) => stop())
  }, [d0, d1, d2, morph, compress, shift, tiers, w, h, columns, compressStart, compressGap])

  const opacity1 = useTransform(morph, FADE_WAVES[0], [0.85, 0])
  const opacity2 = useTransform(morph, FADE_WAVES[1], [0.85, 0])

  // The hero keeps its left side dark; the fade lifts as the cords straighten so the grid spans the full width.
  const maskImage = useTransform(
    morph,
    (t) => `linear-gradient(to right, transparent ${15 * (1 - t)}%, black ${65 * (1 - t)}%)`,
  )

  return (
    <motion.svg
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      <motion.path d={d2} style={{ stroke, opacity: opacity2 }} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <motion.path d={d1} style={{ stroke, opacity: opacity1 }} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <motion.path d={d0} style={{ stroke }} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </motion.svg>
  )
}
