type PixelCollageProps = {
  src?: string
  alt?: string
  className?: string
}

// Stepped outline on a 12×8 pixel grid.
const PIXEL_CLIP =
  'polygon(0% 25%, 8.33% 25%, 8.33% 12.5%, 41.67% 12.5%, 41.67% 0%, 58.33% 0%, 58.33% 12.5%, 91.67% 12.5%, 91.67% 37.5%, 100% 37.5%, 100% 62.5%, 83.33% 62.5%, 83.33% 87.5%, 58.33% 87.5%, 58.33% 100%, 16.67% 100%, 16.67% 87.5%, 0% 87.5%)'

const PLACEHOLDER_FILL = 'transparent'

export function PixelCollage({ src, alt = '', className }: PixelCollageProps) {
  return (
    <div
      className={`relative aspect-[3/2] w-44 md:w-56 ${className ?? ''}`}
      style={{ clipPath: PIXEL_CLIP }}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <div aria-hidden className="size-full" style={{ background: PLACEHOLDER_FILL }} />
      )}
    </div>
  )
}
