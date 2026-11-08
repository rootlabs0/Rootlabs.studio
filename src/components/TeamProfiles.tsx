import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Transition, type Variants } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { EMAIL } from './contact'
import { ProfileCard } from './ProfileCard'
import { photoPlacement, type Member } from './team'

// Team profiles, opened by clicking a card in Meet the team. The whole team stands on a small stage: the selected
// member up front, full size and in colour, the rest behind on either side, smaller, dimmed and grey. Clicking one
// of them (or ← →) brings them to the front, and their bio, CV and links fill the
// panel beside the stage (below it on phones and tablets). Esc, the close button or a click on the backdrop closes.

const EASE = [0.22, 1, 0.36, 1] as const
const CARD_SWITCH: Transition = { duration: 0.75, ease: EASE }
// Reduced motion: cards jump to their new places; only the colour and dimming fade.
const CARD_SWITCH_REDUCED: Transition = { default: { duration: 0 }, opacity: { duration: 0.25 }, filter: { duration: 0.25 } }
// On close the content clears out fast, before the backdrop lifts, so it never ghosts over the cards on the page.
const CONTENT_EXIT: Transition = { duration: 0.2, ease: 'easeOut' }
const BACKDROP_EXIT: Transition = { duration: 0.35, ease: 'easeInOut', delay: 0.15 }
const LABEL = 'text-xs uppercase tracking-spaced text-paper/45'
// Anything marked with this is content: clicks on it don't count as clicks on the backdrop.
const SURFACE = 'data-surface'

/** Where a card stands, `offset` places away from the selected one: 0 up front, ±1 behind it to either side, and
 *  so on. x is a share of the card's own width: side cards stand far enough out to show most of themselves. */
function slot(offset: number) {
  const depth = Math.abs(offset)
  return {
    x: `${Math.sign(offset) * (depth === 0 ? 0 : 58 + (depth - 1) * 30)}%`,
    scale: Math.max(1 - 0.26 * depth, 0.4),
    opacity: depth === 0 ? 1 : 0.45 / depth,
    filter: depth === 0 ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.75)',
  }
}

// A card in the back brightens a little under the pointer, to show it can be picked.
const BACK_HOVER = { opacity: 0.75, filter: 'grayscale(0.5) brightness(0.9)', transition: { duration: 0.3 } }

/** Places from the selected member, wrapping round so the team fans out evenly to both sides. */
function offsetFrom(active: number, index: number, count: number) {
  const half = Math.floor(count / 2)
  return ((index - active + count + half) % count) - half
}

const pad = (n: number) => String(n).padStart(2, '0')

// Details enter line by line once the outgoing member's have faded; both stand in the same grid cell meanwhile,
// so the panel keeps its height and the stage beside it doesn't jump.
const PANEL: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.14, staggerChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
}
const LINE: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE } },
}
const LINE_REDUCED: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
}

type TeamProfilesProps = {
  team: Member[]
  initialIndex: number
  onClose: () => void
}

