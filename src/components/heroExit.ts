import { easeIn, useTransform, type MotionValue } from 'framer-motion'
import { createContext, useContext } from 'react'

export const HeroExitContext = createContext<MotionValue<number> | null>(null)

/** 0 → 1 as the hero leaves the stage. Use inside ScrollProgression's children. */
export function useHeroExit() {
  const value = useContext(HeroExitContext)
  if (!value) throw new Error('useHeroExit must be used inside <ScrollProgression>')
  return value
}

/** Slides hero content laterally off-screen as the stage starts scrolling. */
export function useHeroSlide(
  direction: -1 | 1,
  distance = '130%',
  range: [number, number] = [0, 1],
  ease: (t: number) => number = easeIn,
) {
  const heroExit = useHeroExit()
  return useTransform(heroExit, range, ['0%', `${direction < 0 ? '-' : ''}${distance}`], { ease })
}
