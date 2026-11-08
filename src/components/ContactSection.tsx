import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { EMAIL, SOCIALS } from './contact'
import { EDGE_BAND, FLOW_BG, edgeFade, flowGrid } from './flowField'
import { KineticText } from './KineticText'
import { steppedClip } from './steppedClip'

// Closing call to action, and the target of the nav's Contact links. Dark, on the same 77vw column (88vw on phones)
// and centred grid line as About and Team. The headline answers About's "make the hard stuff easy" and fills the left
// half; the pitch hangs off the grid line beside it. Below, one full-width stepped slab is the action: on hover or
// keyboard focus it fills pixel by pixel from where the pointer came in, a signal-lavender front settling to paper,
// and its label turns ink cell by cell. A slim row underneath carries the address (with a copy button), socials and
// the copyright, so the page ends here.

const PROJECT_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent('New project')}`
const EASE = [0.22, 1, 0.36, 1] as const

// RootFlow's pinned stage sits directly above, so its field carries on over this section's top edge and fades out
// into the ink (flowField's edge band). The grid's lines are shifted by one viewport, the stage's height, so they
// continue the stage's unbroken.
const FLOW_TAIL = [...flowGrid('-100dvh'), FLOW_BG].join(', ')
const FLOW_TAIL_MASK = edgeFade('top')

export function ContactSection() {
  return (
    <section
      id="contact"
      data-snap="start"
      className="relative z-20 flex min-h-svh flex-col overflow-hidden bg-ink text-paper"
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-line" />
      {/* After the grid line, so the line rises out of the fade; the content (relative, below) stays on top. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 ${EDGE_BAND}`}
        style={{ background: FLOW_TAIL, maskImage: FLOW_TAIL_MASK, WebkitMaskImage: FLOW_TAIL_MASK }}
      />

      <div className="relative mx-auto flex w-[88vw] flex-1 flex-col justify-center pb-[5vh] pt-[max(14vh,5rem)] md:w-[77vw]">
        {/* Two halves of the centred column, so the grid line runs between headline and pitch. */}
        <div className="grid items-end gap-5 md:grid-cols-2 md:gap-0">
          {/* Ink backing so the grid line breaks around the heading where they cross (phones). */}
          <div className="w-fit bg-ink py-2 pr-6">
            <span className="inline-block rounded-full border border-paper px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm">
              Contact
            </span>
            {/* 6em wide: breaks after "the" at every size. Sized so "Bring us the" fits the left half from md up. */}
            <KineticText
              as="h2"
              text="Bring us the hard stuff."
              className="mt-3 max-w-[6em] text-[clamp(2.75rem,6.6vw,7.75rem)] font-semibold leading-[0.92] tracking-tight"
              stagger={0.018}
            />
          </div>

          <p className="max-w-[30ch] bg-ink py-1 text-[clamp(1.0625rem,1.35vw,1.3125rem)] leading-snug text-paper/60 md:mb-[1.1vw] md:bg-transparent md:pl-[2vw]">
            Tell us what you’re building and where it’s stuck. We’ll reply with a plan to get it moving.
          </p>
        </div>

        <ProjectSlab className="mt-[clamp(2.5rem,8vh,5.5rem)]" />
      </div>

      {/* Small type, full-size touch targets: every link and the copy button take taps over 44px (hit-area). The
          stacked rows on phones are spaced so those enlarged targets don't overlap. */}
      <div className="relative mx-auto flex w-[88vw] flex-col gap-6 pb-8 text-sm text-paper/55 md:w-[77vw] md:flex-row md:items-center md:justify-between md:gap-4 md:pb-10">
        <div className="flex w-fit items-center gap-3 bg-ink pr-3">
          <a href={`mailto:${EMAIL}`} className="hit-area text-paper/80 transition-colors hover:text-paper">
            {EMAIL}
          </a>
          <CopyEmailButton />
        </div>
        <div className="flex w-fit flex-wrap items-center gap-x-6 gap-y-3 bg-ink md:pl-3">
          <ul className="flex gap-5">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noreferrer" className="hit-area transition-colors hover:text-paper">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
          <span>© {new Date().getFullYear()} Root Labs Studio</span>
        </div>
      </div>
    </section>
  )
}

// The slab's silhouette: two-step notches like the site's other stepped buttons, scaled up for its size. The face is
// inset by the 1px outline, with the step shrunk by the same share (as PixelFrame does).
const SLAB_STEPS = 2
const SLAB_STEP = 6
const SLAB_CLIP = steppedClip(SLAB_STEPS, SLAB_STEP)
const FACE_CLIP = steppedClip(SLAB_STEPS, SLAB_STEP - 1 / SLAB_STEPS)

