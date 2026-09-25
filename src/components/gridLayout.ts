// The page's vertical grid once it has compressed into its final, narrow rhythm. Shared by the scroll stage
// (which animates into it) and any section that continues the grid below the stage.

export const COLUMNS = 6
export const COLUMN_WIDTH = 100 / COLUMNS // vw, width of a column while the grid is still spread out
export const COMPRESS_START = 30 // vw, left edge of the compressed grid
export const COMPRESS_GAP = 6.75 // vw — six columns spanning the same 30–70.5vw band the heading is laid out against

/** Line positions (vw) of the compressed grid: one line per column's left edge. */
export const COMPRESSED_LINES = Array.from({ length: COLUMNS }, (_, i) => COMPRESS_START + i * COMPRESS_GAP)
