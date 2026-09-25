// Where a finished scroll gesture should come to rest, for full-screen sections that snap.
//
// Points come in two kinds:
//   - forward points (a section's top): targets for both directions.
//   - up-only points (the end of the tall pinned stage): a target only when scrolling *up* into it, so a
//     downward scroll out of the finished stage never gets pulled back onto it.
// Above the first point (inside the stage) nothing snaps, so scroll-scrubbed animations stay free.
//
// `origin` is where the gesture started (the last place the page came to rest).
//   - Down: go forward to the next forward point. If the gesture already crossed one, land on whichever of
//     that point and the one after is nearer, so overshooting a section slightly stays on it.
//   - Up: mirror image.

export type SnapPoint = { y: number; upOnly: boolean }

export function pickSnapTarget(y: number, origin: number, points: SnapPoint[], epsilon = 4): number | null {
  const all = points.map((p) => p.y).sort((a, b) => a - b)
  // Resting on (or a hair before) the first point is the stage's own finished layout: leave it alone.
  if (all.length === 0 || y <= all[0] + epsilon) return null
  const forward = points
    .filter((p) => !p.upOnly)
    .map((p) => p.y)
    .sort((a, b) => a - b)

  const nearest = (a: number | undefined, b: number | undefined) =>
    a === undefined ? b : b === undefined ? a : Math.abs(a - y) <= Math.abs(b - y) ? a : b
  const lastAtOrBelow = (list: number[]) => list.findLast((p) => p <= y)
  const firstAtOrAbove = (list: number[]) => list.find((p) => p >= y)

  if (y > origin + epsilon) {
    const floor = lastAtOrBelow(forward)
    const ceil = firstAtOrAbove(forward)
    if (floor !== undefined && floor > origin + epsilon) return nearest(floor, ceil) ?? null
    return ceil ?? floor ?? null
  }
  if (y < origin - epsilon) {
    const floor = lastAtOrBelow(all)
    const ceil = firstAtOrAbove(all)
    if (ceil !== undefined && ceil < origin - epsilon) return nearest(ceil, floor) ?? null
    return floor ?? null
  }
  return null
}
