// Everything the showcase says and shows. Copy is verbatim from squareshare.eu unless a comment says otherwise, so
// change it there first, then here. Spec: src/components/SQUARESHARE_SHOWCASE.md (sections 7.3 and 11).
import type { IconName } from './icons'

/** Where the copied image files live in the public folder. */
export const ASSET_BASE = '/showcase/squareshare'

export const SQ = {
  name: 'Square Share',
  url: 'https://squareshare.eu',
  domain: 'squareshare.eu',
  stack: ['Next.js', 'Tailwind CSS', 'Supabase', 'Cloudflare'],
} as const

export const HERO = {
  lead: 'Start taking payments anywhere people find you. Run it all from one dashboard.',
  // Showcase-only: the live site's button says "Get started" and opens its waitlist.
  cta: 'Visit squareshare.eu',
} as const

export const STEPS = [
  { num: '01', eyebrow: 'Build your shelf', title: "Curate a grid that's all yours." },
  { num: '02', eyebrow: 'Embed anywhere', title: 'Drop your storefront onto your site.' },
  { num: '03', eyebrow: 'Get discovered and sell', title: 'Connect Stripe and take payment.' },
] as const

// The storefront the live site builds in its "3 steps" section: a 4 x 3 grid, every tile placed by hand, square
// cells so the square photos never crop. The order is the order the tiles drop in.
export interface Tile {
  id: string
  file: string
  col: number // 1-based column start
  row: number // 1-based row start
  cw: number // column span
  rh: number // row span
}

export const TILES: readonly Tile[] = [
  { id: 'camera', file: 'product-01.jpg', col: 1, row: 1, cw: 2, rh: 2 },
  { id: 'monstera', file: 'product-04.jpg', col: 3, row: 1, cw: 1, rh: 1 },
  { id: 'watch', file: 'product-03.jpg', col: 4, row: 1, cw: 1, rh: 1 },
  { id: 'headphones', file: 'product-02.jpg', col: 3, row: 2, cw: 2, rh: 2 },
  { id: 'succulent', file: 'product-07.jpg', col: 1, row: 3, cw: 1, rh: 1 },
  { id: 'mouse', file: 'product-05.jpg', col: 2, row: 3, cw: 1, rh: 1 },
]

// "Every ___" in the dashboard heading. The first word is what renders without JavaScript and under reduced motion.
export const ROTATING_WORDS = ['sale', 'channel', 'post', 'member', 'order', 'store', 'metric'] as const

export const CALLOUT = {
  lead: 'Manage the whole sales side of your business in one place. Sales, channels, social content, orders, storefront design, and analytics are already connected, so there is nothing to wire up.',
  screenshot: 'squareshare1.webp',
  screenshotAlt: 'The Square Share dashboard with a storefront grid of photos',
  screenshotWidth: 2532,
  screenshotHeight: 1599,
} as const

export interface Feature {
  icon: IconName
  title: string
  body: string
}

// Three of the live site's seven dashboard cards: the ones that explain the product fastest.
export const FEATURES: readonly Feature[] = [
  {
    icon: 'layoutGrid',
    title: 'Storefront design',
    body: 'Arrange your products in a grid and size each one. No templates, no code.',
  },
  {
    icon: 'waypoints',
    title: 'Sales channels',
    body: 'Storefronts and purchase buttons on any site, managed from one list.',
  },
  {
    icon: 'chartColumn',
    title: 'Analytics',
    body: 'See which channels and content bring in sales.',
  },
]

// The hero's arrow cursors: purple ones are attention that bought, faint white outlines ("plain") are attention
// that hasn't yet. Each tip points at the headline: rz = atan2(-dx, dy) * 180 / PI + 22.3, where (dx, dy) is the
// tip's offset in px from the hero's center (worked out for a 1100 x 560 hero).
export interface CursorSpec {
  x: string // tip position, from the hero's top left
  y: string
  w: string // width; height follows at 21.8 / 15.7
  rz: number // turn in the plane of the screen, degrees
  rx?: number // lean toward the viewer, degrees
  focus: 'all' | 'none' | 'tip' // which part is sharp
  blur?: number // px, for the soft parts
  alpha?: number
  plain?: boolean
  depth: number // how near it is; sets how far it drifts
  wide?: boolean // only shown when the showcase is 48rem or wider
  // Where it sits once the showcase is 80rem or wider: measured off the live site at 1710 x 944, with rz worked
  // out again for that hero. Below 80rem the copy is relatively larger, so x / y / rz above keep clear of it.
  lg?: { x: string; y: string; rz: number }
}

// Sizes track the showcase's width (cqi) up to a cap at about 2000px wide, matching the live site's cursors.
export const CURSORS: readonly CursorSpec[] = [
  // Far: small, soft, faint
  {
    x: '7%', y: '11%', w: 'clamp(16px, 1.3cqi, 26px)', rz: 137.4, focus: 'none', blur: 1, alpha: 0.5, depth: 4,
    lg: { x: '6%', y: '16%', rz: 135.4 },
  },
  {
    x: '95.5%', y: '66%', w: 'clamp(18px, 1.4cqi, 28px)', rz: -57.5, focus: 'none', blur: 0.6, alpha: 0.8, plain: true,
    depth: 5, wide: true, lg: { x: '95.3%', y: '60.5%', rz: -60.4 },
  },
  {
    x: '10%', y: '84%', w: 'clamp(18px, 1.4cqi, 28px)', rz: 88.9, focus: 'none', blur: 0.8, alpha: 0.7, plain: true,
    depth: 4, lg: { x: '9.3%', y: '76.5%', rz: 92.5 },
  },
  // In focus, on the same plane as the words
  {
    x: '72.5%', y: '14%', w: 'clamp(28px, 4cqi, 80px)', rz: -106.4, focus: 'all', plain: true, depth: 9,
    lg: { x: '69.5%', y: '18.8%', rz: -109.1 },
  },
  {
    x: '13.5%', y: '55%', w: 'clamp(48px, 7.5cqi, 150px)', rz: 108, focus: 'all', depth: 14, wide: true,
    lg: { x: '22.75%', y: '53.3%', rz: 108.5 },
  },
  {
    x: '53.5%', y: '91%', w: 'clamp(40px, 6.4cqi, 128px)', rz: 11.8, focus: 'all', depth: 12,
    // A fixed step below the middle (the copy's height barely changes), so it stays clear of the CTA on short heroes.
    lg: { x: '53.5%', y: 'calc(50% + 18rem)', rz: 10.5 },
  },
  {
    x: '84.5%', y: '39%', w: 'clamp(60px, 8.8cqi, 176px)', rz: -76.7, rx: 8, focus: 'tip', blur: 5, depth: 18, wide: true,
    lg: { x: '76.6%', y: '40.5%', rz: -78.9 },
  },
  // Near: big and out of focus
  {
    x: '20%', y: '16%', w: 'clamp(90px, 13.2cqi, 264px)', rz: 142.2, focus: 'none', blur: 18, alpha: 0.7, depth: 44,
    wide: true, lg: { x: '25.3%', y: '22.2%', rz: 144.1 },
  },
  {
    x: '77%', y: '88%', w: 'clamp(110px, 18.7cqi, 374px)', rz: -35.4, rx: 12, focus: 'tip', blur: 16, depth: 30,
    lg: { x: '73.9%', y: '70.9%', rz: -38.5 }, // a few degrees off the formula, to match its lean on the site
  },
]
