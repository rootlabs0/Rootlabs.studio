import { useId, useState } from 'react'
import { FEATURES, type Feature } from './data'
import { Icon } from './icons'

function FeatureCard({ feature, open, onToggle }: { feature: Feature; open: boolean; onToggle: () => void }) {
  const panelId = useId()
  return (
    <li className="ss-feature" data-open={open}>
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="ss-feature__toggle hit-area"
        >
          <Icon name={feature.icon} className="ss-feature__icon" />
          <span className="ss-feature__title">{feature.title}</span>
          <Icon name="plus" className="ss-feature__plus" />
        </button>
      </h4>
      {/* inert while closed: the line is out of the tab order and hidden from screen readers, but stays in the DOM
          so the height can ease. */}
      <div id={panelId} className="ss-feature__panel" inert={!open}>
        <p className="ss-feature__body">
          <span>{feature.body}</span>
        </p>
      </div>
    </li>
  )
}

// Dark cards, each a title that opens to one line of explanation. One open at a time.
export function FeatureCards() {
  const [openTitle, setOpenTitle] = useState<string | null>(null)
  return (
    <ul className="ss-features">
      {FEATURES.map((feature) => (
        <FeatureCard
          key={feature.title}
          feature={feature}
          open={openTitle === feature.title}
          onToggle={() => setOpenTitle((prev) => (prev === feature.title ? null : feature.title))}
        />
      ))}
    </ul>
  )
}
