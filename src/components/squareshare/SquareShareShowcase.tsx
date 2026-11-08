import type { CSSProperties } from 'react'
import { BuildPreview } from './BuildPreview'
import { CursorField } from './CursorField'
import { Entrance } from './Entrance'
import { FeatureCards } from './FeatureCards'
import { PixelSeam } from './PixelSeam'
import { RotatingWord } from './RotatingWord'
import { ASSET_BASE, CALLOUT, CURSORS, HERO, SQ, STEPS } from './data'
import { Icon } from './icons'
import './squareshare-showcase.css'

const delay = (seconds: number) => ({ '--ss-delay': `${seconds}s` }) as CSSProperties

// Rootlabs host: a wheel-snap rest point for the band it sits in (see .ss-snap and SmoothScroll.tsx).
const SnapPoint = () => <span aria-hidden="true" data-snap="start" className="ss-snap" />

// A compact Square Share: the dark hero, a pixel seam, then a light panel with the storefront build and the
// dashboard callout, closed by a second pixel seam into the host's next section (its colour: --ss-seam-next).
// Lays itself out from its own width (container queries), not the viewport.
// Spec: src/components/SQUARESHARE_SHOWCASE.md.
export function SquareShareShowcase({ className }: { className?: string }) {
  return (
    <section aria-label="Square Share showcase" className={className ? `ss-showcase ${className}` : 'ss-showcase'}>
      {/* 1. Hero (dark) */}
      <Entrance className="ss-hero">
        <SnapPoint />
        <CursorField cursors={CURSORS} />
        <div className="ss-hero__copy">
          <p className="ss-hero__title ss-rise">
            Turn attention <br />
            into <span className="ss-hero__word">sales</span>
          </p>
          <p className="ss-hero__lead ss-rise" style={delay(0.1)}>
            {HERO.lead}
          </p>
          <a className="ss-cta ss-rise" style={delay(0.2)} href={SQ.url} target="_blank" rel="noopener noreferrer">
            {HERO.cta}
            <Icon name="arrowUpRight" strokeWidth={2.5} className="ss-cta__arrow" />
            <span className="ss-sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </Entrance>

      {/* 2. Dark to light seam */}
      <PixelSeam />

      {/* 3. Light panel */}
      <div className="ss-light">
        {/* 3a. The storefront build */}
        <div className="ss-steps">
          <SnapPoint />
          <Entrance>
            <h3 className="ss-h3 ss-rise">
              It only takes <span className="ss-h3__muted">3&nbsp;steps</span>
            </h3>
            <ol className="ss-step-list">
              {STEPS.map((step, i) => (
                <li key={step.num} className="ss-step ss-rise" style={delay(0.1 + i * 0.1)}>
                  <span className="ss-step__num" aria-hidden="true">
                    {step.num}
                  </span>
                  <div>
                    <p className="ss-step__eyebrow">{step.eyebrow}</p>
                    <p className="ss-step__title">{step.title}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Entrance>
          <BuildPreview />
        </div>

        {/* 3b. The dashboard callout */}
        <div className="ss-callout">
          <SnapPoint />
          <Entrance className="ss-callout__copy">
            <h3 className="ss-h3 ss-rise">
              <span className="ss-nowrap">
                Every <RotatingWord />
              </span>{' '}
              <span className="ss-block">One dashboard.</span>
            </h3>
            <p className="ss-callout__lead ss-rise" style={delay(0.1)}>
              {CALLOUT.lead}
            </p>
            <div className="ss-rise" style={delay(0.2)}>
              <FeatureCards />
            </div>
          </Entrance>
          <Entrance className="ss-callout__visual ss-rise">
            <figure className="ss-shot">
              <div className="ss-shot__glow" aria-hidden="true">
                <div className="ss-shot__blob ss-shot__blob--a" />
                <div className="ss-shot__blob ss-shot__blob--b" />
              </div>
              <div className="ss-shot__frame">
                <img
                  src={`${ASSET_BASE}/${CALLOUT.screenshot}`}
                  alt={CALLOUT.screenshotAlt}
                  width={CALLOUT.screenshotWidth}
                  height={CALLOUT.screenshotHeight}
                  loading="lazy"
                  decoding="async"
                />
                <div className="ss-shot__fade" aria-hidden="true" />
              </div>
            </figure>
          </Entrance>
        </div>
      </div>

      {/* 4. Rootlabs host: light to the next section, the hero seam's squares the other way round */}
      <PixelSeam edge="out" seed={1} />
    </section>
  )
}
