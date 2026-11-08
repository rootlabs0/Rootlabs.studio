import { useRef, type CSSProperties } from 'react'
import { ASSET_BASE, TILES } from './data'
import { replayEntrance, useEntrance } from './useEntrance'
import { Icon } from './icons'

// The storefront grid, built tile by tile as it scrolls into view: each product drops into its cell, and the two
// big tiles then grow from one cell to their full 2 x 2. Dashed guides show the empty cells while it builds.
// "Replay build" runs it again.
export function BuildPreview() {
  const frameRef = useRef<HTMLDivElement>(null)
  useEntrance(frameRef, 0.4)

  const replay = () => {
    if (frameRef.current) replayEntrance(frameRef.current)
  }

  return (
    <div className="ss-build">
      <div
        ref={frameRef}
        role="img"
        aria-label="A Square Share storefront: six product photos in a four by three grid"
        className="ss-build__frame"
      >
        <div className="ss-build__inner" aria-hidden="true">
          <div className="ss-build__guides">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="ss-build__guide" />
            ))}
          </div>
          <div className="ss-build__grid">
            {TILES.map((tile, i) => {
              const big = tile.cw > 1 || tile.rh > 1
              const style = {
                gridColumn: `${tile.col} / span ${tile.cw}`,
                gridRow: `${tile.row} / span ${tile.rh}`,
                '--ss-i': i,
                // A big tile lands at about one cell's size, then grows.
                '--ss-from': big ? 0.48 : 1,
              } as CSSProperties
              return (
                <div key={tile.id} className="ss-tile" style={style}>
                  <img
                    src={`${ASSET_BASE}/${tile.file}`}
                    alt=""
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className="ss-build__bar">
        <button type="button" className="ss-replay hit-area" onClick={replay}>
          <Icon name="rotateCcw" className="ss-replay__icon" />
          Replay build
        </button>
      </div>
    </div>
  )
}
