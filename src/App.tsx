import { AnimatePresence, motion, useScroll } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { AboutSection } from './components/AboutSection'
import { BridgeSection } from './components/BridgeSection'
import { ContactSection } from './components/ContactSection'
import { FeatureStack } from './components/FeatureStack'
import { FeaturesSection } from './components/FeaturesSection'
import { Navbar } from './components/Navbar'
import { SquareShareSection } from './components/SquareShareSection'
import { NavigationOverlay } from './components/NavigationOverlay'
import { RedStatement } from './components/RedStatement'
import { ScrollProgression } from './components/ScrollProgression'
import { SmoothScroll } from './components/SmoothScroll'
import { TeamSection } from './components/TeamSection'
import { TechText } from './components/TechText'
import { VoxelSea, type ReflectedLine } from './components/VoxelSea'

// TechText draws to canvas, so it needs literal colours (mirrors --color-paper / --color-signal in index.css).
const PAPER = '#f4f4f5'
const SIGNAL = '#b19fff'

// Canvas text can't stagger per character like KineticText, so each hero line slides up and unblurs as a whole.
const heroLineEntrance = (delay: number) =>
  ({
    initial: { y: '40%', opacity: 0, filter: 'blur(12px)' },
    animate: { y: '0%', opacity: 1, filter: 'blur(0px)' },
    transition: { duration: 1, delay, ease: [0.22, 1, 0.36, 1] },
  }) as const

// Headline pieces: one line on wide screens, wrapping between the pieces on narrow ones.
const HERO_LINES = ['We build', 'what grows.'] as const
const HERO_LEAD = 'Design, engineering and motion, rooted in craft.'
const HERO_BADGE = { label: 'Meet RootFlow, our systems studio', href: '#work' }
const HERO_CAPTION = 'Scroll to see how we work'

const heroFadeIn = (delay: number) =>
  ({
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
  }) as const

// Giant headline floating above the horizon of a rolling voxel sea, mirrored in it. The sea fits itself to
// wherever CSS puts the headline: the horizon sits a fixed gap below its baseline. A normal full-screen
// section: scrolling down carries it up and away, and the next section follows from below.
function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const firstRef = useRef<HTMLSpanElement>(null)
  const secondRef = useRef<HTMLSpanElement>(null)
  // 0 → 1 as the hero scrolls out of view; the sea stops rendering once it's gone.
  const { scrollYProgress: heroScroll } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })

  const reflectedLines = useMemo<ReflectedLine[]>(
    () => [
      { ref: firstRef, text: HERO_LINES[0] },
      { ref: secondRef, text: HERO_LINES[1] },
    ],
    [],
  )

  return (
    // svh, not dvh: a fixed height that doesn't change as a phone's toolbar collapses mid-scroll, so the page below
    // never jumps and the sea never has to re-lay itself out.
    <section ref={sectionRef} className="bg-hero-sky relative h-svh overflow-hidden">
      <VoxelSea lines={reflectedLines} exit={heroScroll} className="absolute inset-0" />

      {/* One column from the top edge down to the headline's baseline line (56% / 54.5% up from the bottom). The
          badge sits at the top (17% / 15% down, never under the nav) and the lead + headline stack on the bottom
          edge; the auto margin between them takes up the slack. When a short or narrow screen leaves no slack, the
          pieces push each other down instead of overlapping, and the sea re-fits its horizon to wherever the
          headline lands. */}
      <div className="absolute inset-x-0 top-0 bottom-[56%] z-10 flex flex-col items-center px-4 pt-[max(17svh,4.5rem)] md:bottom-[54.5%] md:px-12 md:pt-[max(15svh,5rem)]">
        <motion.a
          href={HERO_BADGE.href}
          // z-10: above the headline's canvas, whose transparent bleed reaches up over the badge where the two sit close
          // (phones on their side) and would otherwise take its taps.
          className="hit-area z-10 mb-auto inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.07] px-4 py-[7px] text-[13px] text-paper/80 backdrop-blur-sm transition-colors hover:bg-white/[0.11] hover:text-paper"
          {...heroFadeIn(0.2)}
        >
          {HERO_BADGE.label}
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
        </motion.a>

        <p className="mt-6 mb-5 text-center text-[length:clamp(1rem,1.65vw,1.4rem)] leading-snug text-balance text-paper/55 short:mt-3 short:mb-2 md:mb-[1.6vw]">
          <motion.span className="block" {...heroFadeIn(0.35)}>
            {HERO_LEAD}
          </motion.span>
        </p>
        <h1
          aria-label={HERO_LINES.join(' ')}
          className="text-center text-[length:15vw] font-medium leading-none tracking-[-0.05em] md:text-[length:clamp(3rem,9.2vw,10rem)] short:text-[length:clamp(2.5rem,7vw,4.5rem)]"
        >
          <motion.span ref={firstRef} className="inline-block" {...heroLineEntrance(0)}>
            <TechText text={HERO_LINES[0]} color={PAPER} accentColor={SIGNAL} sweep={false} />
          </motion.span>{' '}
          <motion.span ref={secondRef} className="inline-block" {...heroLineEntrance(0.12)}>
            <TechText text={HERO_LINES[1]} color={PAPER} accentColor={SIGNAL} sweep={false} />
          </motion.span>
        </h1>
      </div>

      <p className="absolute bottom-6 left-6 z-10 text-sm text-paper/55 md:bottom-7 md:left-10 md:text-[15px]">
        <motion.span className="block" {...heroFadeIn(0.6)}>
          {HERO_CAPTION}
        </motion.span>
      </p>
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
        <Hero />

        <ScrollProgression />

        <RedStatement ref={redStatementRef} />

        <AboutSection />

        <TeamSection />

        <FeaturesSection />

        {/* Square Share (the studio's SaaS) leads; Bridge carries its light panel down into RootFlow's stage. */}
        <SquareShareSection />

        <BridgeSection />

        <FeatureStack />

        <ContactSection />
      </main>
    </SmoothScroll>
  )
}

export default App
