import { cubicBezier, motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionStyle, type MotionValue } from 'framer-motion'
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// "Network" section: a white SquareShare logo card holds the centre of a stage that arrives fully tiled in lime cuboids.
// As the page scrolls on, the tiles break away one by one, lifting off the grid towards the camera (showing their
// grey sides) and fading, until the dark stage, the card and its CTA are revealed. The stage is sticky; scroll
// progress drives every tile, so the dismantling is fully scrubbed both ways.
//
// The tile motion is written as an assembly (tile lands at t0 → t0 + LAND) and driven by the *inverted* progress,
// so the section plays it backwards: the last tile to "land" is the first to leave.
//
// Grid: square cells of size S, anchored on the viewport centre, so the card fills exactly the central 2×2 cells.
// Each tile is a box whose front face sits in the grid plane and whose grey side faces extend *behind* it. Coming
// in from high z (towards the viewer) under a centred perspective, a tile reads huge and shows the sides that face
// the centre; as it lands at z = 0 those sides disappear behind the front face and neighbouring tiles, leaving
// only the flat grid with its hairline seams.

const INK = '#211e25'
const TILE = '#b5ff50'
const SIDE = '#8a8791'
const LIME = '#b5ff4f'

const SCREENS = 4 // scroll length of the pinned assembly, in viewports
const START_Z = 720 // px towards the viewer a tile starts from (perspective is 1000)
const DEPTH = 0.3 // box depth as a fraction of the cell size
const LAND = 0.34 // share of the section's progress one tile's flight takes (long, so flights overlap and drift)
// How far ahead of a feature tile its covering block moves. Must exceed the feature's own fade window (0.4·LAND)
// so each card sits fully uncovered and solid for a stretch before it fades; t0 + REVEAL_LEAD + LAND must stay
// ≤ ~0.93 so the grid is still complete on entry.
const REVEAL_LEAD = LAND * 0.85
// Sine ease-in-out: each tile eases off the grid, floats, and eases out of view — no hard start or stop at either end.
const float = cubicBezier(0.37, 0, 0.63, 1)

// Deterministic per-cell noise so the landing order looks scattered but never reshuffles between renders.
const noise = (k: number, j: number) => {
  const v = Math.sin(k * 12.9898 + j * 78.233) * 43758.5453
  return v - Math.floor(v)
}

type Feature = { title: string; caption: string; art: string }

// 2×2 feature tiles, stacked in two columns flanking the card (one level with it, one above), each on a 2×2 slot of the grid (odd k and j) so exactly one
// locked grid block sits over it. Their timing sits mid-sequence, among the single tiles: played back, the block
// over each one lifts off in a single piece, uncovering the whole card, and the card follows it out while the rest
// of the grid is still clearing.
// Art is a gradient placeholder until real photography is dropped in.
const FEATURE_TILES: (Feature & { k: number; j: number; t0: number })[] = [
  {
    title: 'Collaborate',
    caption: 'Weekly build sessions',
    art: 'radial-gradient(120% 90% at 70% 20%, #ffb86b 0%, #a3402a 35%, #2a1a1f 75%)',
    k: 1,
    j: -3,
    t0: 0.18,
  },
  {
    title: 'Build',
    caption: 'Rootlabs showcase',
    art: 'radial-gradient(110% 90% at 30% 30%, #d8c4ff 0%, #6a3cf0 40%, #1b1440 80%)',
    k: -3,
    j: -3,
    t0: 0.12,
  },
  {
    title: 'Create',
    caption: 'Studio stories',
    art: 'radial-gradient(120% 100% at 60% 30%, #f1c6d8 0%, #8e4a74 45%, #2a1a26 85%)',
    k: -3,
    j: -1,
    t0: 0.26,
  },
  {
    title: 'Launch',
    caption: 'Community and partner events',
    art: 'radial-gradient(120% 90% at 50% 25%, #ffe28a 0%, #e0762c 35%, #3b2140 80%)',
    k: 1,
    j: -1,
    t0: 0.3,
  },
]

type Tile = { key: string; k: number; j: number; span: 1 | 2; t0: number; feature?: Feature }

