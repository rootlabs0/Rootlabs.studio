import type { CSSProperties } from 'react'
import { steppedClip } from './steppedClip'

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
  /** Cream-monochrome media. */
  glass?: boolean
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
  glass = false,
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
          background: placeholder,
        }}
      >
        {src && (
          <img src={src} alt={alt} className={`size-full object-cover ${glass ? 'grayscale mix-blend-multiply' : ''}`} draggable={false} />
        )}
        {glass && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,241,211,0.35) 0%, rgba(255,241,211,0) 45%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 0 1px rgba(255,241,211,0.4)',
            }}
          />
        )}
      </div>
    </div>
  )
}
