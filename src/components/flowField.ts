// RootFlow's backdrop pieces, shared by FeatureStack (the pinned stage), BridgeSection (which wears the same field)
// and the soft edges where that field meets the site's ink sections, so they stay pixel-identical where they meet.

export const FLOW_BG = '#070915'

// The blueprint grid: 120px major / 24px minor cells. `y` shifts the horizontal lines (the repeat makes any
// offset equivalent to its remainder mod 120px), so a section below the stage can carry its lines on unbroken.
export const flowGrid = (y = '0px') => [
  'linear-gradient(90deg, rgba(136,162,237,0.06) 1px, transparent 1px) -0.5px 0 / 120px 120px',
  `linear-gradient(0deg, rgba(136,162,237,0.06) 1px, transparent 1px) 0 calc(${y} - 0.5px) / 120px 120px`,
  'linear-gradient(90deg, rgba(136,162,237,0.035) 1px, transparent 1px) -0.5px 0 / 24px 24px',
  `linear-gradient(0deg, rgba(136,162,237,0.035) 1px, transparent 1px) 0 calc(${y} - 0.5px) / 24px 24px`,
]

// Soft edge between the field and a neighbouring ink section: a band of field, masked so it fades out toward the
// neighbour. Band heights are whole grid cells (2 × 120px, 3 × 120px from md), so its lines carry on exactly.
export const EDGE_BAND = 'h-[240px] md:h-[360px]'

// The band's mask: an eased ramp, clear on the neighbour's side and solid on `fieldSide`, where the field is.
export const edgeFade = (fieldSide: 'top' | 'bottom') =>
  `linear-gradient(to ${fieldSide}, rgba(0,0,0,0) 0%, rgba(0,0,0,0.03) 12%, rgba(0,0,0,0.12) 26%, rgba(0,0,0,0.3) 42%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.8) 78%, #000 100%)`