// Cell size in px: ~11.4% of the width on desktop (the card is then 2 cells ≈ 23vw), never below 150px so the
// card stays readable on phones.
function useCellSize() {
  const [size, setSize] = useState({ s: 160, w: 1440, h: 900 })
  useLayoutEffect(() => {
    const measure = () =>
      setSize({ s: Math.max(window.innerWidth * 0.114, 150), w: window.innerWidth, h: window.innerHeight })
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return size
}

export function NetworkGrid() {
  const trackRef = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  const { s, w, h } = useCellSize()
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  // 1 on entry (grid complete) → 0 at the end (grid gone).
  const reversed = useTransform(scrollYProgress, (p) => 1 - p)
  // A soft spring on top of Lenis: the tiles trail the scroll slightly and glide to rest, instead of mirroring
  // every tick. Off for reduced motion, where the scroll value is used as is.
  const smoothed = useSpring(reversed, { stiffness: 70, damping: 22, mass: 0.9, restDelta: 0.0005 })
  const assembly = still ? reversed : smoothed

  // The grid is laid out in 2×2 slots, aligned so the card fills one of them (its slot starts at cell −1,−1, so
  // every slot starts on an odd cell). Every slot splits into four single tiles that each move on their own, except
  // the slots over the feature tiles: those stay locked together and lift as one wide 2×2 block, so each feature is
  // revealed as a single surface rather than piecemeal. Landing order is scattered, loosely from the card
  // outwards, and finishes by ~0.92 of the assembly, so on entry the full grid holds for a beat before the
  // outermost tiles start breaking away.
  const tiles = useMemo(() => {
    const kMin = -Math.ceil(w / 2 / s)
    const kMax = Math.ceil(w / 2 / s) - 1
    const jMin = -Math.ceil(h / 2 / s)
    const jMax = Math.ceil(h / 2 / s) - 1
    const reach = Math.max(-kMin, -jMin, 1)
    const list: Tile[] = FEATURE_TILES.map(({ k, j, t0, ...feature }) => ({
      key: `f${k},${j}`,
      k,
      j,
      span: 2,
      t0,
      feature,
    }))
    const oddAtOrBelow = (n: number) => (Math.abs(n % 2) === 1 ? n : n - 1)
    const slots: [number, number][] = []
    for (let k = oddAtOrBelow(kMin); k <= kMax; k += 2) {
      for (let j = oddAtOrBelow(jMin); j <= jMax; j += 2) {
        if (!(k === -1 && j === -1)) slots.push([k, j]) // skip the card's slot
      }
    }
    // Slot → the feature tile beneath it (if any).
    const featureAt = new Map(FEATURE_TILES.map((f) => [`${f.k},${f.j}`, f]))

    // Start time: noise for scatter, plus distance of (dk, dj) from the card centre for a loose outward order.
    const timing = (k: number, j: number, dk: number, dj: number) =>
      0.12 + 0.46 * (0.55 * noise(k, j) + 0.45 * (Math.max(Math.abs(dk), Math.abs(dj)) / reach))
    for (const [k, j] of slots) {
      const under = featureAt.get(`${k},${j}`)
      if (under) {
        // Lands most of a flight after the feature beneath, so played back it's fully clear shortly after the
        // feature starts to rise, leaving the card uncovered and solid for a stretch before it fades.
        list.push({ key: `${k},${j}`, k, j, span: 2, t0: under.t0 + REVEAL_LEAD })
        continue
      }
      for (const [ck, cj] of [
        [k, j],
        [k + 1, j],
        [k, j + 1],
        [k + 1, j + 1],
      ]) {
        list.push({ key: `${ck},${cj}`, k: ck, j: cj, span: 1, t0: timing(ck, cj, ck + 0.5, cj + 0.5) })
      }
    }
    // Feature tiles always paint underneath the grid, so a full grid covers them completely; among grid tiles,
    // later landings paint over earlier ones (tiles don't share a 3D context, so there's no z-fighting).
    return list.sort((a, b) => Number(!a.feature) - Number(!b.feature) || a.t0 - b.t0)
  }, [s, w, h])

  return (
    <section
      ref={trackRef}
      data-snap="start"
      className="relative z-20"
      style={{ height: `${SCREENS * 100}dvh`, backgroundColor: INK }}
    >
      {/* A snap point per screen, so each gesture advances the assembly by one stage. */}
      {Array.from({ length: SCREENS - 1 }, (_, i) => (
        <div
          key={i}
          aria-hidden
          data-snap="start"
          className="pointer-events-none absolute inset-x-0 h-px"
          style={{ top: `${(i + 1) * 100}dvh` }}
        />
      ))}

      <div className="sticky top-0 h-dvh overflow-hidden">
        <StripedBackdrop still={still} progress={scrollYProgress} cell={s} />

        {/* CTA sits under the tiles, in the cell row below the card: hidden on entry, uncovered as the grid clears. */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: `calc(50% + ${s + 20}px)` }}>
          <a
            href="#join"
            className="inline-block px-5 py-2 text-lg font-medium tracking-tight text-charcoal transition-[filter] hover:brightness-95 md:text-2xl"
            style={{ backgroundColor: LIME, clipPath: PIXEL_CLIP }}
          >
            Build your store now
          </a>
        </div>

        {/* Companion headings flanking the logo card, one gutter off its edges, vertically centred between the
            "SquareShare" and date backdrop lines. Like the CTA they sit under the tiles and are uncovered as the grid
            clears. Hidden on phones, where the card fills the width. */}
        <FlankHeading side="left" cell={s} title={['Your shop,', 'live in minutes']} />
        <FlankHeading side="right" cell={s} title={['1 November', '2026']} />

        <div className="absolute inset-0" style={{ perspective: 1000, perspectiveOrigin: '50% 50%' }}>
          {tiles.map((tile) => (
            <GridTile key={tile.key} tile={tile} size={s} progress={assembly} still={still} />
          ))}
        </div>

        <NetworkCard size={s} assembly={assembly} still={still} />
      </div>
    </section>
  )
}

function GridTile({
  tile,
  size,
  progress,
  still,
}: {
  tile: Tile
  size: number
  progress: MotionValue<number>
  still: boolean
}) {
  const edge = size * tile.span
  const depth = size * DEPTH * (tile.span === 2 ? 1.5 : 1) // 2×2 blocks lift as chunkier slabs
  const { t0 } = tile
  const z = useTransform(progress, [t0, t0 + LAND], [still ? 0 : START_Z, 0], { ease: float })
  const opacity = useTransform(progress, [t0, t0 + LAND * 0.4], [0, 1], { ease: float })
  // Extrusion (0 = flat, 1 = full box depth). A tile seated in the grid has no sides at all — otherwise its sides,
  // which run behind it, would paint grey slivers over its neighbours. The moment it starts to lift, the depth
  // snaps out over the first sliver of travel (while the tile has barely moved, so it reads as unfolding, not
  // popping) and then holds at full depth for the rest of the flight, fade included.
  const extrude = useTransform(progress, [t0 + LAND * 0.9, t0 + LAND], [still ? 0 : 1, 0])

  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${tile.k * size}px)`,
        top: `calc(50% + ${tile.j * size}px)`,
        width: edge,
        height: edge,
        z,
        // No opacity here: opacity < 1 on a preserve-3d element flattens it, collapsing the sides into the front
        // for the whole fade. The box stays opaque and each face fades on its own instead.
        // CSS variable read by the side faces (MotionStyle doesn't type custom properties).
        ...({ '--extrude': extrude } as MotionStyle),
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Side faces hinge back from the front's edges into −z, scaled along their depth by --extrude. */}
      <Side opacity={opacity} className="left-full top-0 h-full" style={{ width: depth, transformOrigin: '0 50%', transform: 'rotateY(90deg) scaleX(var(--extrude))' }} />
      <Side opacity={opacity} className="right-full top-0 h-full" style={{ width: depth, transformOrigin: '100% 50%', transform: 'rotateY(-90deg) scaleX(var(--extrude))' }} />
      <Side opacity={opacity} className="bottom-full left-0 w-full" style={{ height: depth, transformOrigin: '50% 100%', transform: 'rotateX(90deg) scaleY(var(--extrude))' }} />
      <Side opacity={opacity} className="top-full left-0 w-full" style={{ height: depth, transformOrigin: '50% 0', transform: 'rotateX(-90deg) scaleY(var(--extrude))' }} />
      <motion.div className="absolute inset-0 border" style={{ opacity, borderColor: INK, backgroundColor: TILE }}>
        {tile.feature ? (
          <FeatureFace feature={tile.feature} />
        ) : tile.span === 2 ? (
          // The block's inner seams, so a seated block reads as four grid cells.
          <>
            <span aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2" style={{ backgroundColor: INK }} />
            <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ backgroundColor: INK }} />
          </>
        ) : null}
      </motion.div>
    </motion.div>
  )
}

// Outer div is placed in 3D; the inner one carries the fade (a fading leaf has nothing to flatten).
function Side({ className, style, opacity }: { className: string; style: CSSProperties; opacity: MotionValue<number> }) {
  return (
    <div className={`absolute ${className}`} style={{ ...style, backfaceVisibility: 'hidden' }}>
      <motion.div className="size-full border" style={{ opacity, borderColor: INK, backgroundColor: SIDE }} />
    </div>
  )
}

function FeatureFace({ feature }: { feature: Feature }) {
  return (
    <div className="@container flex size-full flex-col text-white" style={{ backgroundColor: INK }}>
      <div className="flex-1" style={{ background: feature.art }} />
      <div className="px-[6cqw] pb-[6cqw] pt-[4cqw]">
        <div className="text-[13cqw] font-semibold leading-none tracking-tight">{feature.title}</div>
        <div className="mt-[2.5cqw] text-[3.2cqw] font-semibold uppercase tracking-[0.18em]">{feature.caption}</div>
      </div>
    </div>
  )
}

// The centre card: exactly the central 2×2 cells, filled edge to edge by the SquareShare logo (one of the products
// the studio builds), drawn inline as vectors so it can build itself.
//
// Logo geometry, in the source artwork's 1080-unit square: an L made of a 540 square at (225, 312) minus its
// top-right 270 quadrant, plus a corner bracket that is exactly that quadrant, moved (+90, −84) and hollowed to its
// top and right edges (83 units thick). So the mark starts as one solid square; as the grid begins to clear, the
// top-right quadrant detaches and travels diagonally up and out to its final place while its inner fill collapses
// away towards its bottom-left, leaving the bracket. The morph runs on the same spring-smoothed progress and float
// easing as the tiles, spanning one tile flight from the moment the first squares lift.
const LOGO_SHIFT = { x: 90, y: -84 }
const QUADRANT = { x: 495, y: 312, size: 270, stroke: 83 }
const SEAM = 2 // units of overlap with the L while docked
const MORPH: [number, number] = [0.92, 0.92 - LAND] // in assembly terms (1 = full grid)

function NetworkCard({ size, assembly, still }: { size: number; assembly: MotionValue<number>; still: boolean }) {
  // 0 = solid square, 1 = final logo.
  const morph = useTransform(assembly, MORPH, [still ? 1 : 0, 1], { ease: float })
  // The quadrant's origin as it travels. Each rect's own x/y attributes are animated (a motion-value `transform`
  // attribute on a group isn't applied, which left the piece stuck in its slot).
  // Keep the mark's bounding box centred in the card throughout: docked, the solid square's centre is half the
  // piece's travel away from the finished logo's (which is centred at 540, 540), so the whole mark is offset by
  // that amount and eases to zero as the piece reaches its final place.
  const ox = useTransform(morph, (m) => (-LOGO_SHIFT.x / 2) * (m - 1))
  const oy = useTransform(morph, (m) => (-LOGO_SHIFT.y / 2) * (m - 1))
  const lColX = useTransform(ox, (x) => 225 + x)
  const lRowX = useTransform(ox, (x) => 494 + x)
  const lColY = useTransform(oy, (y) => 312 + y)
  const lRowY = useTransform(oy, (y) => 582 + y)
  const qx = useTransform([morph, ox], ([m, x]: number[]) => QUADRANT.x + LOGO_SHIFT.x * m + x)
  const qy = useTransform([morph, oy], ([m, y]: number[]) => QUADRANT.y + LOGO_SHIFT.y * m + y)
  // While docked, the piece overlaps the L by SEAM units on the edges it shares with it (its left and bottom), so
  // antialiasing leaves no hairline where the two meet; the overlap fades out as it detaches.
  const pad = useTransform(morph, (m) => SEAM * (1 - m))
  const inner = QUADRANT.size - QUADRANT.stroke
  const topBarX = useTransform([qx, pad], ([x, p]: number[]) => x - p)
  const topBarW = useTransform(pad, (p) => QUADRANT.size + p)
  const rightBarX = useTransform(qx, (x) => x + inner)
  const rightBarH = useTransform(pad, (p) => QUADRANT.size + p)
  // Inner fill: the quadrant minus its bracket. It retracts into the bracket's inside corner (top-right) as the
  // piece travels, so the piece always reads as one solid block closing up into the corner shape. It overlaps the
  // bracket by 1 unit so no seam shows between them.
  const fillSize = useTransform([morph, pad], ([m, p]: number[]) => (inner + 1 + p) * (1 - m))
  const fillX = useTransform([qx, fillSize], ([x, size]: number[]) => x + inner + 1 - size)
  const fillY = useTransform(qy, (y) => y + QUADRANT.stroke - 1)

  return (
    <svg
      role="img"
      aria-label="SquareShare"
      viewBox="0 0 1080 1080"
      className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border bg-white"
      style={{ width: size * 2, height: size * 2, borderColor: INK }}
      fill="#000"
    >
      {/* The L: left column and bottom row of the 540 square. */}
      <motion.rect x={lColX} y={lColY} width={270} height={540} />
      <motion.rect x={lRowX} y={lRowY} width={271} height={270} />
      {/* The travelling quadrant: bracket (top bar + right bar) and the fill that collapses out of it. */}
      <motion.rect x={topBarX} y={qy} width={topBarW} height={QUADRANT.stroke} />
      <motion.rect x={rightBarX} y={qy} width={QUADRANT.stroke} height={rightBarH} />
      <motion.rect x={fillX} y={fillY} width={fillSize} height={fillSize} />
    </svg>
  )
}

function FlankHeading({
  side,
  cell,
  title,
}: {
  side: 'left' | 'right'
  cell: number
  title: [string, string]
}) {
  const gap = `calc(${cell}px + clamp(1.5rem, 3vw, 3.5rem))` // from the centre to the heading's inner edge
  return (
    <div
      className={`absolute hidden max-w-[22vw] -translate-y-1/2 text-white md:block ${
        side === 'left' ? 'text-right' : 'text-left'
      }`}
      style={{
        // Midway between the "SquareShare" line's bottom (centre − cell − 1vh) and the date line's top (≈ centre).
        top: `calc(50% - ${cell / 2}px)`,
        ...(side === 'left' ? { right: `calc(50% + ${gap})` } : { left: `calc(50% + ${gap})` }),
      }}
    >
      <h3 className="text-[clamp(1.4rem,2.4vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
        {title[0]}
        <br />
        {title[1]}
      </h3>
    </div>
  )
}

// Backdrop behind the grid, drawn only as fine horizontal scan lines so it reads as texture, not text. Top half:
// "SquareShare", still. Bottom half: the launch date "1/11/26" on a conveyor belt, repeating and sliding steadily
// left on a seamless loop (two identical copies of the strip; moving by one copy's width lands exactly where it
// started).
const scanlines = (alpha: number) =>
  `repeating-linear-gradient(to bottom, rgba(255,255,255,${alpha}) 0 1px, transparent 1px 6px)`
const SCANLINES: CSSProperties = {
  backgroundImage: scanlines(0.09),
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
}
// The "SquareShare" scan lines brighten from the backdrop grey to near-white while the last content cards (Build and
// Collaborate, the upper pair) and the final squares are lifting away (~0.55–0.88), finishing just as the grid is
// gone. Same line pattern throughout.
const HEADING_BRIGHTEN: [number, number] = [0.55, 0.86]
const BACKDROP_TYPE = 'whitespace-nowrap font-semibold leading-none tracking-[-0.05em] text-transparent'
const CONVEYOR_ITEMS = 4 // dates per strip copy; enough that one copy is wider than any viewport
const CONVEYOR_SECONDS = 28 // time for the belt to move one copy's width

function StripedBackdrop({ still, progress, cell }: { still: boolean; progress: MotionValue<number>; cell: number }) {
  const headingLines = useTransform(progress, HEADING_BRIGHTEN, [0.09, 0.9], { ease: float })
  const headingImage = useTransform(headingLines, scanlines)
  const strip = (copy: number) => (
    <span key={copy} className="flex shrink-0" aria-hidden={copy > 0}>
      {Array.from({ length: CONVEYOR_ITEMS }, (_, i) => (
        <span key={i} className={`${BACKDROP_TYPE} pr-[0.35em]`} style={SCANLINES}>
          1/11/26
        </span>
      ))}
    </span>
  )

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
      {/* Sits entirely above the logo card: its box ends 1vh above the card's top edge (centre − one cell). */}
      <div
        className="absolute inset-x-0 top-0 flex items-end justify-center"
        style={{ bottom: `calc(50% + ${cell}px + 1vh)` }}
      >
        <motion.span
          className={BACKDROP_TYPE}
          style={{
            ...SCANLINES,
            backgroundImage: headingImage,
            // Never taller than the room above the card, so it can't spill over it or off the top on short screens.
            fontSize: `min(40vh, 17vw, calc(50vh - ${cell}px - 1vh))`,
          }}
        >
          SquareShare
        </motion.span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-1/2 items-start pt-[1vh] text-[min(40vh,24vw)]">
        <motion.div
          className="flex"
          animate={still ? undefined : { x: ['0%', '-50%'] }}
          transition={{ duration: CONVEYOR_SECONDS, ease: 'linear', repeat: Infinity }}
        >
          {strip(0)}
          {strip(1)}
        </motion.div>
      </div>
    </div>
  )
}

// Two-step pixel notch on every corner, matching the site's stepped button shapes.
const PIXEL_CLIP =
  'polygon(6px 0, calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px), 0 6px, 3px 6px, 3px 3px, 6px 3px)'