export function TeamProfiles({ team, initialIndex, onClose }: TeamProfilesProps) {
  const [active, setActive] = useState(initialIndex)
  const reduceMotion = useReducedMotion() ?? false
  // False while the exit animation plays: stop taking input then.
  const isPresent = useIsPresent()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const count = team.length
  const member = team[active]

  const step = useCallback((delta: number) => setActive((i) => (i + delta + count) % count), [count])

  // Lock the page behind (Lenis ignores wheel and touch inside, see data-lenis-prevent), take focus, and hand it
  // back to the card that opened us on the way out.
  useEffect(() => {
    const html = document.documentElement
    const { overflow } = html.style
    html.style.overflow = 'hidden'
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus({ preventScroll: true })

    return () => {
      html.style.overflow = overflow
      opener?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (!isPresent) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') step(1)
      else if (event.key === 'ArrowLeft') step(-1)
      else if (event.key === 'Tab') keepFocusInside(event, dialogRef.current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPresent, onClose, step])

  const closeOnBackdrop = (event: MouseEvent) => {
    if (!(event.target as Element).closest(`[${SURFACE}]`)) onClose()
  }

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Team profiles"
      data-lenis-prevent
      onClick={closeOnBackdrop}
      className={`fixed inset-0 z-[60] overflow-y-auto overscroll-contain text-paper ${isPresent ? '' : 'pointer-events-none'}`}
    >
      {/* The backdrop fades on its own rather than with the whole dialog: while an ancestor is mid-fade, its blur
          can't reach the page behind and would pop in at the end. */}
      <motion.div
        aria-hidden
        className="fixed inset-0 bg-ink/85 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } }}
        exit={{ opacity: 0, transition: BACKDROP_EXIT }}
      />

      <div className="relative flex min-h-full flex-col">
        <motion.header
          className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-b from-ink via-ink/80 to-transparent px-6 py-5 md:px-10 md:py-7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: CONTENT_EXIT }}
          transition={{ duration: 0.3 }}
        >
          <span className={LABEL}>Root Labs — Team</span>
          <button
            ref={closeRef}
            type="button"
            data-surface
            onClick={onClose}
            className="hit-area group flex items-center gap-3 text-xs uppercase tracking-spaced text-paper/75 transition-colors hover:text-paper"
          >
            Close
            <span className="grid size-9 place-items-center rounded-full border border-line transition-[border-color,rotate] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-90 group-hover:border-paper/40">
              <X aria-hidden className="size-4" strokeWidth={1.5} />
            </span>
          </button>
        </motion.header>

        <div className="mx-auto grid w-[88vw] flex-1 content-center items-center gap-y-12 pt-2 pb-16 lg:w-[86vw] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-[4vw] lg:pb-[10vh] short:grid-cols-2 short:gap-x-8 short:pb-10">
          <div className="flex flex-col items-center gap-8">
            {/* The stage is one card wide; every card stands in the same cell and slot() moves it into place. */}
            <div className="relative grid w-[min(46vw,calc(40svh*0.718))] lg:w-[min(23vw,calc(64svh*0.718))] short:w-[min(28vw,calc(66svh*0.718))]">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-[20%] bg-[radial-gradient(closest-side,rgb(177_159_255/0.22),transparent)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.15 } }}
                exit={{ opacity: 0, transition: CONTENT_EXIT }}
              />

              {team.map((person, index) => {
                const offset = offsetFrom(active, index, count)
                const depth = Math.abs(offset)
                const front = offset === 0
                return (
                  // Outer layer: the entrance and exit. Inner layer: the card's place on the stage.
                  <motion.div
                    key={person.handle}
                    data-surface
                    className="relative col-start-1 row-start-1"
                    // Not animated: whoever comes forward is in front for the whole move.
                    style={{ zIndex: 10 - depth }}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 56 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay: 0.1 + depth * 0.08 } }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : 16, transition: CONTENT_EXIT }}
                  >
                    <motion.div
                      initial={false}
                      animate={slot(offset)}
                      whileHover={front ? undefined : BACK_HOVER}
                      transition={reduceMotion ? CARD_SWITCH_REDUCED : CARD_SWITCH}
                    >
                      <div inert={!front}>
                        <ProfileCard
                          className="[--pc-max-height:200svh]"
                          name={person.name}
                          title={person.role}
                          handle={person.handle}
                          status="Online"
                          avatarUrl={person.src}
                          miniAvatarUrl={person.avatar}
                          contactHref={`mailto:${EMAIL}`}
                          avatarStyle={photoPlacement(person)}
                        />
                      </div>
                      {/* Stays mounted when its card comes forward, so keyboard focus isn't dropped; it just stops
                          taking clicks and leaves the tab order, letting the front card's own link through. */}
                      <button
                        type="button"
                        onClick={() => setActive(index)}
                        tabIndex={front ? -1 : 0}
                        aria-disabled={front || undefined}
                        aria-label={`Show ${person.name}, ${person.role}`}
                        className={`absolute inset-0 z-10 rounded-[7.7%/5.5%] outline-offset-4 focus-visible:outline-2 focus-visible:outline-paper/80 ${front ? 'pointer-events-none' : 'cursor-pointer'}`}
                      />
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>

            <motion.div
              data-surface
              className="flex items-center gap-5 text-xs uppercase tracking-spaced text-paper/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.4, delay: 0.35 } }}
              exit={{ opacity: 0, transition: CONTENT_EXIT }}
            >
              <p aria-live="polite" className="text-center tabular-nums">
                <span className="sr-only">
                  {member.name}, {member.role}.{' '}
                </span>
                <span className="text-paper">{pad(active + 1)}</span> / {pad(count)}
              </p>
            </motion.div>
          </div>

          {/* Fades as a whole on close: the details inside answer to their own AnimatePresence, not the dialog's. */}
          <motion.div
            data-surface
            className="grid w-full lg:max-w-[36rem]"
            exit={{ opacity: 0, transition: CONTENT_EXIT }}
          >
            <AnimatePresence>
              <ProfileDetails key={member.handle} member={member} reduceMotion={reduceMotion} />
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ProfileDetails({ member, reduceMotion }: { member: Member; reduceMotion: boolean }) {
  // The outgoing member's details linger while they fade; keep them out of the way of pointer and screen reader.
  const isPresent = useIsPresent()
  const line = reduceMotion ? LINE_REDUCED : LINE

  return (
    <motion.article
      className={`col-start-1 row-start-1 ${isPresent ? '' : 'pointer-events-none'}`}
      aria-hidden={!isPresent || undefined}
      variants={PANEL}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.span
        variants={line}
        className="inline-block rounded-full border border-paper px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm"
      >
        {member.role}
      </motion.span>
      <motion.h2
        variants={line}
        className="mt-4 text-[clamp(2.75rem,5.5vw,5.5rem)] font-semibold leading-[0.95] tracking-tight"
      >
        {member.name}
      </motion.h2>
      <motion.p variants={line} className="mt-3 text-base text-paper/55 md:text-lg">
        {member.title}
      </motion.p>
      <motion.p variants={line} className="mt-6 text-[15px] leading-relaxed text-paper/80 md:text-base">
        {member.bio}
      </motion.p>

      <motion.section variants={line} className="mt-8 border-t border-line pt-6">
        <h3 className={LABEL}>Experience</h3>
        <ol className="mt-4 space-y-3">
          {member.experience.map((item) => (
            <li key={`${item.period}-${item.role}`} className="grid grid-cols-[5.5rem_1fr] gap-4 text-sm">
              <span className="tabular-nums text-paper/45">{item.period}</span>
              <span>
                <span className="text-paper">{item.role}</span>
                <span className="text-paper/50"> · {item.org}</span>
              </span>
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.section variants={line} className="mt-6 border-t border-line pt-6">
        <h3 className={LABEL}>Focus</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {member.focus.map((area) => (
            <li key={area} className="rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-paper/75">
              {area}
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.div variants={line} className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`mailto:${EMAIL}`}
          className="inline-flex items-center rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-white"
        >
          Email {member.name}
        </a>
        {member.socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`${member.name} on ${social.label}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm text-paper/80 transition-colors hover:border-paper/40 hover:text-paper"
          >
            {social.label}
            <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
          </a>
        ))}
      </motion.div>
    </motion.article>
  )
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Tab and Shift+Tab wrap round inside the dialog instead of escaping to the page behind it. */
function keepFocusInside(event: KeyboardEvent, root: HTMLElement | null) {
  if (!root) return
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.closest('[inert], [aria-hidden="true"]'),
  )
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  const current = document.activeElement
  const outside = !root.contains(current)
  if (event.shiftKey && (current === first || outside)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (current === last || outside)) {
    event.preventDefault()
    first.focus()
  }
}
