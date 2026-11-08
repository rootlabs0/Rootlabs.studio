// Polygon with `steps` pixel-steps of `step` px cut from every corner, so notches stay crisp at any frame size.
export function steppedClip(steps: number, step: number): string {
  const pts: string[] = []
  const corner = (xSign: 1 | -1, ySign: 1 | -1) => {
    const x = (i: number) => (xSign === 1 ? `${i * step}px` : `calc(100% - ${i * step}px)`)
    const y = (i: number) => (ySign === 1 ? `${i * step}px` : `calc(100% - ${i * step}px)`)
    // Walk the notch from the edge just before the corner to the edge just after it.
    const out: string[] = [`${x(steps)} ${y(0)}`]
    for (let i = steps; i > 0; i--) {
      out.push(`${x(i)} ${y(steps - i + 1)}`, `${x(i - 1)} ${y(steps - i + 1)}`)
      if (i > 1) out.push(`${x(i - 1)} ${y(steps - i + 2)}`)
    }
    return out
  }
  // Clockwise: top-left, top-right, bottom-right, bottom-left (each notch reversed to keep winding).
  const tl = corner(1, 1).reverse()
  const tr = corner(-1, 1)
  const br = corner(-1, -1).reverse()
  const bl = corner(1, -1)
  pts.push(...tl, ...tr, ...br, ...bl)
  return `polygon(${pts.join(', ')})`
}
