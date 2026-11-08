import type { CSSProperties } from 'react'

// The team, shared by the Meet the team cards (TeamSection) and the profiles they open (TeamProfiles).
//
// TODO(content): bio, experience, focus and socials below are placeholders written from each role. Replace them
// with the real CVs and profile URLs before launch; the "Previous role" rows and bare social domains are
// deliberately conspicuous so they can't ship by accident.

export type Experience = {
  period: string
  role: string
  org: string
}

export type Social = {
  label: string
  href: string
}

export type Member = {
  name: string
  /** Short title on the card, e.g. "CEO". */
  role: string
  /** Full title in the profile. */
  title: string
  handle: string
  /** Cut-out portrait on a padded 1587 × 2245 transparent canvas (the same canvas for everyone). */
  src: string
  /** Small illustrated avatar for the card's bar. */
  avatar: string
  /** Where the figure sits on its canvas, as fractions of it: the horizontal middle of the shoulders, and the
   *  line under them that rests on the card's bottom edge (set the same distance below the eyes for everyone,
   *  so faces line up across the row). */
  centre: number
  baseline: number
  /** Resize for a figure that is smaller or larger on its canvas than the rest, so heads match across the row. */
  scale?: number
  bio: string
  experience: Experience[]
  focus: string[]
  socials: Social[]
}

export const TEAM: Member[] = [
  {
    name: 'Adrian',
    role: 'CEO',
    title: 'Co-founder & Chief Executive Officer',
    handle: 'adrian',
    src: '/ad.png',
    avatar: '/Adrian_avatar.png',
    centre: 0.534,
    baseline: 0.712,
    scale: 1.15,
    bio: 'Leads Root Labs: clients, strategy and the roadmap. Turns a half-formed idea into a scope the team can ship, and keeps every project honest about time and budget.',
    experience: [
      { period: 'Now', role: 'Co-founder & CEO', org: 'Root Labs Studio' },
      { period: 'Before', role: 'Previous role', org: 'Company name' },
    ],
    focus: ['Strategy', 'Partnerships', 'Product scoping', 'Operations'],
    socials: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
      { label: 'Instagram', href: 'https://www.instagram.com/' },
    ],
  },
  {
    name: 'Viktor',
    role: 'CMO',
    title: 'Co-founder & Chief Marketing Officer',
    handle: 'viktor',
    src: '/vz2.png',
    avatar: '/Viky_avatar.png',
    centre: 0.477,
    baseline: 0.751,
    bio: 'Owns how Root Labs looks, sounds and gets found: brand, positioning and every launch. Makes sure the work the studio ships is work people actually hear about.',
    experience: [
      { period: 'Now', role: 'Co-founder & CMO', org: 'Root Labs Studio' },
      { period: 'Before', role: 'Previous role', org: 'Company name' },
    ],
    focus: ['Brand', 'Positioning', 'Content', 'Growth'],
    socials: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
      { label: 'Instagram', href: 'https://www.instagram.com/' },
    ],
  },
  {
    name: 'David',
    role: 'CTO',
    title: 'Co-founder & Chief Technology Officer',
    handle: 'david',
    src: '/dd2.png',
    avatar: '/DD_avatar.webp',
    centre: 0.471,
    baseline: 0.793,
    scale: 0.91,
    bio: 'Leads engineering at Root Labs: architecture, code quality and the infrastructure everything runs on. Picks the stack, sets the standards and keeps what the studio ships fast, secure and maintainable.',
    experience: [
      { period: 'Now', role: 'Co-founder & CTO', org: 'Root Labs Studio' },
      { period: 'Before', role: 'Previous role', org: 'Company name' },
    ],
    focus: ['Architecture', 'Full-stack', 'Infrastructure', 'Security'],
    socials: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
      { label: 'Instagram', href: 'https://www.instagram.com/' },
    ],
  },
]

// Canvas height against the card's width: the head clears the name above it, and the shoulders run edge to edge
// behind the bar.
const PHOTO_HEIGHT = '215cqw'

/** ProfileCard's --avatar-* placement for a member's cut-out. The canvas is anchored bottom-centre in the card,
 *  then shifted by its own size so the figure (not the padding) is centred and its baseline lands on the card's
 *  bottom edge. */
export function photoPlacement(member: Member): CSSProperties {
  return {
    '--avatar-width': 'auto',
    '--avatar-height': `calc(${PHOTO_HEIGHT} * ${member.scale ?? 1})`,
    '--avatar-x': `${-member.centre * 100}%`,
    '--avatar-y': `${(1 - member.baseline) * 100}%`,
  } as CSSProperties
}
