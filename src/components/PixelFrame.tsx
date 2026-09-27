import type { CSSProperties } from 'react'

// Polygon with `steps` pixel-steps of `step` px cut from every corner, so notches stay crisp at any frame size.
function steppedClip(steps: number, step: number): string {
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

export type PixelFrameProps = {
  /** Media to show; without it `placeholder` fills the frame. */
  src?: string
  alt?: string
  /** CSS background used until a real image is slotted in. */
  placeholder?: string
  /** Notches per corner and their size in px. */
  steps?: number
  step?: number
  /** Outline thickness in px and colour; 0 disables. */
  outline?: number
  outlineColor?: string
  className?: string
  style?: CSSProperties
}

// A stepped-corner media frame with a hairline outline that follows the notches. Size and position come from
// className, so frames can be stacked freely (see AboutSection) and any <img> can be dropped in via `src`.
export function PixelFrame({
  src,
  alt = '',
  placeholder = '#3b2519',
  steps = 2,
  step = 4,
  outline = 1.5,
  outlineColor = '#22201f',
  className,
  style,
}: PixelFrameProps) {
  return (
    <div
      className={`relative ${className ?? ''}`}
      style={{ clipPath: steppedClip(steps, step), backgroundColor: outlineColor, ...style }}
    >
      {/* Same silhouette, inset by the outline width, so the outer colour shows as a stepped border. */}
      <div
        className="absolute"
        style={{
          inset: outline,
          clipPath: steppedClip(steps, Math.max(step - outline / steps, 1)),
          background: src ? undefined : placeholder,
        }}
      >
        {src && <img src={src} alt={alt} className="size-full object-cover" draggable={false} />}
      </div>
    </div>
  )
}
