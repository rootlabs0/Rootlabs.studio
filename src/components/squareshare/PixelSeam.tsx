import type { CSSProperties } from 'react'

// Deterministic pseudo-random in [0, 1): the same scatter on every load.
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

// How deep the upper colour runs in each column. Each column heads for a fresh random depth but moves at most 1 row
// from its neighbor (2, now and then), so the edge looks noisy without tall one-column drips. `seed` picks another
// scatter (0 is the hero seam's).
function skylineDepths(cols: number, rows: number, minDepth: number, seed = 0): number[] {
  const span = rows - minDepth + 1
  const out: number[] = []
  let d = minDepth + Math.floor(seededRandom(2.7 + seed) * span)
  for (let c = 0; c < cols; c++) {
    if (c > 0) {
      const target = minDepth + Math.floor(seededRandom(c * 1.37 + 0.5 + seed * 7.3) * span)
      const limit = seededRandom(c * 5.1 + 9 + seed * 3.1) < 0.22 ? 2 : 1
      d = Math.min(d + limit, Math.max(d - limit, target))
    }
    out.push(d)
  }
  return out
}

// The light ground under the skyline, as one path so no seams show between cells. The black above it is left
// transparent: that is the hero showing through, so the hero's cursors can pass behind the light squares.
function groundPath(depths: number[], rows: number): string {
  let d = `M0 ${rows}`
  depths.forEach((depth, c) => {
    d += `V${depth}H${c + 1}`
  })
  return `${d}V${rows}Z`
}

// The upper colour above the skyline, as one path: the exact complement of groundPath.
function skyPath(depths: number[]): string {
  let d = 'M0 0'
  depths.forEach((depth, c) => {
    d += `V${depth}H${c + 1}`
  })
  return `${d}V0Z`
}

// Column counts per showcase width, so the cells stay roughly 25 to 50px square. The stylesheet shows one band at
// a time with container queries. xl and xxl are for the full-bleed Rootlabs layout (80rem and 120rem up).
const BANDS = [
  { cols: 10, className: 'ss-seam__band ss-seam__band--s' },
  { cols: 18, className: 'ss-seam__band ss-seam__band--m' },
  { cols: 28, className: 'ss-seam__band ss-seam__band--l' },
  { cols: 40, className: 'ss-seam__band ss-seam__band--xl' },
  { cols: 56, className: 'ss-seam__band ss-seam__band--xxl' },
] as const

// The jagged pixel edge where the black hero meets the light panel: black runs down into the light as a ragged
// skyline of squares instead of a flat line. Static and decorative.
//
// edge="out" (Rootlabs host) is the light panel's bottom edge, the same squares the other way round: the next
// section's colour (--ss-seam-next) rises into the light as a skyline. Both colours are drawn there, since nothing
// shows through from behind.
export function PixelSeam({
  rows = 4,
  minDepth = 1,
  edge = 'in',
  seed = 0,
}: {
  rows?: number
  minDepth?: number
  edge?: 'in' | 'out'
  seed?: number
}) {
  return (
    <div className={edge === 'out' ? 'ss-seam ss-seam--out' : 'ss-seam'} aria-hidden="true">
      {BANDS.map((band) => {
        const depths = skylineDepths(band.cols, rows, minDepth, seed)
        return (
          <div key={band.cols} className={band.className} style={{ '--cols': band.cols, '--rows': rows } as CSSProperties}>
            <svg viewBox={`0 0 ${band.cols} ${rows}`} preserveAspectRatio="none" shapeRendering="crispEdges" focusable="false">
              {edge === 'out' ? (
                <>
                  <path d={skyPath(depths)} />
                  <path className="ss-seam__next" d={groundPath(depths, rows)} />
                </>
              ) : (
                <path d={groundPath(depths, rows)} />
              )}
            </svg>
          </div>
        )
      })}
    </div>
  )
}
