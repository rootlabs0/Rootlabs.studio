import { useRef, type ReactNode } from 'react'
import { useEntrance } from './useEntrance'

// A block that fades up as it scrolls into view. Children marked .ss-rise animate; the block itself does too if it
// carries .ss-rise.
export function Entrance({
  children,
  className,
  threshold,
}: {
  children: ReactNode
  className?: string
  threshold?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEntrance(ref, threshold)
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
