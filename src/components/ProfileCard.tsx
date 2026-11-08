import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef, type CSSProperties } from 'react'
import './ProfileCard.css'

// Profile card, ported from React Bits' ProfileCard (reactbits.dev): a glare that follows the pointer, a 3D tilt
// towards it, and a glow behind the card. The original's rainbow foil layer is left out on purpose.
//
// This file only smooths the pointer position and writes it to CSS variables on the wrapper; ProfileCard.css
// turns those into the tilt, glare and glow.

// Smoothing time constant (seconds): how quickly the card catches up with the pointer.
const TAU = 0.14
// How long the card eases into its first tilt after the pointer enters, instead of snapping to it.
const ENTER_TRANSITION_MS = 180
// Distances from the target, in % of the card: close enough to let go of the tilt, and to stop animating.
const SETTLED = 0.15
const AT_REST = 0.02
// How far the card tilts towards the pointer, as a share of React Bits' original tilt (max 10° / 12.5° at the
// edges). 0.75 = 25% less pull.
const TILT_STRENGTH = 0.75

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max)
const round = (v: number) => parseFloat(v.toFixed(3))

type ProfileCardProps = {
  name: string
  title: string
  handle: string
  status: string
  avatarUrl: string
  miniAvatarUrl: string
  contactHref: string
  contactText?: string
  /** Places a cut-out avatar through the --avatar-* variables (see ProfileCard.css). */
  avatarStyle?: CSSProperties
  /** Makes the whole card a button (everything but the contact link in its bar). */
  onOpen?: () => void
  /** Accessible name for that button. */
  openLabel?: string
  className?: string
}

export function ProfileCard({
  name,
  title,
  handle,
  status,
  avatarUrl,
  miniAvatarUrl,
  contactHref,
  contactText = 'Contact',
  avatarStyle,
  onOpen,
  openLabel,
  className = '',
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false

  useEffect(() => {
    const wrap = wrapRef.current
    const shell = shellRef.current
    if (reduceMotion || !wrap || !shell) return

    // Smoothed pointer position and the position it is chasing, in % of the card (50, 50 = centre).
    let currentX = 50
    let currentY = 50
    let targetX = 50
    let targetY = 50
    let rafId = 0
    let lastTs = 0
    let enterTimer = 0
    let leaving = false

    const setVars = (x: number, y: number) => {
      const vars = {
        '--pointer-x': `${round(x)}%`,
        '--pointer-y': `${round(y)}%`,
        '--pointer-from-center': `${round(clamp(Math.hypot(y - 50, x - 50) / 50, 0, 1))}`,
        '--pointer-from-top': `${round(y / 100)}`,
        '--pointer-from-left': `${round(x / 100)}`,
        '--rotate-x': `${round((-(x - 50) / 5) * TILT_STRENGTH)}deg`,
        '--rotate-y': `${round(((y - 50) / 4) * TILT_STRENGTH)}deg`,
      }
      for (const [property, value] of Object.entries(vars)) wrap.style.setProperty(property, value)
    }

    const step = (ts: number) => {
      const dt = lastTs === 0 ? 0 : (ts - lastTs) / 1000
      lastTs = ts
      const k = 1 - Math.exp(-dt / TAU)
      currentX += (targetX - currentX) * k
      currentY += (targetY - currentY) * k
      setVars(currentX, currentY)

      const distance = Math.hypot(targetX - currentX, targetY - currentY)
      // The tilt is only let go once the card has glided back to the centre, so it never snaps flat.
      if (leaving && distance < SETTLED) {
        wrap.classList.remove('active')
        leaving = false
      }
      // Stop once caught up; the next pointer move starts the loop again.
      if (distance > AT_REST) {
        rafId = requestAnimationFrame(step)
      } else {
        rafId = 0
        lastTs = 0
      }
    }

    const setTarget = (x: number, y: number) => {
      targetX = x
      targetY = y
      if (!rafId) rafId = requestAnimationFrame(step)
    }

    const pointerAt = (event: PointerEvent) => {
      const rect = shell.getBoundingClientRect()
      return [
        clamp(((event.clientX - rect.left) / rect.width) * 100),
        clamp(((event.clientY - rect.top) / rect.height) * 100),
      ] as const
    }

    const onEnter = (event: PointerEvent) => {
      leaving = false
      wrap.classList.add('active', 'entering')
      window.clearTimeout(enterTimer)
      enterTimer = window.setTimeout(() => wrap.classList.remove('entering'), ENTER_TRANSITION_MS)
      setTarget(...pointerAt(event))
    }
    const onMove = (event: PointerEvent) => setTarget(...pointerAt(event))
    const onLeave = () => {
      leaving = true
      setTarget(50, 50)
    }

    shell.addEventListener('pointerenter', onEnter)
    shell.addEventListener('pointermove', onMove)
    shell.addEventListener('pointerleave', onLeave)

    return () => {
      shell.removeEventListener('pointerenter', onEnter)
      shell.removeEventListener('pointermove', onMove)
      shell.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(rafId)
      window.clearTimeout(enterTimer)
      wrap.classList.remove('active', 'entering')
    }
  }, [reduceMotion])

  return (
    <div ref={wrapRef} className={`pc-card-wrapper ${className}`.trim()}>
      <div className="pc-behind" />
      <div ref={shellRef} className="pc-card-shell">
        <section className="pc-card">
          <div className="pc-inside">
            <div className="pc-glare" />
            <div className="pc-content pc-avatar-content">
              <img
                className="avatar"
                src={avatarUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                draggable={false}
                style={avatarStyle}
              />
              {onOpen && (
                <button
                  type="button"
                  className="pc-open"
                  onClick={onOpen}
                  aria-label={openLabel ?? `Open ${name}'s profile`}
                />
              )}
              <div className="pc-user-info">
                <div className="pc-user-details">
                  <div className="pc-mini-avatar">
                    <img src={miniAvatarUrl} alt="" loading="lazy" decoding="async" draggable={false} />
                  </div>
                  <div className="pc-user-text">
                    <div className="pc-handle">@{handle}</div>
                    <div className="pc-status">{status}</div>
                  </div>
                </div>
                <a className="pc-contact-btn hit-area" href={contactHref} aria-label={`${contactText} ${name}`}>
                  {contactText}
                </a>
              </div>
            </div>
            <div className="pc-content">
              <div className="pc-details">
                <h3>{name}</h3>
                <p>{title}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
