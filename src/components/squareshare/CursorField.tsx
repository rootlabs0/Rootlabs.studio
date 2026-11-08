import type { CSSProperties } from 'react'
import type { CursorSpec } from './data'

// The arrow's box, with its tip at (4, 2.2), so the stylesheet can place, turn, and mask it about the tip.
const VIEW_BOX = '2.5 0.7 15.7 21.8'
const POINTER = 'M4 2.2 L4 18.8 L8.3 14.6 L11.1 21 L13.8 19.8 L11 13.5 L16.7 13.2 Z'

function Glyph({ plain }: { plain?: boolean }) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" focusable="false">
      <path d={POINTER} className={plain ? 'ss-ink ss-ink--plain' : 'ss-ink'} />
    </svg>
  )
}

// One cursor: up to three copies of the arrow stacked (softer, soft, sharp), masked so a "tip" cursor is in focus at
// the tip and blurred toward the tail.
function Cursor({ spec, index }: { spec: CursorSpec; index: number }) {
  const { focus, blur = 0, plain } = spec
  const ranged = focus === 'tip'
  const style = {
    '--x': spec.x,
    '--y': spec.y,
    '--w': spec.w,
    '--alpha': spec.alpha ?? 1,
    '--rz': `${spec.rz}deg`,
    '--rx': `${spec.rx ?? 0}deg`,
    // The 80rem+ layout (see .ss-cursor in the 80rem container query); unset falls back to x / y / rz.
    ...(spec.lg ? { '--lx': spec.lg.x, '--ly': spec.lg.y, '--lrz': `${spec.lg.rz}deg` } : {}),
    '--soft': `${ranged ? blur * 0.3 : blur}px`,
    '--softer': `${blur}px`,
    '--pad': `${Math.ceil(blur * 2.5)}px`,
    // Each arrives a beat after the last, and drifts on its own clock.
    '--delay': `${(0.1 + index * 0.07).toFixed(2)}s`,
    '--drift': `${4 + spec.depth * 0.5}px`,
    '--drift-time': `${9 + ((index * 29) % 7)}s`,
    '--drift-delay': `${-((index * 17) % 9)}s`,
  } as CSSProperties

  return (
    <div className="ss-cursor" data-focus={focus} data-wide={spec.wide ? '' : undefined} style={style}>
      <div className="ss-cursor__enter">
        <div className="ss-cursor__drift">
          <div className="ss-cursor__tilt">
            {ranged ? (
              <div className="ss-cursor__layer ss-cursor__layer--softer">
                <Glyph plain={plain} />
              </div>
            ) : null}
            {focus !== 'all' ? (
              <div className="ss-cursor__layer ss-cursor__layer--soft">
                <Glyph plain={plain} />
              </div>
            ) : null}
            {focus !== 'none' ? (
              <div className="ss-cursor__layer ss-cursor__layer--sharp">
                <Glyph plain={plain} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

// Arrow cursors hanging round the hero's words at different depths. Pure markup and CSS.
export function CursorField({ cursors }: { cursors: readonly CursorSpec[] }) {
  return (
    <div className="ss-cursors" aria-hidden="true">
      {cursors.map((spec, i) => (
        <Cursor key={i} spec={spec} index={i} />
      ))}
    </div>
  )
}
