import type { CSSProperties } from 'react'
import { FLOW_BG } from './flowField'
import { SquareShareIntro } from './SquareShareIntro'
import { SquareShareShowcase } from './squareshare/SquareShareShowcase'

// Square Share, the studio's SaaS company, presented as a compact case study, straight after the Features section:
// first the intro (the mark and name announcing the product) on pure black, then the showcase, whose black hero
// takes over from the intro with no seam.
//
// The showcase itself is self-contained (squareshare/, built from SQUARESHARE_SHOWCASE.md): Square Share's own
// tokens, type and motion, scoped under .ss-showcase. It runs full-bleed: its hero, seam and light panel span the
// whole screen, with their content on the same 77vw column as About, Team and Contact (capped at 84rem, see
// --ss-gutter). The light panel closes on a pixel seam, the hero seam's squares the other way round, where RootFlow's
// navy (--ss-seam-next) rises into the light; the Bridge below picks up from that navy and leads into RootFlow.
//
// Wheel snapping: the section top rests on the intro; the showcase adds one rest point per band (hero, steps,
// dashboard), so a gesture walks through the case study instead of jumping straight to the Bridge.

export function SquareShareSection() {
  return (
    <div
      id="squareshare"
      data-snap="start"
      className="relative z-20 bg-black font-geist text-paper"
      style={{ '--ss-seam-next': FLOW_BG } as CSSProperties}
    >
      <SquareShareIntro />
      <SquareShareShowcase />
    </div>
  )
}
