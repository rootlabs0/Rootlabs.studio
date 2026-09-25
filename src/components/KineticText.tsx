import { motion, useReducedMotion, type Variants } from 'framer-motion'

type KineticTextProps = {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  className?: string
  /** Seconds between each character starting its animation */
  stagger?: number
  /** Seconds before the first character animates */
  delay?: number
  /** Animate only the first time the text enters the viewport */
  once?: boolean
}

const charVariants: Variants = {
  hidden: { y: '110%', opacity: 0, filter: 'blur(8px)' },
  visible: {
    y: '0%',
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

export function KineticText({
  text,
  as = 'span',
  className,
  stagger = 0.03,
  delay = 0,
  once = true,
}: KineticTextProps) {
  const reduceMotion = useReducedMotion()
  const Tag = motion[as]
  const words = text.split(' ')

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }

  return (
    <Tag
      className={className}
      aria-label={text}
      initial={reduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once, amount: 0.5 }}
      variants={containerVariants}
    >
      {words.map((word, wordIndex) => (
        // Keep each word intact so line breaks never split a word mid-character
        <span key={wordIndex} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(word).map((char, charIndex) => (
            // Mask wrapper clips the character while it slides up from below
            <span key={charIndex} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span className="inline-block will-change-transform" variants={charVariants}>
                {char}
              </motion.span>
            </span>
          ))}
          {wordIndex < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}
