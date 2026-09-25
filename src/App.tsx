import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { AboutSection } from './components/AboutSection'
import { FeaturesSection } from './components/FeaturesSection'
import { KineticText } from './components/KineticText'
import { MenuToggle, NavigationOverlay } from './components/NavigationOverlay'
import { PixelCollage } from './components/PixelCollage'
import { RedStatement } from './components/RedStatement'
import { useHeroSlide } from './components/heroExit'
import { ScrollProgression } from './components/ScrollProgression'
import { SmoothScroll } from './components/SmoothScroll'
import { TechText } from './components/TechText'

const linear = (t: number) => t
const laggedCatchUp = (t: number) => 3 * t ** 3 - 2 * t ** 4

// TechText draws to canvas, so it needs literal colours (mirrors --color-paper / --color-signal in index.css).
const PAPER = '#f4f4f5'
const SIGNAL = '#9b7fa8'

// Canvas text can't stagger per character like KineticText, so each hero line slides up and unblurs as a whole.
const heroLineEntrance = (delay: number) =>
  ({
    initial: { y: '40%', opacity: 0, filter: 'blur(12px)' },
    animate: { y: '0%', opacity: 1, filter: 'blur(0px)' },
    transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] },
  }) as const

function Hero() {
  // Both lines start on the first scroll tick and cover the same distance. The top moves at constant speed;
  // the bottom uses 3t³ − 2t⁴ (zero initial velocity, ends at exactly the top's speed), so it lags and then catches up.
  const topLineX = useHeroSlide(-1, '130%', [0, 1], linear)
  const bottomLineX = useHeroSlide(-1, '130%', [0, 1], laggedCatchUp)
  const collageX = useHeroSlide(1, '60vw')

  return (
    <section className="relative flex h-full flex-col items-start justify-end overflow-hidden px-6 pb-28 md:px-12">
      <div className="relative flex flex-col items-start">
        <motion.div className="will-change-transform" style={{ x: collageX }}>
          <PixelCollage className="mb-6 ml-10 md:ml-16" />
        </motion.div>
        <h1
          aria-label="We build what grows."
          className="max-w-3xl text-7xl font-medium leading-[0.95] tracking-tight md:text-[9.6rem]"
        >
          <motion.div className="will-change-transform" style={{ x: topLineX }}>
            <motion.span className="block" {...heroLineEntrance(0)}>
              <TechText text="We build" color={PAPER} accentColor={SIGNAL} sweep={false} />
            </motion.span>
          </motion.div>
          <motion.div className="will-change-transform" style={{ x: bottomLineX }}>
            <motion.span className="block" {...heroLineEntrance(0.15)}>
              <TechText text="what grows." color={PAPER} accentColor={SIGNAL} sweep={false} />
            </motion.span>
          </motion.div>
        </h1>
      </div>
    </section>
  )
}

// Two-step pixel notch on every corner of the Dashboard button, echoing the stepped collage frames.
const DASHBOARD_CLIP =
  'polygon(4px 0, calc(100% - 4px) 0, calc(100% - 4px) 2px, calc(100% - 2px) 2px, calc(100% - 2px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px), calc(100% - 4px) 100%, 4px 100%, 4px calc(100% - 2px), 2px calc(100% - 2px), 2px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 2px 4px, 2px 2px, 4px 2px)'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const redStatementRef = useRef<HTMLElement>(null)

  return (
    <SmoothScroll>
      <MenuToggle open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />
      <AnimatePresence>{menuOpen && <NavigationOverlay onClose={closeMenu} />}</AnimatePresence>

      {/* Persistent brand bar: stays pinned bottom-left, always light, while the sections change behind it. */}
      <div className="fixed bottom-6 left-6 z-30 flex items-stretch border border-charcoal bg-white text-charcoal md:left-12">
        <span aria-hidden className="flex items-center border-r border-charcoal px-2.5">
          {/* Split-circle mark: initials stacked either side of a rule. */}
          <span className="relative grid size-11 place-items-center rounded-full border border-charcoal text-[0.7rem] leading-none">
            <span className="absolute inset-x-0 top-1/2 h-px bg-charcoal" />
            <span className="absolute top-[0.45rem]">R</span>
            <span className="absolute bottom-[0.45rem]">L</span>
          </span>
        </span>
        <a
          href="#top"
          className="flex items-center border-r border-charcoal px-3 text-xl font-semibold tracking-tight md:text-2xl"
        >
          Root Labs
        </a>
        <span className="flex items-center border-r border-charcoal px-3">
          <a
            href="#login"
            className="rounded-full border border-charcoal px-3 py-0.5 text-sm transition-colors hover:bg-charcoal hover:text-white"
          >
            Login
          </a>
        </span>
        <span className="flex items-center px-2.5">
          <a
            href="#dashboard"
            className="bg-[#f36cf2] px-3 py-1.5 text-sm font-medium transition-[filter] hover:brightness-95 md:text-base"
            style={{ clipPath: DASHBOARD_CLIP }}
          >
            Go to Dashboard
          </a>
        </span>
      </div>

      <main>
        <ScrollProgression>
          <Hero />
        </ScrollProgression>

        <RedStatement ref={redStatementRef} />

        <AboutSection />

        <FeaturesSection />

        {/* Positioned above the pinned stage so the page-wide grid lines run behind this text, not over it. */}
        <section data-snap="start" className="relative z-20 flex min-h-dvh items-center px-6 md:px-12">
          <KineticText
            as="h2"
            text="Design, engineering, and motion — rooted in craft."
            className="max-w-4xl text-3xl font-medium leading-tight md:text-6xl"
            stagger={0.015}
          />
        </section>
      </main>
    </SmoothScroll>
  )
}

export default App
