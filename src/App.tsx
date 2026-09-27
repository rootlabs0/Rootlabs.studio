import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { AboutSection } from './components/AboutSection'
import { FeatureStack } from './components/FeatureStack'
import { FeaturesSection } from './components/FeaturesSection'
import { KineticText } from './components/KineticText'
import { Navbar } from './components/Navbar'
import { NetworkGrid } from './components/NetworkGrid'
import { NavigationOverlay } from './components/NavigationOverlay'
import { PixelCollage } from './components/PixelCollage'
import { RedStatement } from './components/RedStatement'
import { useHeroSlide } from './components/heroExit'
import { ScrollProgression } from './components/ScrollProgression'
import { SmoothScroll } from './components/SmoothScroll'
import { TeamSection } from './components/TeamSection'
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

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const redStatementRef = useRef<HTMLElement>(null)

  return (
    <SmoothScroll>
      <Navbar menuOpen={menuOpen} onMenuToggle={() => setMenuOpen((open) => !open)} />
      <AnimatePresence>{menuOpen && <NavigationOverlay onClose={closeMenu} />}</AnimatePresence>


      <main>
        <ScrollProgression>
          <Hero />
        </ScrollProgression>

        <RedStatement ref={redStatementRef} />

        <AboutSection />

        <TeamSection />

        <FeaturesSection />

        <FeatureStack />

        <NetworkGrid />

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