function ProjectSlab({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const still = useReducedMotion() ?? false
  const fill = usePixelFill(canvasRef, labelRef, still)
  // Filled while hovered or keyboard-focused; each change starts a wave from the given point.
  const hovered = useRef(false)
  const focused = useRef(false)

  const sync = (x?: number, y?: number) => fill.current.set(hovered.current || focused.current, x, y)
  const toCanvas = (event: ReactPointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    return rect ? ([event.clientX - rect.left, event.clientY - rect.top] as const) : ([] as const)
  }

  return (
    <a
      href={PROJECT_HREF}
      className={`relative flex h-[clamp(6.5rem,21vh,13rem)] items-center px-[clamp(1.25rem,3vw,3rem)] outline-offset-4 focus-visible:outline-2 focus-visible:outline-paper ${className ?? ''}`}
      onPointerEnter={(event) => {
        hovered.current = true
        sync(...toCanvas(event))
      }}
      onPointerLeave={(event) => {
        hovered.current = false
        sync(...toCanvas(event))
      }}
      onFocus={(event) => {
        if (!event.currentTarget.matches(':focus-visible')) return
        focused.current = true
        sync()
      }}
      onBlur={() => {
        if (!focused.current) return
        focused.current = false
        sync()
      }}
    >
      {/* Stepped hairline outline, and the ink face inside it. */}
      <span aria-hidden className="absolute inset-0 bg-paper/25" style={{ clipPath: SLAB_CLIP }}>
        <span className="absolute inset-px bg-ink" style={{ clipPath: FACE_CLIP }} />
      </span>

      <span ref={labelRef} className="relative flex w-full items-center justify-between gap-6 text-paper">
        <span className="text-[clamp(1.75rem,4.6vw,5rem)] font-semibold leading-none tracking-tight">
          Start a project
        </span>
        <ArrowUpRight aria-hidden className="size-[clamp(1.75rem,4.2vw,4.5rem)] shrink-0" strokeWidth={1.25} />
      </span>

      {/* The pixel fill, over the label: where it has filled, it repaints the label in ink. */}
      <span aria-hidden className="pointer-events-none absolute inset-px" style={{ clipPath: FACE_CLIP }}>
        <canvas ref={canvasRef} className="absolute inset-0 size-full" />
      </span>
    </a>
  )
}

// The pixel fill. The face is cut into square cells of about CELL px, whole rows top to bottom. Each change of state
// sends a wave out from a point: a cell starts once the wave reaches it (distance / SPREAD, plus a little random lag
// so the front is ragged, like pixels), then turns over FLIP ms: signal lavender first, then settling to paper. A
// reversal starts every cell from wherever it is, so quick in-and-out never jumps. The label is repainted in ink on
// top of whatever cells are showing, so it reads dark on both the lavender front and the paper behind it.

type RGB = readonly [number, number, number]

// Canvas needs literal colours (mirrors --color-paper / --color-signal / --color-ink in index.css).
const PAPER: RGB = [244, 244, 245]
const SIGNAL: RGB = [177, 159, 255]
const INK = '#0a0a0c'

const CELL = 20 // px, target cell size
const SPREAD = 3.2 // px per ms the wave travels
const JITTER = 80 // ms, most random lag a cell can have
const FLIP = 260 // ms for one cell to turn over
const STILL_FLIP = 160 // ms; reduced motion: every cell fades together, no wave
const SIGNAL_AT = 0.3 // share of a cell's turn spent fading in as signal before blending to paper

function shade(v: number) {
  if (v < SIGNAL_AT) return `rgba(${SIGNAL[0]}, ${SIGNAL[1]}, ${SIGNAL[2]}, ${(v / SIGNAL_AT).toFixed(3)})`
  const k = (v - SIGNAL_AT) / (1 - SIGNAL_AT)
  const mix = (i: 0 | 1 | 2) => Math.round(SIGNAL[i] + (PAPER[i] - SIGNAL[i]) * k)
  return `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`
}

// The label's ink twin, at canvas resolution: every glyph drawn at the pen position the DOM gave it (so kerning and
// tracking match exactly) and every icon stroked from its own path data at its rendered size.
function paintInk(label: HTMLElement, origin: DOMRect, dpr: number, width: number, height: number) {
  const sprite = document.createElement('canvas')
  sprite.width = width
  sprite.height = height
  const g = sprite.getContext('2d')
  if (!g) return null
  g.scale(dpr, dpr)
  g.fillStyle = INK
  g.strokeStyle = INK

  const range = document.createRange()
  const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    const style = getComputedStyle(node.parentElement ?? label)
    g.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) continue
      range.setStart(node, i)
      range.setEnd(node, i + 1)
      const box = range.getBoundingClientRect()
      const metrics = g.measureText(text[i])
      // The glyph's box runs from the font's ascent to its descent, so the baseline sits one descent above its bottom.
      const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent
      g.fillText(text[i], box.left - origin.left, box.bottom - origin.top - descent)
    }
  }

  for (const svg of label.querySelectorAll('svg')) {
    const box = svg.getBoundingClientRect()
    const scale = box.width / (svg.viewBox.baseVal?.width || 24)
    g.save()
    g.translate(box.left - origin.left, box.top - origin.top)
    g.scale(scale, scale)
    g.lineWidth = Number(svg.getAttribute('stroke-width') ?? 2)
    g.lineCap = 'round'
    g.lineJoin = 'round'
    for (const path of svg.querySelectorAll('path')) g.stroke(new Path2D(path.getAttribute('d') ?? ''))
    g.restore()
  }
  return sprite
}

