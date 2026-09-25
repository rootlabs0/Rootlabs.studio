import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useEffect, useRef } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Dribbble', href: 'https://dribbble.com' },
]

const EMAIL = 'hello@rootlabs.studio'

type MenuToggleProps = {
  open: boolean
  onToggle: () => void
}

export function MenuToggle({ open, onToggle }: MenuToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="navigation-overlay"
      aria-label={open ? 'Close menu' : 'Open menu'}
      className="fixed top-5 right-6 z-50 flex items-center gap-3 text-xs uppercase tracking-spaced text-paper mix-blend-difference md:top-8 md:right-16"
    >
      <span className="relative block h-[1.2em] overflow-hidden">
        <motion.span
          className="block"
          animate={{ y: open ? '-100%' : '0%' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <span className="block">Menu</span>
          <span className="block">Close</span>
        </motion.span>
      </span>
      {/* Two bars that rotate into an X */}
      <span className="relative block size-4" aria-hidden>
        <motion.span
          className="absolute left-0 h-px w-full bg-current"
          initial={false}
          animate={open ? { top: '50%', rotate: 45 } : { top: '30%', rotate: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        />
        <motion.span
          className="absolute left-0 h-px w-full bg-current"
          initial={false}
          animate={open ? { top: '50%', rotate: -45 } : { top: '70%', rotate: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        />
      </span>
    </button>
  )
}

const TILE_TRANSITION = { duration: 0.35, ease: 'easeOut' } as const

// Backdrop fades in fast and immediately starts the tile stagger — no waiting on it to finish
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut', staggerChildren: 0.05, delayChildren: 0.05 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn', delay: 0.1 },
  },
}

// Every tile enters from the left; staggering in DOM order (row by row, left column first)
// builds the grid progressively left to right. Tiles carry no stagger of their own, so their
// text children start on the same frame as the tile.
const tileVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: TILE_TRANSITION },
}

const linkVariants: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%', transition: { duration: 0.45, ease: EASE } },
  exit: { y: '-110%', transition: { duration: 0.25, ease: EASE } },
}

// Grid lines live on each tile (not the container) so they travel with the tile as it slides in
const TILE = 'bg-ink shadow-[0_0_0_1px_var(--color-line)]'

type NavigationOverlayProps = {
  onClose: () => void
}

export function NavigationOverlay({ onClose }: NavigationOverlayProps) {
  const reduceMotion = useReducedMotion()
  const firstLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    // Lock page scroll while the overlay covers the viewport
    const { overflow } = document.documentElement.style
    document.documentElement.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    firstLinkRef.current?.focus({ preventScroll: true })

    return () => {
      document.documentElement.style.overflow = overflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <motion.nav
      id="navigation-overlay"
      aria-label="Main"
      // Lenis ignores wheel/touch events originating inside this element
      data-lenis-prevent
      // overflow-x-hidden stops side-sliding tiles from flashing a horizontal scrollbar
      className="fixed inset-0 z-40 overflow-x-hidden overflow-y-auto bg-ink"
      variants={overlayVariants}
      initial={reduceMotion ? 'visible' : 'hidden'}
      animate="visible"
      exit={reduceMotion ? undefined : 'exit'}
    >
      {/* gap-px leaves room for each tile's 1px ring to form the grid lines */}
      <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_repeat(4,minmax(0,1fr))_auto] gap-px md:grid-cols-6 md:grid-rows-[auto_1fr_1fr_auto]">
        <motion.div
          variants={tileVariants}
          className={`${TILE} flex items-center px-6 py-5 text-xs uppercase tracking-spaced text-paper/50 md:col-span-6 md:px-16 md:py-8`}
        >
          Root Labs — Index
        </motion.div>

        {LINKS.map((link, i) => (
          <motion.a
            key={link.href}
            ref={i === 0 ? firstLinkRef : undefined}
            href={link.href}
            onClick={onClose}
            variants={tileVariants}
            className={`${TILE} group relative flex flex-col justify-end p-6 outline-none transition-colors duration-500 hover:bg-[#141418] focus-visible:bg-[#141418] md:col-span-3 md:p-10`}
          >
            <div className="flex items-baseline">
              {/* Arrow's box keeps its rendered width throughout — only its content slides/fades,
                  so the heading's push to the right (below) opens space the arrow reveals into */}
              <span className="overflow-hidden" aria-hidden>
                <span className="block -translate-x-full text-[1.8rem] leading-[0.9] text-paper opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:text-[2.2rem] lg:text-[3.6rem] xl:text-[4.8rem]">
                  →
                </span>
              </span>

              {/* Mask so each label slides up from below its baseline */}
              <span className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  variants={linkVariants}
                  // 20% down from the base scale (text-5xl/6xl/8xl/9xl), kept exact via arbitrary values
                  className="block text-[2.4rem] leading-[0.9] font-semibold uppercase tracking-tight transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:translate-x-3 sm:text-[3rem] lg:text-[4.8rem] xl:text-[6.4rem]"
                >
                  {link.label}
                </motion.span>
              </span>
            </div>
          </motion.a>
        ))}

        <motion.div
          variants={tileVariants}
          className={`${TILE} flex flex-col gap-3 p-6 md:col-span-2 md:px-10 md:py-8`}
        >
          <span className="text-xs uppercase tracking-spaced text-paper/40">Social</span>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {SOCIALS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={tileVariants}
          className={`${TILE} flex flex-col gap-3 p-6 md:col-span-2 md:px-10 md:py-8`}
        >
          <span className="text-xs uppercase tracking-spaced text-paper/40">Contact</span>
          <a
            href={`mailto:${EMAIL}`}
            className="text-sm text-paper/70 transition-colors hover:text-paper"
          >
            {EMAIL}
          </a>
        </motion.div>

        <motion.div
          variants={tileVariants}
          className={`${TILE} flex flex-col justify-between gap-3 p-6 text-xs uppercase tracking-spaced-sm text-paper/40 md:col-span-2 md:px-10 md:py-8`}
        >
          <span>© {new Date().getFullYear()} Root Labs Studio</span>
          <span>All rights reserved</span>
        </motion.div>
      </div>
    </motion.nav>
  )
}
