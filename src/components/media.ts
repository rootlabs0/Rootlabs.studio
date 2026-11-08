import { useSyncExternalStore } from 'react'

// Phones held upright. Mirrors the `phone:` variant in index.css; keep the two queries identical.
export const PHONE_PORTRAIT = '(max-width: 47.99rem) and (orientation: portrait)'

/** Whether a media query currently matches, kept live as the viewport changes. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
