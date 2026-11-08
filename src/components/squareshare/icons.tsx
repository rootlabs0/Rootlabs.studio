import type { ReactNode } from 'react'

export type IconName = 'arrowUpRight' | 'plus' | 'layoutGrid' | 'waypoints' | 'chartColumn' | 'rotateCcw'

// Path data from Lucide (ISC license), the icon set squareshare.eu uses, inlined so the showcase draws exactly the
// glyphs the live site does.
const PATHS: Record<IconName, ReactNode> = {
  arrowUpRight: (
    <>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  layoutGrid: (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ),
  waypoints: (
    <>
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="m10.2 6.3-3.9 3.9" />
      <circle cx="4.5" cy="12" r="2.5" />
      <path d="M7 12h10" />
      <circle cx="19.5" cy="12" r="2.5" />
      <path d="m13.8 17.7 3.9-3.9" />
      <circle cx="12" cy="19.5" r="2.5" />
    </>
  ),
  chartColumn: (
    <>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </>
  ),
  rotateCcw: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
}

export function Icon({ name, className, strokeWidth = 2 }: { name: IconName; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}

// The Square Share mark: three flush squares make an L (square), and a smaller, detached L sits up and to the right
// (share).
export function SquareShareLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width="22"
      height="22"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="0" y="1" width="3" height="3" />
      <rect x="0" y="4" width="3" height="3" />
      <rect x="3" y="4" width="3" height="3" />
      <rect x="4" y="0" width="3" height="1" />
      <rect x="6" y="0" width="1" height="3" />
    </svg>
  )
}