type PixelFill = { set: (filled: boolean, x?: number, y?: number) => void }

function usePixelFill(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  labelRef: RefObject<HTMLElement | null>,
  still: boolean,
) {
  const api = useRef<PixelFill>({ set: () => {} })

  useEffect(() => {
    const canvas = canvasRef.current
    const label = labelRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !label || !ctx) return
    const handle = api.current

    const flip = still ? STILL_FLIP : FLIP
    let w = 0
    let h = 0
    let dpr = 1
    let cell = CELL
    let cols = 0
    let rows = 0
    let ox = 0 // the cell grid is centred horizontally, so partial cells split evenly between the two ends
    let filled = false
    let ink: HTMLCanvasElement | null = null
    // Per cell: value it turns from and to, when its turn starts, and its fixed random lag.
    let from = new Float32Array(0)
    let to = new Float32Array(0)
    let start = new Float64Array(0)
    let lag = new Float32Array(0)
    let raf = 0

    const valueAt = (i: number, t: number) => {
      const p = Math.min(Math.max((t - start[i]) / flip, 0), 1)
      return from[i] + (to[i] - from[i]) * p
    }

    // Re-measured whenever it could have moved: on resize, once the fonts are in, and at the start of every wave.
    const repaintInk = () => {
      ink = paintInk(label, canvas.getBoundingClientRect(), dpr, canvas.width, canvas.height)
    }

    // Returns whether any cell is still turning.
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let moving = false
      let painted = false
      for (let r = 0; r < rows; r++) {
        const y0 = Math.round(r * cell * dpr)
        const y1 = Math.round((r + 1) * cell * dpr)
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          if (from[i] !== to[i] && t < start[i] + flip) moving = true
          const v = valueAt(i, t)
          if (v <= 0.002) continue
          painted = true
          // Edges on whole device pixels, so neighbouring cells meet without seams.
          const x0 = Math.round((ox + c * cell) * dpr)
          const x1 = Math.round((ox + (c + 1) * cell) * dpr)
          ctx.fillStyle = shade(v)
          ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
        }
      }
      // The ink label only where cells are painted, at their opacity.
      if (painted && ink) {
        ctx.globalCompositeOperation = 'source-atop'
        ctx.drawImage(ink, 0, 0)
        ctx.globalCompositeOperation = 'source-over'
      }
      return moving
    }

    const tick = (t: number) => {
      raf = draw(Math.max(t, performance.now())) ? requestAnimationFrame(tick) : 0
    }

    const layout = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      rows = Math.max(3, Math.round(h / CELL))
      cell = h / rows
      cols = Math.ceil(w / cell)
      ox = (w - cols * cell) / 2
      const n = rows * cols
      from = new Float32Array(n).fill(filled ? 1 : 0)
      to = new Float32Array(n).fill(filled ? 1 : 0)
      start = new Float64Array(n)
      lag = Float32Array.from({ length: n }, () => Math.random() * JITTER)
      repaintInk()
      draw(performance.now())
    }

    handle.set = (next, x = w / 2, y = h / 2) => {
      filled = next
      repaintInk()
      const now = performance.now()
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c
          from[i] = valueAt(i, now)
          to[i] = next ? 1 : 0
          const distance = Math.hypot(ox + (c + 0.5) * cell - x, (r + 0.5) * cell - y)
          start[i] = still ? now : now + distance / SPREAD + lag[i]
        }
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }

    let alive = true
    const observer = new ResizeObserver(layout)
    observer.observe(canvas)
    layout()
    document.fonts?.ready.then(() => {
      if (!alive) return
      repaintInk()
      draw(performance.now())
    })

    return () => {
      alive = false
      observer.disconnect()
      cancelAnimationFrame(raf)
      handle.set = () => {}
    }
  }, [canvasRef, labelRef, still])

  return api
}

// Copies the address, with the label rolling Copy → Copied (the menu toggle's roll) and back after a moment. Only
// offered where the Clipboard API is (secure contexts); the address beside it is selectable text either way.
function CopyEmailButton() {
  const [copied, setCopied] = useState(false)
  const [canCopy] = useState(() => typeof navigator !== 'undefined' && !!navigator.clipboard && window.isSecureContext)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2200)
    return () => clearTimeout(timer)
  }, [copied])

  if (!canCopy) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
    } catch {
      // Permission denied: leave the label as is; the address is still on screen to select.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy email address"
        className="hit-area rounded-full border border-paper/20 px-2.5 py-0.5 text-xs text-paper/70 transition-colors hover:border-paper/45 hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        <span className="relative block h-[1.25em] overflow-hidden leading-[1.25]">
          <motion.span
            className="block"
            initial={false}
            animate={{ y: copied ? '-50%' : '0%' }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <span className="block">Copy</span>
            <span className="block">Copied</span>
          </motion.span>
        </span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Email address copied' : ''}
      </span>
    </>
  )
}
