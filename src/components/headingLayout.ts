// Per-word placement for a heading whose words shrink independently around one fixed anchor.
//
// Words are laid out by the browser at scale 1 (their final size). The oversized peak is a uniform scale of
// that layout around one fixed anchor inside the heading (horizontal centre of line 1, on the boundary
// between the lines). Nothing re-centres or reflows: each word interpolates on its own from its peak box to
// its final box. Because the anchor sits inside the heading, a shrinking word moves *toward* it — so a word
// that has already shrunk lands in its final slot, which lies underneath its still-oversized neighbour.

export type HeadingMetrics = {
  /** Per word: left offset and width inside its line (layout px, scale 1), and its line index. */
  words: { x: number; w: number; line: number }[]
  /** Per line: horizontal offset of the line inside the block while shrinking (line 2 starts centred). */
  lineOffsets: number[]
  /** Horizontal anchor of the peak scale, in block px (centre of line 1). */
  anchorX: number
  /** Height of one line box (layout px). */
  lineHeight: number
}

export function wordOffset(m: HeadingMetrics | null, scale: number, peak: number, index: number) {
  if (!m || peak - 1 < 0.001) return { x: 0, y: 0 }

  // 0 at peak size → 1 at final size.
  const progress = Math.min(Math.max((peak - scale) / (peak - 1), 0), 1)

  const { x, line } = m.words[index]
  // Final bottom-left corner of the word (transform origin), in block coordinates.
  const finalX = m.lineOffsets[line] + x
  const finalY = m.lineHeight * (line + 1)
  // Fixed anchor: centre of line 1, on the boundary between line 1 and line 2.
  const anchorX = m.anchorX
  const anchorY = m.lineHeight
  // Same corner in the uniformly-scaled peak layout.
  const peakX = anchorX + (finalX - anchorX) * peak
  const peakY = anchorY + (finalY - anchorY) * peak

  return { x: (1 - progress) * (peakX - finalX), y: (1 - progress) * (peakY - finalY) }
}
