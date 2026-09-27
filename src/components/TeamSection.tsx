import { cubicBezier, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useRef } from 'react'
import { PixelFrame } from './PixelFrame'

// The people behind Rootlabs: a cream section after About, continuing its centred grid line. A short heading sits
// above a row of stepped-frame portraits, one per team member, which rise into place on a stagger as the section
// scrolls in (same speed ramp as the About collage).
//
// Layout: four equal columns on desktop (two on phones) across 77vw, centred, so the gap between columns two and
// three falls exactly on the grid line. Portraits are 4:5 and scale with the column; captions sit underneath.

const LINE_ON_CREAM = '#22201f'
const speedRamp = cubicBezier(0.76, 0, 0.24, 1)

type Member = {
  name: string
  role: string
  /** Slot the portrait here; the gradient placeholder shows until then. */
  src?: string
  placeholder: string
}

// Placeholder roster: replace names, roles and add `src` for each photo (e.g. '/team/viktor.jpg' in /public).
const TEAM: Member[] = [
  {
    name: 'Team member',
    role: 'Founder',
    placeholder: 'radial-gradient(circle at 50% 38%, #e8cdb4 0%, transparent 42%), linear-gradient(180deg, #8a5a3a, #3b2519)',
  },
  {
    name: 'Team member',
    role: 'Design',
    placeholder: 'radial-gradient(circle at 50% 38%, #d8c4ff 0%, transparent 42%), linear-gradient(180deg, #4a3a5c, #1e1826)',
  },
  {
    name: 'Team member',
    role: 'Engineering',
    placeholder: 'radial-gradient(circle at 50% 38%, #cfe0ff 0%, transparent 42%), linear-gradient(180deg, #2a2f4a, #12141f)',
  },
  {
    name: 'Team member',
    role: 'Motion',
    placeholder: 'radial-gradient(circle at 50% 38%, #e9f0b8 0%, transparent 42%), linear-gradient(180deg, #5c5a3a, #22201f)',
  },
]

export function TeamSection() {
  const ref = useRef<HTMLElement>(null)
  const still = useReducedMotion() ?? false
  // 0 → 1 as the section rises from the viewport bottom to locked at the top.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })

  return (
    <section
      ref={ref}
      data-snap="start"
      className="relative z-20 flex min-h-dvh flex-col justify-center overflow-hidden bg-cream py-[12vh] text-charcoal"
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: LINE_ON_CREAM }} />

      <div className="relative mx-auto w-[88vw] md:w-[77vw]">
        {/* Cream backing so the grid line breaks around the heading. */}
        <div className="mb-[6vh] w-fit bg-cream py-2 pr-6">
          <span className="inline-block rounded-full border border-charcoal px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm">
            Team
          </span>
          <h2 className="mt-3 text-[clamp(2rem,4.2vw,4.5rem)] font-semibold leading-[0.95] tracking-tight">
            The people behind Rootlabs
          </h2>
        </div>

        <ul className="grid grid-cols-2 gap-x-[3vw] gap-y-[5vh] md:grid-cols-4 md:gap-x-[2vw]">
          {TEAM.map((member, i) => (
            <TeamCard key={i} member={member} index={i} progress={scrollYProgress} still={still} />
          ))}
        </ul>
      </div>
    </section>
  )
}

function TeamCard({
  member,
  index,
  progress,
  still,
}: {
  member: Member
  index: number
  progress: MotionValue<number>
  still: boolean
}) {
  // Staggered rise: each portrait starts a little later and travels a little further than the one before.
  const start = 0.1 + index * 0.08
  const y = useTransform(progress, [start, Math.min(start + 0.6, 1)], still ? ['0vh', '0vh'] : [`${24 + index * 6}vh`, '0vh'], {
    ease: speedRamp,
  })

  return (
    <motion.li className="will-change-transform" style={{ y }}>
      <PixelFrame
        className="aspect-[4/5] w-full"
        src={member.src}
        alt={member.src ? `${member.name}, ${member.role}` : ''}
        placeholder={member.placeholder}
        steps={2}
        step={5}
      />
      {/* Cream backing so the grid line doesn't run through the caption. */}
      <div className="relative mt-3 w-fit bg-cream pr-3">
        <div className="text-[clamp(1rem,1.3vw,1.35rem)] font-semibold leading-tight tracking-tight">{member.name}</div>
        <div className="text-[clamp(0.8rem,0.95vw,1rem)] uppercase tracking-spaced-sm text-charcoal/60">{member.role}</div>
      </div>
    </motion.li>
  )
}
