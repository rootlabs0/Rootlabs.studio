import { cubicBezier } from 'framer-motion'
import Lenis, { type VirtualScrollData } from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect, type ReactNode } from 'react'
import { pickSnapTarget, type SnapPoint } from './snapTarget'

type SmoothScrollProps = {
  children: ReactNode
}

// Speed ramp shared by every programmatic glide: slow start, clean acceleration, fluid deceleration.
const speedRamp = cubicBezier(0.76, 0, 0.24, 1)

// Locked entrance (see below).
const LOCK_DURATION = 1.75 // s
// Glide to an in-page link's target; longer than a snap since it can cross several screens.
const ANCHOR_DURATION = 1.8 // s
// How far above the trigger a downward scroll may start and still be captured (fraction of a viewport).
// Covers the stage's final hold, where nothing animates, so no scrubbed frames are skipped.
const LOCK_CATCH_ZONE = 0.3
// After the entrance, keep swallowing wheel input until it has been quiet this long (trackpad momentum
// from the gesture that triggered it)…
const MOMENTUM_QUIET_MS = 150
// …but never hold control for longer than this after the entrance completes.
const MOMENTUM_MAX_MS = 1200

export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    // Respect users who have asked the OS to minimise motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Locked entrance. An element marked data-scroll-lock gets a scroll-jacked arrival: the moment a
    // downward wheel gesture reaches the point where it starts entering the viewport, input is captured and
    // Lenis glides the page until the element is locked full-screen, on the speed ramp. Wheel input during
    // the glide is ignored (Lenis `lock`), and the leftover momentum of that same gesture is swallowed
    // afterwards so it can't carry the page past the section. Only then does the user get control back.
    // Touch scrolling is native (its momentum can't be cancelled) and is left alone.
    let locking = false
    let releaseAt = 0 // while > now, wheel input is swallowed
    let hardReleaseAt = 0

    const readLockTarget = () => {
      const el = document.querySelector<HTMLElement>('[data-scroll-lock]')
      if (!el) return null
      const top = el.getBoundingClientRect().top + window.scrollY
      return { top, trigger: top - window.innerHeight }
    }

    const swallow = (event: Event) => {
      if (event.cancelable) event.preventDefault()
      return false
    }

    const virtualScroll = ({ deltaY, event }: VirtualScrollData) => {
      if (!event.type.includes('wheel')) return true
      const now = performance.now()

      if (locking) return swallow(event)
      if (now < releaseAt && now < hardReleaseAt) {
        releaseAt = now + MOMENTUM_QUIET_MS
        return swallow(event)
      }

      if (deltaY <= 0) return true
      const lock = readLockTarget()
      if (!lock) return true
      const y = lenis.scroll
      const catchFrom = lock.trigger - window.innerHeight * LOCK_CATCH_ZONE
      // Inside the catch zone (or between the trigger and the section) and this gesture would reach the trigger.
      if (y < catchFrom || y >= lock.top - 1 || lenis.targetScroll + deltaY < lock.trigger) return true

      locking = true
      snapping = true
      clearTimeout(idleTimer)
      lenis.scrollTo(lock.top, {
        duration: LOCK_DURATION,
        easing: speedRamp,
        lock: true,
        force: true,
        onComplete: () => {
          const done = performance.now()
          locking = false
          snapping = false
          origin = lock.top
          releaseAt = done + MOMENTUM_QUIET_MS
          hardReleaseAt = done + MOMENTUM_MAX_MS
        },
      })
      return swallow(event)
    }

    // lerp (per-frame catch-up) rather than a fixed 1.2s eased duration: still smooth, but scroll-linked
    // animations track the wheel closely instead of floating on for a second after the user stops.
    const lenis = new Lenis({
      lerp: 0.18,
      smoothWheel: true,
      virtualScroll,
    })

    // Section snapping, run through Lenis (CSS scroll-snap would fight Lenis's per-frame scroll jumps and the
    // tall scroll-scrubbed stage). Elements opt in with data-snap="start" (snap to their top) or "end" (the
    // tall stage: snap to where its last screen is showing, when scrolling up into it). Once scrolling goes
    // quiet, snapTarget.ts decides where to rest and Lenis glides there on the speed ramp. Touch scrolling is
    // left to the browser entirely: no snapping, no locked entrance (see onVirtualScroll).
    const readPoints = (): SnapPoint[] =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-snap]'), (el) => {
        const rect = el.getBoundingClientRect()
        return el.dataset.snap === 'end'
          ? { y: rect.bottom + window.scrollY - window.innerHeight, upOnly: true }
          : { y: rect.top + window.scrollY, upOnly: false }
      })

    let origin = window.scrollY // where the current gesture started: the last place the page came to rest
    let snapping = false
    let touching = false
    let idleTimer: ReturnType<typeof setTimeout> | undefined

    const settle = () => {
      const y = lenis.scroll
      const target = touching ? null : pickSnapTarget(y, origin, readPoints())
      if (target === null) {
        origin = y
        return
      }
      snapping = true
      lenis.scrollTo(target, {
        duration: 1.1,
        easing: speedRamp,
        lock: true,
        onComplete: () => {
          snapping = false
          origin = target
        },
      })
    }
    const onScroll = () => {
      if (snapping) return
      clearTimeout(idleTimer)
      idleTimer = setTimeout(settle, 100)
    }
    // Hands any programmatic glide (snap, anchor link, locked entrance) back to the user on the spot, so a finger
    // never has to fight Lenis writing the scroll position under it.
    const cancelGlide = () => {
      lenis.stop()
      lenis.start()
      snapping = false
      locking = false
      releaseAt = 0
      origin = lenis.scroll
    }
    const onVirtualScroll = ({ event }: { event: Event }) => {
      // The input that last moved the page decides whether it snaps. Every touch event counts, touchend included:
      // the native momentum that follows a swipe belongs to the touch, so it must not snap once it settles. Only a
      // wheel gesture switches snapping back on.
      touching = event.type.startsWith('touch')
      if (event.type === 'touchstart' && (snapping || locking)) cancelGlide()
    }
    lenis.on('scroll', onScroll)
    lenis.on('virtual-scroll', onVirtualScroll)

    // In-page links (#work, …) glide to their target on the speed ramp instead of jumping. Taking over the click
    // also keeps the snap bookkeeping honest: the glide's end is the new resting point. Links without a matching
    // element are left to the browser.
    const onAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const hash = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')?.getAttribute('href')
      const target = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null
      if (!target) return

      event.preventDefault()
      // A locked entrance is mid-glide: starting another here would leave `locking` stuck on.
      if (locking) return
      const top = target.getBoundingClientRect().top + window.scrollY
      snapping = true
      clearTimeout(idleTimer)
      lenis.scrollTo(top, {
        duration: ANCHOR_DURATION,
        easing: speedRamp,
        lock: true,
        force: true,
        onComplete: () => {
          snapping = false
          origin = top
        },
      })
    }
    document.addEventListener('click', onAnchorClick)

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      document.removeEventListener('click', onAnchorClick)
      cancelAnimationFrame(rafId)
      clearTimeout(idleTimer)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
