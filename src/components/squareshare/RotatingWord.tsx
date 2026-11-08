import { useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ROTATING_WORDS as WORDS } from './data'

const HOLD_MS = 2400

// Where a word sits on the drum, by how many turns until it is current. 0 is on show. 1 waits above the line,
// blurred and faint, so the reader sees what's coming. The one that just left has dropped below, and the rest are
// parked out of sight. Rows move by their own height, so it holds at any size.
function rowStyle(turns: number, count: number): CSSProperties {
  if (turns === 0) return { transform: 'translateY(0%)', opacity: 1, filter: 'blur(0px)' }
  if (turns === 1) return { transform: 'translateY(-100%)', opacity: 0.32, filter: 'blur(3px)' }
  if (turns === count - 1) return { transform: 'translateY(100%)', opacity: 0, filter: 'blur(8px)' }
  return { transform: 'translateY(-200%)', opacity: 0, filter: 'blur(8px)' }
}

// The changing word in "Every ___". The cell is as wide as the widest word, so "Every" never moves. It only turns
// while on screen, and a screen reader hears the first word alone.
export function RotatingWord() {
  const ref = useRef<HTMLSpanElement>(null)
  const [index, setIndex] = useState(0)
  const inView = useInView(ref)
  const reduced = useReducedMotion() ?? false
  const rotating = inView && !reduced

  useEffect(() => {
    if (!rotating) return
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), HOLD_MS)
    return () => clearInterval(id)
  }, [rotating])

  return (
    <span ref={ref}>
      <span className="ss-sr-only">{WORDS[0]}</span>
      <span aria-hidden="true" className="ss-drum">
        <span className="ss-drum__sizer">
          {WORDS.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </span>
        <span className="ss-drum__window">
          <span className="ss-drum__track">
            {WORDS.map((word, i) => {
              const turns = rotating ? (i - index + WORDS.length) % WORDS.length : i === 0 ? 0 : WORDS.length - 2
              return (
                <span key={word} className="ss-drum__word" style={rowStyle(turns, WORDS.length)}>
                  {word}
                </span>
              )
            })}
          </span>
        </span>
      </span>
    </span>
  )
}
