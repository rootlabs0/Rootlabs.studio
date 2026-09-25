import type { ReactNode } from 'react'

// Inline highlight pill: sits in the running text, same size, lighter weight, rounded accent background.
// indent-0: text-indent is inherited, so without it each pill would indent its own label like a new paragraph.
function Pill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="mx-[0.08em] inline-block rounded-full indent-0 px-[0.32em] pb-[0.06em] font-normal leading-[1.05] text-charcoal"
      style={{ backgroundColor: color }}
    >
      {children}
    </span>
  )
}

// Cream section after About: the centred grid line continues through the page and breaks around a single
// paragraph-style headline with inline accent pills.
export function FeaturesSection() {
  return (
    <section
      data-snap="start"
      className="relative z-20 flex min-h-dvh items-center overflow-hidden bg-cream text-charcoal"
    >
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-charcoal" />

      {/* Cream backing so the grid line breaks around the text block, as in the About section. */}
      <div className="relative mx-auto w-[67vw] bg-cream py-[3vw]">
        <p className="indent-[4.7vw] text-[3.4vw] font-semibold leading-[1.02] tracking-tight">
          Everything you need to build your music career — in one place. Learn with{' '}
          <span className="whitespace-nowrap">
            <Pill color="#b5ff4f">Education</Pill>,
          </span>{' '}
          move faster with{' '}
          <span className="whitespace-nowrap">
            <Pill color="#ffcc00">Technology</Pill>,
          </span>{' '}
          and link up through a global <Pill color="#b19fff">Network</Pill> of artists and industry people who actually
          get it.
        </p>
      </div>
    </section>
  )
}
