# Square Share showcase: build spec for the Rootlabs site

This file is a complete handoff for building a compact Square Share case study inside the Rootlabs website. It has the design tokens, layout, animation parameters, and complete component code. Apart from seven image files (section 3), you don't need anything else from the Square Share repository.

- **Source of truth:** the squareshare.eu source code (Next.js 16, React 19, Tailwind CSS v4), read on 2026-11-08. If an older Square Share doc disagrees with this file, trust this file. For example, `docs/DESIGN_SYSTEM.md` in that repo still describes an acid-green accent and rounded bento cards; the shipped code uses purple and square corners.
- **Status of the code in section 7:** type-checked under `strict` TypeScript and linted with `eslint-plugin-react-hooks` 7 (including the React Compiler rules). It was rendered in Chromium at showcase widths of 288, 358, and about 1150px, with and without reduced motion, and against a host page with heavy global element styles. It has not been tested in Safari or Firefox.

## Contents

1. [Quick start](#1-quick-start)
2. [What the showcase shows](#2-what-the-showcase-shows)
3. [Assets](#3-assets)
4. [Design tokens](#4-design-tokens)
5. [Layout spec](#5-layout-spec)
6. [Motion and interaction spec](#6-motion-and-interaction-spec)
7. [Code](#7-code)
8. [Accessibility, performance, host compatibility](#8-accessibility-performance-host-compatibility)
9. [Acceptance checklist](#9-acceptance-checklist)
10. [Reference: the live site's Tailwind classes](#10-reference-the-live-sites-tailwind-classes)
11. [Copy reference](#11-copy-reference)

---

## 1. Quick start

**Requirements**

- React 19 (tested with 19.2.4). The only React 19 dependency is the boolean `inert` prop in `FeatureCards.tsx`. On React 18, delete `inert={!open}` and everything else still works.
- No other packages. The showcase does not use Tailwind, framer-motion, GSAP, or an icon library. Square Share uses all of these, but the showcase reimplements what it needs in plain CSS and a few lines of React.
- Browsers with container queries and `cqi` units: Chrome or Edge 105+, Safari 16+, Firefox 110+.

**Steps**

1. Copy the seven images (section 3) into the Rootlabs `public/showcase/squareshare/` folder.
2. Create the eleven files from section 7 in one folder, for example `src/components/squareshare-showcase/`. Copy them verbatim. Imports between them are relative.
3. Load the three fonts (section 4.2).
4. Render `<SquareShareShowcase />` inside a container of about 72rem (section 7.13).
5. Go through the checklist in section 9.

---

## 2. What the showcase shows

The showcase is one `<section>` that lays itself out from its own width (container queries), not the viewport. It was tested in columns from 18rem (288px) to about 72rem (1150px) wide. Top to bottom:

| # | Band | Surface | Content | Live-site source |
|---|------|---------|---------|------------------|
| 1 | Meta bar | black | Logo and name, tech stack, link to squareshare.eu | Showcase only |
| 2 | Hero | black | "Turn attention into sales", lead line, CTA, a field of arrow cursors | `HeroSection` / `hero/cursors/*` |
| 3 | Pixel seam | black into `#f9f9f9` | A jagged skyline of squares instead of a flat divider | `PixelEdge` |
| 4a | Steps and build | `#f9f9f9` | The three steps, and the storefront grid building itself tile by tile | `HowItWorks` / `howItWorks/StoreBuilder` |
| 4b | Dashboard callout | `#f9f9f9` | "Every ___ / One dashboard." with a rotating word, three feature cards, the dashboard screenshot | `DashboardSection` |

**What Square Share is,** in the site's own words (its meta description), for any copy around the showcase:

> Start taking payments on any website with an embeddable store or a one-line purchase button. Run every sale from one dashboard.

Stick to claims the site makes. Don't add launch dates, user counts, or revenue figures.

**Stack, as shipped:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase, deployed to Cloudflare Workers via OpenNext.

---

## 3. Assets

Run from the Square Share repo root, pointing `DEST` at the Rootlabs repo:

```bash
DEST=../rootlabs/public/showcase/squareshare
mkdir -p "$DEST"
cp public/howitworks/product-0{1,2,3,4,5,7}.jpg public/img/squareshare1.webp "$DEST"/
```

| File | Size | Pixels | What it is | Used in |
|------|------|--------|------------|---------|
| `product-01.jpg` | 28 KB | 600 x 600 | Instant camera | 2 x 2 tile, top left |
| `product-02.jpg` | 24 KB | 600 x 600 | Headphones | 2 x 2 tile, bottom right |
| `product-03.jpg` | 19 KB | 600 x 600 | Watch | 1 x 1 tile |
| `product-04.jpg` | 49 KB | 600 x 600 | Monstera plant | 1 x 1 tile |
| `product-05.jpg` | 21 KB | 600 x 600 | Mouse | 1 x 1 tile |
| `product-07.jpg` | 30 KB | 600 x 600 | Succulent | 1 x 1 tile |
| `squareshare1.webp` | 375 KB | 2532 x 1599 | Dashboard screenshot ("My photos" storefront editor) | Callout |

All product photos are clean, light-background stock shots, which is why the grid reads as one shelf. The screenshot is the same image squareshare.eu uses for its dashboard section and Open Graph card.

**Inline, no files needed:** the Square Share logo mark, the hero's arrow cursor, and six Lucide icons are SVG in `icons.tsx` and `CursorField.tsx`. The repo also has `public/img/logo.png` (1080 x 1080, black mark on white). The showcase uses the SVG instead, the same one the site header uses, so it can be white on black.

**Image weight:** the screenshot never shows wider than about 650px, so the 2532px source is oversized. In Next.js, swap the `<img>` for `next/image` (section 8.3), or export a 1400px-wide copy. It is lazy-loaded either way.

---

## 4. Design tokens

### 4.1 Color

The showcase defines its own tokens on `.ss-showcase`, so they can't collide with Rootlabs tokens.

| Token | Value | Live-site name | Use |
|-------|-------|----------------|-----|
| `--ss-acid` | `#a855f7` | `acid` (`--color-acid`) | The one accent: the word "sales", cursor ink, an open card's icon |
| `--ss-acid-glow` | `rgb(168 85 247 / 0.15)` | `bg-acid/15` | The wash behind the screenshot |
| `--ss-black` | `#000000` | `surface-dark` | Dark surfaces, CTA label |
| `--ss-card` | `#0a0a0a` | `neutral-950` | Feature cards |
| `--ss-white` | `#ffffff` | `white` | Text on dark, CTA fill, mockup frames |
| `--ss-light` | `#f9f9f9` | `surface-light` | Light panel |
| `--ss-neutral-50` | `#fafafa` | `neutral-50` | Empty grid cells |
| `--ss-neutral-100` | `#f5f5f5` | `neutral-100` | Tile backing |
| `--ss-neutral-200` | `#e5e5e5` | `neutral-200` | Hairlines, frame borders, ghost step numbers |
| `--ss-neutral-300` | `#d4d4d4` | `neutral-300` | Dashed cell guides |
| `--ss-neutral-500` | `#737373` | `neutral-500` | Eyebrows, Replay button |
| `--ss-neutral-600` | `#525252` | `neutral-600` | Body text on light |
| `--ss-neutral-900` | `#171717` | `neutral-900` | Headings on light |
| `--ss-heading-muted` | `#8a8a8a` | (site: `neutral-400`) | "3 steps" in the heading |
| `--ss-text-dim` | white at 50% | `text-white/50` | Hero lead, stack line, plus icons |
| `--ss-text-soft` | white at 70% | `text-white/70` | Card body, card icons |
| `--ss-line-dark` | white at 10% | `border-white/10` | Borders on dark |

The live site defines its neutrals in Tailwind v4 OKLCH. The hex values above are their sRGB equivalents. The site also has `acid-hover` (`#9333ea`), which the showcase doesn't need.

**Two deliberate departures from the live site, both for WCAG AA contrast on `#f9f9f9`:**

- "3 steps" uses `#8a8a8a` (3.3:1, passes for large text) instead of the site's `neutral-400` `#a3a3a3` (2.4:1).
- Eyebrows use `neutral-500` `#737373` (4.5:1) instead of `neutral-400`.

**Color rules**

- Purple is the only hue. Everything else is black, white, or gray. Don't add colors.
- Purple text appears only at display size (the word "sales"). Small text is never purple on black.
- There are exactly two color gradients: the purple wash behind the screenshot and the screenshot's fade into `#f9f9f9`. The cursor focus masks and the rotating word's fade are alpha masks, not colors. Don't add decorative gradients, rainbow blends, or gray fades over black.
- The live site has one exception to single-accent: a blue (`#2563eb`) "builder" cursor in its storefront animation, styled as a collaborator's cursor. The showcase leaves it out.

### 4.2 Type

| Role | Family | Weights | Variable the showcase reads |
|------|--------|---------|-----------------------------|
| Display (headings, step numbers, card titles) | Space Grotesk | 300 to 700 | `--font-ss-display` |
| Sans (body, CTA, meta bar) | Geist | 100 to 900 | `--font-ss-sans` |
| Mono (eyebrows, stack line, links, Replay) | JetBrains Mono | 100 to 800 | `--font-ss-mono` |

- The site's headings say `font-black` (900), but its Space Grotesk file stops at 700, so browsers render 700. The showcase sets 700 directly, which gives the same result. Geist does go to 900, and the CTA label uses it.
- Square Share's Tailwind theme names "Inter" as its sans fallback, but the font it actually loads is Geist. Use Geist.
- The site also loads a handwriting face (Shadows Into Light) for the founder's notes. The showcase doesn't use it.

**Loading in Next.js** (module scope, then pass the classes to the component as in section 7.13):

```tsx
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";

const ssDisplay = Space_Grotesk({ subsets: ["latin"], variable: "--font-ss-display", display: "swap" });
const ssSans = Geist({ subsets: ["latin"], variable: "--font-ss-sans", display: "swap" });
const ssMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-ss-mono", display: "swap" });
```

To match the site byte for byte, you can instead copy `src/app/fonts/SpaceGrotesk.woff2`, `Geist.woff2`, and `JetBrainsMono.woff2` from the Square Share repo and load them with `next/font/local`, using the same three variable names.

**Loading anywhere else** (tested). Put this in the document `<head>`. If no `--font-ss-*` variables are set, the stylesheet falls back to these family names.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=JetBrains+Mono:wght@100..800&family=Space+Grotesk:wght@300..700&display=swap">
```

**Type scale** (the showcase is scaled down from the site; `cqi` is 1% of the showcase's width)

| Element | Showcase | Live site |
|---------|----------|-----------|
| Hero tagline | Display 700, `clamp(2.75rem, 9.5cqi, 6rem)`, line height 1.16 (0.92 from 48rem), tracking -0.025em | `text-6xl md:text-8xl lg:text-9xl`, `leading-[1.16] md:leading-[0.92]`, `tracking-tight` |
| "sales" | 1.6em of the line on narrow layouts, 1em from 48rem | `text-8xl lg:text-9xl` (larger than the line on phones) |
| Hero lead | 1.125rem (1.25rem from 48rem), white 50% | `text-lg md:text-xl text-white/50` |
| Section heading | Display 700, `clamp(2.25rem, 7cqi, 3.5rem)`, `clamp(2rem, 4.5cqi, 3.25rem)` from 56rem, line height 1.05 | `text-5xl md:text-8xl leading-[1.05]` |
| Step number | Display 700, 3rem, `neutral-200` | `text-6xl md:text-7xl text-neutral-200` |
| Step title | Display 700, 1.375rem | `text-3xl md:text-4xl` (with a body paragraph) |
| Eyebrow | Mono 0.75rem, uppercase, tracking 0.25em | `font-mono text-xs uppercase tracking-[0.25em]` |
| Callout lead | 1.125rem, `neutral-600` | `text-lg md:text-xl text-neutral-600` |
| Card title | Display 700, 0.875rem | `font-display text-sm font-bold` |
| Card body | 0.875rem, line height 1.375, white 70% | `text-sm leading-snug text-white/70` |
| CTA label | Sans 900, 1rem | `font-black text-base` (hero: `text-lg`) |
| Meta link | Mono 0.75rem, tracking 0.025em, white 60% | Header nav: `font-mono text-xs tracking-wide text-white/60` |

### 4.3 Shape, borders, elevation, spacing

- **Corners are square** (radius 0) on everything that is Square Share's own chrome: the showcase frame, CTA, feature cards, and screenshot frame. The name is "Square" Share; square corners are part of the brand.
- **Rounded only inside the storefront mockup,** because it pictures a seller's store: frame 1rem, tiles 0.5rem. The live site does the same.
- **Borders:** 1px white at 10% on dark, 1px `neutral-200` on light, 1px dashed `neutral-300` for empty grid cells.
- **One shadow:** the storefront frame, `0 20px 60px -20px rgb(0 0 0 / 0.18)`. No other drop shadows, glassmorphism, or glows beyond the purple wash. The site also defines `--shadow-btn-glow` (`0 0 30px rgba(168, 85, 247, 0.3)`), which the showcase doesn't use.
- **Spacing:**

| Where | Narrow | 48rem and up |
|-------|--------|--------------|
| Meta bar padding | 0.875rem 1.25rem | 1rem 1.5rem |
| Hero padding | 4.5rem 1.5rem 5.5rem | bottom 4rem |
| Light panel padding | 1.5rem 1.25rem 4rem | 2rem 3rem 5rem |
| Steps to callout | 5rem | 7rem from 56rem |
| Column gap | 2.5rem (steps), 3rem (callout) | 4rem from 56rem |

### 4.4 Motion tokens

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)`, a soft back-out. Use it for everything that settles into place. Hovers use plain `ease-out`, and loops use `ease-in-out`.
- **Durations:** 150 to 200ms for hovers, 300ms for disclosure, 700ms for the word drum, 800ms for entrances, 900ms per storefront tile, 1.5s for cursor arrival, 9 to 15s for cursor drift, 14s and 18s for the glow.
- **Every** animation stops under `prefers-reduced-motion: reduce`, and content stays visible without JavaScript (section 6.1).

---

## 5. Layout spec

### 5.1 Hierarchy

```
section.ss-showcase              container "ss"; black; 1px white/10 border; clips overflow
├── header.ss-meta               flex row, space-between; opaque black
│   ├── h2.ss-meta__brand        logo (22px) + "Square Share"
│   └── div.ss-meta__side
│       ├── p.ss-meta__stack     "Next.js · Tailwind CSS · Supabase · Cloudflare" (48rem+)
│       └── a.ss-meta__link      "squareshare.eu" + arrow, new tab
├── div.ss-hero (Entrance)       grid, centered; min-height clamp(28rem, 56cqi, 36rem)
│   ├── div.ss-cursors           9 arrow cursors, absolute, behind the copy
│   └── div.ss-hero__copy        max 64rem, centered text
│       ├── p.ss-hero__title     "Turn attention / into sales"
│       ├── p.ss-hero__lead      max 36rem
│       └── a.ss-cta             "Visit squareshare.eu" + arrow, new tab
├── div.ss-seam                  3 SVG bands; one shows per width
└── div.ss-light                 #f9f9f9
    ├── div.ss-steps             1 column; 5fr / 7fr from 56rem
    │   ├── (Entrance)           h3 "It only takes 3 steps" + ol.ss-step-list (01, 02, 03)
    │   └── div.ss-build         4 x 3 storefront that builds itself + "Replay build"
    └── div.ss-callout           1 column; 7fr / 5fr from 56rem, screenshot first
        ├── (Entrance) copy      h3 "Every [word] / One dashboard.", lead, 3 feature cards
        └── (Entrance) visual    screenshot over the purple wash
```

### 5.2 Wireframes

Showcase 56rem and wider:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ▙▝ Square Share         [stack line, 48rem+]         squareshare.eu ↗      │
├────────────────────────────────────────────────────────────────────────────┤
│  ·  ░░░                                      ⇙                             │
│                 Turn attention                             ◁               │
│    ▷            into sales      ("sales" in purple)                        │
│             Start taking payments anywhere people find you.                │
│                     Run it all from one dashboard.                         │
│                       [ Visit squareshare.eu ↗ ]                           │
│   ·                         ⇧                         ◤ big, soft          │
│ ▀▀▀█▀▀▀█▀▀▀▀▀▀██▀▀▀▀▀█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█▀▀▀▀▀▀▀▀▀▀▀▀▀██▀▀▀  pixel skyline    │
├────────────────────────────────────────────────────────────────────────────┤
│  It only takes                ┌───────────────┬───────┬───────┐            │
│  3 steps                      │               │ plant │ watch │            │
│  ───────────────────────      │    camera     ├───────┴───────┤            │
│  01  BUILD YOUR SHELF         │    (2 x 2)    │               │            │
│      Curate a grid that's...  ├───────┬───────┤  headphones   │            │
│  02  EMBED ANYWHERE           │ succ. │ mouse │    (2 x 2)    │            │
│      Drop your storefront...  └───────┴───────┴───────────────┘            │
│  03  GET DISCOVERED AND SELL                       ↺ REPLAY BUILD          │
│      Connect Stripe and...                                                 │
│                                                                            │
│  ┌───────────────────────────────────┐   Every sale                        │
│  │                                   │   One dashboard.                    │
│  │  dashboard screenshot             │   Manage the whole sales side       │
│  │  (purple wash behind it;          │   of your business in one ...       │
│  │   bottom 40% fades into panel)    │   [▦ Storefront design       + ]    │
│  │                                   │   [⚇ Sales channels          + ]    │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   [▥ Analytics               + ]    │
└────────────────────────────────────────────────────────────────────────────┘
```

Showcase narrower than 48rem (phone): the meta bar drops the stack line, the side cursors hide, and everything stacks with the text first.

```
┌──────────────────────────────────┐
│ ▙▝ Square Share  squareshare.eu ↗│
├──────────────────────────────────┤
│ ·                         ⇙      │
│        Turn attention            │
│        into SALES                │
│   ("sales" set 1.6x larger)      │
│   Start taking payments ...      │
│   [ Visit squareshare.eu ↗ ]     │
│ ·            ⇧          ◤        │
│ ▀▀█▀▀▀▀██▀▀▀▀▀▀█▀▀▀▀  skyline    │
├──────────────────────────────────┤
│ It only takes                    │
│ 3 steps                          │
│ 01 BUILD YOUR SHELF ...          │
│ 02 EMBED ANYWHERE ...            │
│ 03 GET DISCOVERED ...            │
│ ┌────────────────────────────┐   │
│ │ storefront grid (4 x 3)    │   │
│ └────────────────────────────┘   │
│             ↺ REPLAY BUILD       │
│ Every sale                       │
│ One dashboard.                   │
│ Manage the whole ...             │
│ [▦ Storefront design     + ]     │
│ [⚇ Sales channels        + ]     │
│ [▥ Analytics             + ]     │
│ ┌────────────────────────────┐   │
│ │ dashboard screenshot       │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

### 5.3 Band by band

**Meta bar (showcase only).** Geist 600 at 1.125rem with -0.025em tracking, next to the 22px white logo mark. Below 48rem it shows only the brand and the link. Its background is opaque black so hero cursors that reach upward pass behind it.

**Hero.**

- The copy is centered: tagline, then a 1.5rem gap, then the lead (max 36rem), then a 2.5rem gap, then the CTA.
- Overflow is clipped sideways only. Cursors near the bottom keep going down into the seam and slide behind its light squares, as they cross into the next section on the live site.
- **CTA:** the site's one button style. A flat white rectangle with no border, radius, or shadow. Padding is 1rem 1.75rem, with a Geist 900 1rem label and an up-right arrow at 1.1em with stroke 2.5. On hover only the arrow moves, 3px right and 3px up. Focus shows a 2px black gap, then a 2px white ring.

**Hero cursors.**

- **Drawing:** an outline-only arrow pointer drawn on the viewBox `2.5 0.7 15.7 21.8`, with the tip at (4, 2.2). Purple ink (stroke 0.8) is attention that bought. Faint white ink (55% white, stroke 0.5) is attention that hasn't bought yet.
- **Focus:** each cursor is in focus (`all`), out of focus (`none`), or sharp at the tip and soft toward the tail (`tip`). A `tip` cursor stacks three copies (softer, soft, sharp) masked in overlapping bands along a 159deg axis.
- **Aim:** each cursor points at the headline. `rz = atan2(-dx, dy) * 180 / PI + 22.3`, where (dx, dy) is the tip's px offset from the hero's center. The 22.3 cancels the arrow's natural lean.

| x | y | width | focus | blur | alpha | ink | shown |
|---|---|-------|-------|------|-------|-----|-------|
| 7% | 11% | 16px | none | 1 | 0.5 | purple | always |
| 95.5% | 66% | 18px | none | 0.6 | 0.8 | white | 48rem+ |
| 10% | 84% | 18px | none | 0.8 | 0.7 | white | always |
| 72.5% | 14% | clamp(28px, 3.6cqi, 40px) | all | | 1 | white | always |
| 13.5% | 55% | clamp(48px, 6.5cqi, 72px) | all | | 1 | purple | 48rem+ |
| 53.5% | 91% | clamp(40px, 5.4cqi, 60px) | all | | 1 | purple | always |
| 84.5% | 39% | clamp(60px, 8cqi, 88px) | tip (rx 8deg) | 4 | 1 | purple | 48rem+ |
| 20% | 16% | clamp(90px, 11.5cqi, 130px) | none | 12 | 0.7 | purple | 48rem+ |
| 77% | 88% | clamp(110px, 13.5cqi, 150px) | tip (rx 12deg) | 12 | 1 | purple | always |

**Pixel seam.**

- Four rows tall. Each column's black runs 1 to 4 rows deep, from a seeded random sequence, so it is identical on every render and on server and client. A column moves at most 1 row from its neighbor (2 about 22% of the time).
- Column count by showcase width: 10 below 30rem, 18 from 30 to 56rem, 28 from 56rem. That keeps cells about 25 to 50px square.
- It is drawn as the light ground (one SVG path) over transparency, so the "black" is the hero itself. That's what lets cursors pass behind the light squares, and it means no hairline can appear where black meets light.
- The live site's version is taller (6 rows, black 2 to 6 rows deep, 48px cells, 33.6px at 768px and below). Its extra black also pops away cell by cell as the seam scrolls up (section 5.5). The showcase's is static and shorter so the showcase stays compact.

**Steps.**

- The heading, then a list with 2rem top margin. Each step is a flex row with a 1.25rem gap and 1.25rem vertical padding, with a `neutral-200` hairline on top.
- The ghost number sits in a 3.5rem column. The eyebrow (mono, uppercase) sits above the title.

**Storefront build ("interactive grid preview").**

- A 4:3 white frame (1rem radius, 0.5rem padding, `neutral-200` border, the one shadow) around a 4 x 3 grid with 0.5rem gaps.
- Twelve dashed guide cells sit underneath. The six tiles cover all twelve once built.
- Max 36rem wide when stacked; it fills its column from 56rem.
- "Replay build" sits under it, right-aligned: mono 0.75rem, uppercase, 0.2em tracking, `neutral-500` (`neutral-900` on hover).

| Tile | Photo | Column | Row | Span | Drop order |
|------|-------|--------|-----|------|------------|
| Camera | product-01 | 1 | 1 | 2 x 2 | 1 |
| Monstera | product-04 | 3 | 1 | 1 x 1 | 2 |
| Watch | product-03 | 4 | 1 | 1 x 1 | 3 |
| Headphones | product-02 | 3 | 2 | 2 x 2 | 4 |
| Succulent | product-07 | 1 | 3 | 1 x 1 | 5 |
| Mouse | product-05 | 2 | 3 | 1 x 1 | 6 |

**Dashboard callout.**

- On wide layouts the screenshot comes first (left, 7fr) and the copy second (right, 5fr), which zig-zags against the steps row above. On narrow layouts the copy comes first.
- Feature cards: one column on phones, two columns from 48rem to 56rem, one column from 56rem (in the narrower copy column).
- Each card is a `#0a0a0a` box with a white-10% border and square corners. A row holds the icon (18px), the title, and a plus (16px) pushed right; the panel below holds one line of body text.
- **Screenshot frame:** 1px `neutral-200` border with no bottom edge, on white. A gradient over its bottom 40% fades it into `#f9f9f9`. Behind it, two purple blobs (each 60% wide, `blur(64px)`) roam slowly.

### 5.4 Breakpoints

These are container queries on the showcase's own width, not on the viewport:

| Showcase width | What changes |
|----------------|--------------|
| below 30rem | Seam uses 10 columns |
| 30rem and up | Seam uses 18 columns |
| 48rem and up | Stack line shows. Side cursors show. Hero line height 0.92, "sales" at line size, lead 1.25rem, hero bottom padding 4rem. Panel padding 2rem 3rem 5rem. Cards in 2 columns. |
| 56rem and up | Seam uses 28 columns. Headings use the smaller clamp. Steps 5fr / 7fr. Callout 7fr / 5fr with the screenshot left. Cards back to 1 column. |

### 5.5 Left out on purpose (and how to add it back)

These live-site pieces are left out to keep the showcase compact and its JavaScript small. Each is listed with its parameters in case someone wants it:

- **Cursor parallax and scroll exit.** On the site, each cursor shifts by `depth` px times the pointer's offset from the hero's center (-1 to 1 on each axis), eased 0.07 per frame. On scroll each one rises by `0.05 * depth * scrollY`, shrinks to 0.8, and fades out between 3% and 40% of the window height.
- **Seam pop.** The seam starts 1 to 3 rows deeper per column. When the seam is 10% of the way through its scroll range (from its top at 90% of the viewport to its top at 35%), light pixels pop in over the extra black. Each pixel scales from 0.35 to 1 over 420ms and fades in over 180ms. The pops are staggered mostly bottom to top, with 70% random scatter, across 1.1s. Below 4% the animation reverses.
- **Builder cursor.** On the site, a blue figma-style cursor carries each product up from a tray below the grid. It travels 0.34s for the first item and 0.22s after that, presses (scale 0.82, 70ms), drags for 0.26s, drops (0.12s fade), then grabs each big tile's corner and pulls it out one cell (0.24s, then 0.32s), with 0.5s layout transitions.
- **Step 02 and 03 animations.** In step 02 the built store is dragged into an example shop website ("Paksi", `yourdomain.com`). In step 03 a purple customer cursor buys the headphones ("Studio Headphones", $129.00) through a Stripe-style checkout using test card 4242.
- **Floating feature cards.** At 64rem and wider on devices that can hover, the site's seven cards float over the screenshot (15rem wide). They open on hover and drift 62 to 90px with scroll parallax.
- Also left out: the floating header island, the community street illustration, the footer's interactive pixel grid, and the waitlist.

---

## 6. Motion and interaction spec

### 6.1 How entrances work

A block that should fade in is wrapped in `Entrance` (or uses `useEntrance`). On mount, if the block is still below the fold, the hook sets `data-ss-state="armed"`, which the stylesheet hides. When enough of the block scrolls into view, the hook sets `data-ss-state="play"`, which starts the CSS animations. The result:

- Server HTML carries no state, so with JavaScript off everything is visible.
- A block already on screen at load is left alone, so nothing visible blinks out.
- Under reduced motion the hook never arms, and the stylesheet forces everything visible and still.
- Because nothing goes through React state, entrances cost no re-renders.

### 6.2 Parameters

| Element | Trigger | What happens | Timing | Easing | Reduced motion |
|---------|---------|--------------|--------|--------|----------------|
| Hero tagline, lead, CTA | Hero 25% in view | Opacity 0 to 1, translateY 40px to 0 | 0.8s; delays 0, 0.1s, 0.2s | site curve | Shown in place |
| Cursors arrive | Hero 25% in view | Opacity 0 to 1, from (+0.22 w, +0.5 w) | 1.5s; delay 0.1s + 0.07s x index | site curve | Shown in place |
| Cursor drift | Always | translate(0.4d, d) to (-0.4d, -d), d = 4 + depth x 0.5 px | 9 to 15s each, alternate, infinite, staggered start | ease-in-out | Still |
| Steps heading, rows | Block 25% in view | Same rise as hero | 0.8s; rows at 0.1, 0.2, 0.3s | site curve | Shown |
| Storefront tiles | Frame 40% in view, or Replay | 0 to 35%: fade in and rise 1.5rem. 55 to 100%: big tiles scale 0.48 to 1 from top left | 0.9s each; delay 0.15s + 0.32s x index; done by about 2.65s | site curve per segment | Built grid; Replay hidden |
| Tile hover | Pointer hover (hover-capable devices) | Photo scales to 1.04 | 500ms | site curve | None |
| Rotating word | While the heading is on screen | Next word waits above (translateY -100%, 32% opacity, 3px blur), then drops in. The old word falls below (100%, 0, 8px blur) | Hold 2.4s, move 0.7s | site curve | Shows "sale" |
| Callout copy, lead, cards | Block 25% in view | Rise | 0.8s; delays 0, 0.1s, 0.2s | site curve | Shown |
| Screenshot | Block 25% in view | Rise | 0.8s | site curve | Shown |
| Purple wash | Always | Blobs translate by up to 8% and 5%, scale 0.95 to 1.12 | 14s and 18s loops | ease-in-out | Still |
| Feature card | Click, tap, Enter, Space | Panel rows 0fr to 1fr. Plus turns 45deg into an x. Icon turns purple. One card open at a time | 300ms (icon color 150ms) | ease-out | Instant |
| CTA | Hover | Arrow translate(3px, -3px) | 200ms | ease-out | Arrow stays |
| Meta link, Replay | Hover | Color brightens | 200ms | ease | Instant |

---

## 7. Code

### 7.1 Files

```
squareshare-showcase/
├── squareshare-showcase.css   all styles, scoped to .ss-showcase
├── data.ts                    copy, tiles, features, cursor specs, asset path
├── icons.tsx                  Icon (6 Lucide paths) + SquareShareLogo
├── hooks.ts                   useMediaQuery, useReducedMotion, useInView, useEntrance, replayEntrance
├── Entrance.tsx               client wrapper for the scroll-in entrance
├── CursorField.tsx            hero cursors (server-safe, no JS)
├── PixelSeam.tsx              dark-to-light seam (server-safe, no JS)
├── BuildPreview.tsx           storefront grid that builds itself (client)
├── RotatingWord.tsx           the "Every ___" drum (client)
├── FeatureCards.tsx           dark disclosure cards (client)
└── SquareShareShowcase.tsx    the section; no hooks, so a Server Component in Next.js
```

Only `Entrance`, `BuildPreview`, `RotatingWord`, and `FeatureCards` carry `"use client"`. Outside Next.js the directive is a harmless string.

### 7.2 `squareshare-showcase.css`

```css
/* =========================================================================
   Square Share showcase
   Every rule is scoped under .ss-showcase and every token is an --ss-*
   variable, so nothing leaks into the host page. Element defaults (margins,
   list styles, button chrome) are reset here too, so it renders the same with
   or without Tailwind's preflight on the host.
   ========================================================================= */

.ss-showcase {
  /* Color. Purple is the only hue; everything else is black, white, gray. */
  --ss-acid: #a855f7;
  --ss-acid-glow: rgb(168 85 247 / 0.15);
  --ss-black: #000000;
  --ss-card: #0a0a0a;
  --ss-white: #ffffff;
  --ss-light: #f9f9f9;
  --ss-neutral-50: #fafafa;
  --ss-neutral-100: #f5f5f5;
  --ss-neutral-200: #e5e5e5;
  --ss-neutral-300: #d4d4d4;
  --ss-neutral-500: #737373;
  --ss-neutral-600: #525252;
  --ss-neutral-900: #171717;
  --ss-heading-muted: #8a8a8a;
  --ss-text-dim: rgb(255 255 255 / 0.5);
  --ss-text-soft: rgb(255 255 255 / 0.7);
  --ss-line-dark: rgb(255 255 255 / 0.1);

  /* Type. --font-ss-* are set by next/font when used; otherwise the family
     names below must be loaded (Google Fonts link in the spec). */
  --ss-font-display: var(--font-ss-display, "Space Grotesk"), ui-sans-serif, system-ui, sans-serif;
  --ss-font-sans: var(--font-ss-sans, "Geist"), ui-sans-serif, system-ui, sans-serif;
  --ss-font-mono: var(--font-ss-mono, "JetBrains Mono"), ui-monospace, monospace;

  /* Motion: the site's one curve, a soft back-out. */
  --ss-ease: cubic-bezier(0.22, 1, 0.36, 1);

  /* Elevation, on light surfaces only. */
  --ss-shadow-frame: 0 20px 60px -20px rgb(0 0 0 / 0.18);

  container: ss / inline-size;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid var(--ss-line-dark);
  background: var(--ss-black);
  color: var(--ss-white);
  font-family: var(--ss-font-sans);
  font-size: 1rem;
  line-height: 1.5;
  text-align: left;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ---- Reset (zero specificity past the scope, so component rules win) ---- */

.ss-showcase *,
.ss-showcase *::before,
.ss-showcase *::after {
  box-sizing: border-box;
}
.ss-showcase :where(h2, h3, h4, p, ol, ul, li, figure) {
  margin: 0;
  padding: 0;
}
.ss-showcase :where(ol, ul) {
  list-style: none;
}
.ss-showcase :where(h2, h3, h4) {
  font-size: inherit;
  font-weight: inherit;
}
.ss-showcase :where(img, svg) {
  display: block;
  max-width: 100%;
}
.ss-showcase :where(button) {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
}
/* Plain selectors here, not :where, so a host's a:hover or a:visited can't
   recolor or underline the showcase's links. */
.ss-showcase a,
.ss-showcase a:hover {
  color: inherit;
  text-decoration: none;
}

.ss-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.ss-nowrap {
  white-space: nowrap;
}
.ss-block {
  display: block;
}

/* ---- Entrance: fade up 40px as a block scrolls in (see useEntrance) ---- */

.ss-showcase :is([data-ss-state="armed"] .ss-rise, .ss-rise[data-ss-state="armed"]) {
  opacity: 0;
}
.ss-showcase :is([data-ss-state="play"] .ss-rise, .ss-rise[data-ss-state="play"]) {
  animation: ss-rise 0.8s var(--ss-ease) var(--ss-delay, 0s) both;
}
@keyframes ss-rise {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---- Meta bar ---- */

.ss-meta {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--ss-line-dark);
  /* Opaque, so hero cursors that reach up pass behind it. */
  background: var(--ss-black);
}
.ss-meta__brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-family: var(--ss-font-sans);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.025em;
  color: var(--ss-white);
}
.ss-meta__logo {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}
.ss-meta__side {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.ss-meta__stack {
  display: none;
  font-family: var(--ss-font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.025em;
  color: var(--ss-text-dim);
}
.ss-showcase .ss-meta__link {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--ss-font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.025em;
  color: rgb(255 255 255 / 0.6);
  transition: color 200ms;
}
.ss-showcase .ss-meta__link:hover {
  color: var(--ss-white);
}
.ss-meta__link:focus-visible {
  outline: 2px solid var(--ss-white);
  outline-offset: 2px;
}
.ss-meta__link svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* ---- Hero (dark) ---- */

.ss-hero {
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(28rem, 56cqi, 36rem);
  padding: 4.5rem 1.5rem 5.5rem;
  /* Sideways only: cursors run on down into the seam, behind its light
     squares, as they cross into the next section on the live site. */
  overflow-x: clip;
  text-align: center;
}
.ss-hero__copy {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 64rem;
}
.ss-hero__title {
  margin-bottom: 1.5rem;
  font-family: var(--ss-font-display);
  font-size: clamp(2.75rem, 9.5cqi, 6rem);
  font-weight: 700;
  line-height: 1.16;
  letter-spacing: -0.025em;
  color: var(--ss-white);
}
/* On narrow layouts the last word is set larger than the line, as on the site. */
.ss-hero__word {
  font-size: 1.6em;
  line-height: 1;
  color: var(--ss-acid);
}
.ss-hero__lead {
  max-width: 36rem;
  margin: 0 auto 2.5rem;
  font-size: 1.125rem;
  line-height: 1.55;
  color: var(--ss-text-dim);
}

/* The site's one CTA: a flat white rectangle. Only the arrow moves on hover. */
.ss-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1rem 1.75rem;
  background: var(--ss-white);
  font-family: var(--ss-font-sans);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.5;
  white-space: nowrap;
  user-select: none;
  outline: none;
}
.ss-showcase .ss-cta,
.ss-showcase .ss-cta:hover {
  color: var(--ss-black);
}
.ss-cta:focus-visible {
  box-shadow: 0 0 0 2px var(--ss-black), 0 0 0 4px var(--ss-white);
}
.ss-cta__arrow {
  width: 1.1em;
  height: 1.1em;
  flex-shrink: 0;
  transition: transform 200ms ease-out;
}
@media (prefers-reduced-motion: no-preference) {
  .ss-cta:hover .ss-cta__arrow {
    transform: translate(3px, -3px);
  }
}

/* ---- Hero cursors ---- */

.ss-cursors {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

/* --x / --y place the tip, --w is the width. */
.ss-cursor {
  position: absolute;
  left: calc(var(--x) - var(--w) * 0.096);
  top: calc(var(--y) - var(--w) * 0.096);
  width: var(--w);
  aspect-ratio: 15.7 / 21.8;
}
.ss-cursor[data-wide] {
  display: none;
}
.ss-cursor__enter,
.ss-cursor__drift,
.ss-cursor__tilt {
  position: absolute;
  inset: 0;
}

/* Arriving: each glides in from below right, a beat after the last. */
.ss-showcase [data-ss-state="armed"] .ss-cursor__enter {
  opacity: 0;
}
.ss-showcase [data-ss-state="play"] .ss-cursor__enter {
  animation: ss-cursor-enter 1.5s var(--ss-ease) var(--delay, 0s) backwards;
}
@keyframes ss-cursor-enter {
  from {
    opacity: 0;
    transform: translate3d(calc(var(--w) * 0.22), calc(var(--w) * 0.5), 0);
  }
}

/* Hanging: a slow drift along the way it points, each on its own clock. */
.ss-cursor__drift {
  animation: ss-cursor-drift var(--drift-time, 11s) ease-in-out var(--drift-delay, 0s) infinite alternate;
}
@keyframes ss-cursor-drift {
  from {
    transform: translate3d(calc(var(--drift) * 0.4), var(--drift), 0);
  }
  to {
    transform: translate3d(calc(var(--drift) * -0.4), calc(var(--drift) * -1), 0);
  }
}

/* Turned about the tip, so the tip stays where --x / --y put it. */
.ss-cursor__tilt {
  opacity: var(--alpha, 1);
  transform-origin: 9.6% 6.9%;
  transform: perspective(1400px) rotateX(var(--rx, 0deg)) rotate(var(--rz, 0deg));
}

/* Up to three stacked copies (softer, soft, sharp), each padded by --pad so
   its blur has room. */
.ss-cursor__layer {
  position: absolute;
  inset: calc(var(--pad, 0px) * -1);
  padding: var(--pad, 0px);
}
.ss-cursor__layer svg {
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: visible;
}
.ss-cursor__layer--soft svg {
  filter: blur(var(--soft));
}
.ss-cursor__layer--softer svg {
  filter: blur(var(--softer));
}

/* In focus at the tip, soft toward the tail: overlapping bands, tip to tail
   (159deg in the arrow's own box). */
.ss-cursor[data-focus="tip"] .ss-cursor__layer--sharp {
  -webkit-mask-image: linear-gradient(159deg, #000 40%, transparent 58%);
  mask-image: linear-gradient(159deg, #000 40%, transparent 58%);
}
.ss-cursor[data-focus="tip"] .ss-cursor__layer--soft {
  -webkit-mask-image: linear-gradient(159deg, transparent 26%, #000 40%, #000 60%, transparent 76%);
  mask-image: linear-gradient(159deg, transparent 26%, #000 40%, #000 60%, transparent 76%);
}
.ss-cursor[data-focus="tip"] .ss-cursor__layer--softer {
  -webkit-mask-image: linear-gradient(159deg, transparent 46%, #000 62%);
  mask-image: linear-gradient(159deg, transparent 46%, #000 62%);
}

/* The arrow: an outline only, heavy enough to carry the shape. */
.ss-ink {
  fill: none;
  stroke: var(--ss-acid);
  stroke-width: 0.8;
  stroke-linejoin: round;
}
.ss-ink--plain {
  stroke: rgb(255 255 255 / 0.55);
  stroke-width: 0.5;
}

/* ---- Pixel seam (dark to light) ---- */

.ss-seam {
  position: relative;
  pointer-events: none;
}
.ss-seam__band {
  position: relative;
  width: 100%;
  aspect-ratio: var(--cols) / var(--rows);
}
.ss-seam__band svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ss-seam__band path {
  fill: var(--ss-light);
}
.ss-seam__band--m,
.ss-seam__band--l {
  display: none;
}

/* ---- Light panel ---- */

/* Pulled up 1px under the seam so a fractional edge can't leave a hairline. */
.ss-light {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin-top: -1px;
  padding: 1.5rem 1.25rem 4rem;
  background: var(--ss-light);
  color: var(--ss-neutral-900);
}
.ss-h3 {
  font-family: var(--ss-font-display);
  font-size: clamp(2.25rem, 7cqi, 3.5rem);
  font-weight: 700;
  line-height: 1.05;
  color: var(--ss-neutral-900);
}
.ss-h3__muted {
  color: var(--ss-heading-muted);
}

/* Steps */
.ss-steps {
  display: grid;
  align-items: center;
  gap: 2.5rem;
}
.ss-step-list {
  margin-top: 2rem;
}
.ss-step {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.25rem 0;
  border-top: 1px solid var(--ss-neutral-200);
}
.ss-step__num {
  flex-shrink: 0;
  width: 3.5rem;
  font-family: var(--ss-font-display);
  font-size: 3rem;
  font-weight: 700;
  line-height: 0.9;
  color: var(--ss-neutral-200);
}
.ss-step__eyebrow {
  font-family: var(--ss-font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--ss-neutral-500);
}
.ss-step__title {
  margin-top: 0.5rem;
  font-family: var(--ss-font-display);
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ss-neutral-900);
}

/* Build preview. The storefront is a picture of a seller's store, so it keeps
   the site's rounded mockup corners; everything that is Square Share's own
   chrome stays square. */
.ss-build {
  width: 100%;
  max-width: 36rem;
  margin-inline: auto;
}
.ss-build__frame {
  aspect-ratio: 4 / 3;
  width: 100%;
  overflow: hidden;
  padding: 0.5rem;
  border: 1px solid var(--ss-neutral-200);
  border-radius: 1rem;
  background: var(--ss-white);
  box-shadow: var(--ss-shadow-frame);
}
.ss-build__inner {
  position: relative;
  height: 100%;
}
.ss-build__guides,
.ss-build__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  height: 100%;
}
.ss-build__guides {
  position: absolute;
  inset: 0;
}
.ss-build__guide {
  border: 1px dashed var(--ss-neutral-300);
  border-radius: 0.5rem;
  background: var(--ss-neutral-50);
}
.ss-build__grid {
  position: relative;
}
.ss-tile {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(229 229 229 / 0.7);
  border-radius: 0.5rem;
  background: var(--ss-neutral-100);
  transform-origin: top left;
}
.ss-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms var(--ss-ease);
}
@media (hover: hover) {
  .ss-tile:hover img {
    transform: scale(1.04);
  }
}
.ss-showcase [data-ss-state="armed"] .ss-tile {
  opacity: 0;
}
.ss-showcase [data-ss-state="play"] .ss-tile {
  animation: ss-tile-in 0.9s var(--ss-ease) calc(0.15s + var(--ss-i) * 0.32s) both;
}
/* Drops in from just below, then (big tiles only) grows from one cell. */
@keyframes ss-tile-in {
  0% {
    opacity: 0;
    transform: translateY(1.5rem) scale(var(--ss-from));
  }
  35% {
    opacity: 1;
    transform: translateY(0) scale(var(--ss-from));
  }
  55% {
    transform: translateY(0) scale(var(--ss-from));
  }
  100% {
    opacity: 1;
    transform: none;
  }
}
.ss-build__bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
.ss-replay {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  font-family: var(--ss-font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ss-neutral-500);
  transition: color 200ms;
}
.ss-replay:hover {
  color: var(--ss-neutral-900);
}
.ss-replay:focus-visible {
  outline: 2px solid var(--ss-neutral-900);
  outline-offset: 2px;
}
.ss-replay__icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* Callout */
.ss-callout {
  display: grid;
  align-items: center;
  gap: 3rem;
  margin-top: 5rem;
}
.ss-callout__lead {
  max-width: 34rem;
  margin-top: 1.25rem;
  font-size: 1.125rem;
  line-height: 1.55;
  color: var(--ss-neutral-600);
}

/* Rotating word ("Every ___"): a drum that turns one word per 2.4s. */
.ss-drum {
  position: relative;
  display: inline-block;
  vertical-align: bottom;
}
.ss-drum__sizer {
  display: inline-grid;
  visibility: hidden;
}
.ss-drum__sizer > span {
  grid-area: 1 / 1;
}
.ss-drum__window {
  position: absolute;
  inset-inline: 0;
  top: -0.75em;
  bottom: -0.02em;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 55%);
  mask-image: linear-gradient(to bottom, transparent, #000 55%);
}
.ss-drum__track {
  position: absolute;
  inset-inline: 0;
  top: 0.75em;
  display: block;
  height: 1em;
}
.ss-drum__word {
  position: absolute;
  top: 0;
  left: 0;
  white-space: nowrap;
  will-change: transform;
  transition:
    transform 700ms var(--ss-ease),
    opacity 700ms var(--ss-ease),
    filter 700ms var(--ss-ease);
}

/* Feature cards: dark cards on the light panel, open on click or tap. */
.ss-features {
  display: grid;
  align-items: start;
  gap: 0.5rem;
  margin-top: 2rem;
}
.ss-feature {
  border: 1px solid var(--ss-line-dark);
  background: var(--ss-card);
  color: var(--ss-white);
}
.ss-feature__toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  outline: none;
}
.ss-feature__toggle:focus-visible {
  box-shadow: inset 0 0 0 2px var(--ss-acid);
}
.ss-feature__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--ss-text-soft);
  transition: color 150ms;
}
.ss-feature__title {
  font-family: var(--ss-font-display);
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.25;
}
.ss-feature__plus {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-left: auto;
  color: var(--ss-text-dim);
  transition: transform 300ms;
}
.ss-feature__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.ss-feature__body {
  overflow: hidden;
  padding: 0 1rem;
  font-size: 0.875rem;
  line-height: 1.375;
  color: var(--ss-text-soft);
}
.ss-feature__body > span {
  display: block;
  padding-bottom: 0.75rem;
}
.ss-feature[data-open="true"] .ss-feature__panel {
  grid-template-rows: 1fr;
}
.ss-feature[data-open="true"] .ss-feature__icon {
  color: var(--ss-acid);
}
.ss-feature[data-open="true"] .ss-feature__plus {
  transform: rotate(45deg);
}

/* Dashboard screenshot over a low purple wash. */
.ss-shot {
  position: relative;
  isolation: isolate;
}
.ss-shot__glow {
  position: absolute;
  inset: -2rem -1.5rem 0;
  z-index: -1;
  pointer-events: none;
}
.ss-shot__blob {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 60%;
  background: var(--ss-acid-glow);
  filter: blur(64px);
}
.ss-shot__blob--a {
  left: 0;
  animation: ss-glow-roam-a 14s ease-in-out infinite;
}
.ss-shot__blob--b {
  right: 0;
  animation: ss-glow-roam-b 18s ease-in-out infinite;
}
@keyframes ss-glow-roam-a {
  0%,
  100% {
    transform: translate(-8%, -4%) scale(1);
  }
  50% {
    transform: translate(8%, 5%) scale(1.12);
  }
}
@keyframes ss-glow-roam-b {
  0%,
  100% {
    transform: translate(8%, 4%) scale(1.1);
  }
  50% {
    transform: translate(-8%, -5%) scale(0.95);
  }
}
.ss-shot__frame {
  position: relative;
  border: 1px solid var(--ss-neutral-200);
  border-bottom: 0;
  background: var(--ss-white);
}
.ss-shot__frame img {
  width: 100%;
  height: auto;
}
/* Runs a hair past the image so no sliver shows at a fractional edge. */
.ss-shot__fade {
  position: absolute;
  inset-inline: 0;
  bottom: -2px;
  height: 40%;
  background: linear-gradient(to bottom, transparent, var(--ss-light));
  pointer-events: none;
}

/* ---- Wider layouts (container queries: the showcase's own width) ---- */

@container ss (min-width: 30rem) {
  .ss-seam__band--s {
    display: none;
  }
  .ss-seam__band--m {
    display: block;
  }
}

@container ss (min-width: 48rem) {
  .ss-meta {
    padding: 1rem 1.5rem;
  }
  .ss-meta__stack {
    display: block;
  }
  .ss-cursor[data-wide] {
    display: block;
  }
  .ss-hero {
    padding-bottom: 4rem;
  }
  .ss-hero__title {
    line-height: 0.92;
  }
  .ss-hero__word {
    font-size: 1em;
  }
  .ss-hero__lead {
    font-size: 1.25rem;
  }
  .ss-light {
    padding: 2rem 3rem 5rem;
  }
  .ss-features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container ss (min-width: 56rem) {
  .ss-seam__band--m {
    display: none;
  }
  .ss-seam__band--l {
    display: block;
  }
  .ss-h3 {
    font-size: clamp(2rem, 4.5cqi, 3.25rem);
  }
  .ss-steps {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: 4rem;
  }
  .ss-build {
    max-width: none;
  }
  .ss-callout {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 4rem;
    margin-top: 7rem;
  }
  .ss-callout__visual {
    order: -1;
  }
  .ss-features {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ---- Reduced motion: everything holds still and stays visible ---- */

@media (prefers-reduced-motion: reduce) {
  .ss-showcase *,
  .ss-showcase *::before,
  .ss-showcase *::after {
    animation: none !important;
    transition: none !important;
  }
  .ss-showcase [data-ss-state] :is(.ss-rise, .ss-tile, .ss-cursor__enter),
  .ss-showcase .ss-rise[data-ss-state] {
    opacity: 1;
  }
  .ss-replay {
    display: none;
  }
}
```

### 7.3 `data.ts`

```ts
// Everything the showcase says and shows. Copy is verbatim from squareshare.eu
// unless a comment says otherwise, so change it there first, then here.
import type { IconName } from "./icons";

/** Where the copied image files live in the host app's public folder. */
export const ASSET_BASE = "/showcase/squareshare";

export const SQ = {
  name: "Square Share",
  url: "https://squareshare.eu",
  domain: "squareshare.eu",
  stack: ["Next.js", "Tailwind CSS", "Supabase", "Cloudflare"],
} as const;

export const HERO = {
  lead: "Start taking payments anywhere people find you. Run it all from one dashboard.",
  // Showcase-only: the live site's button says "Get started" and opens its waitlist.
  cta: "Visit squareshare.eu",
} as const;

export const STEPS = [
  { num: "01", eyebrow: "Build your shelf", title: "Curate a grid that's all yours." },
  { num: "02", eyebrow: "Embed anywhere", title: "Drop your storefront onto your site." },
  { num: "03", eyebrow: "Get discovered and sell", title: "Connect Stripe and take payment." },
] as const;

// The storefront the live site builds in its "3 steps" section: a 4 x 3 grid,
// every tile placed by hand, square cells so the square photos never crop.
// The order is the order the tiles drop in.
export interface Tile {
  id: string;
  file: string;
  col: number; // 1-based column start
  row: number; // 1-based row start
  cw: number; // column span
  rh: number; // row span
}

export const TILES: readonly Tile[] = [
  { id: "camera", file: "product-01.jpg", col: 1, row: 1, cw: 2, rh: 2 },
  { id: "monstera", file: "product-04.jpg", col: 3, row: 1, cw: 1, rh: 1 },
  { id: "watch", file: "product-03.jpg", col: 4, row: 1, cw: 1, rh: 1 },
  { id: "headphones", file: "product-02.jpg", col: 3, row: 2, cw: 2, rh: 2 },
  { id: "succulent", file: "product-07.jpg", col: 1, row: 3, cw: 1, rh: 1 },
  { id: "mouse", file: "product-05.jpg", col: 2, row: 3, cw: 1, rh: 1 },
];

// "Every ___" in the dashboard heading. The first word is what renders on the
// server, without JavaScript, and under reduced motion.
export const ROTATING_WORDS = ["sale", "channel", "post", "member", "order", "store", "metric"] as const;

export const CALLOUT = {
  lead: "Manage the whole sales side of your business in one place. Sales, channels, social content, orders, storefront design, and analytics are already connected, so there is nothing to wire up.",
  screenshot: "squareshare1.webp",
  screenshotAlt: "The Square Share dashboard with a storefront grid of photos",
  screenshotWidth: 2532,
  screenshotHeight: 1599,
} as const;

export interface Feature {
  icon: IconName;
  title: string;
  body: string;
}

// Three of the live site's seven dashboard cards: the ones that explain the
// product fastest.
export const FEATURES: readonly Feature[] = [
  {
    icon: "layoutGrid",
    title: "Storefront design",
    body: "Arrange your products in a grid and size each one. No templates, no code.",
  },
  {
    icon: "waypoints",
    title: "Sales channels",
    body: "Storefronts and purchase buttons on any site, managed from one list.",
  },
  {
    icon: "chartColumn",
    title: "Analytics",
    body: "See which channels and content bring in sales.",
  },
];

// The hero's arrow cursors: purple ones are attention that bought, faint
// white outlines ("plain") are attention that hasn't yet. Each tip points at
// the headline: rz = atan2(-dx, dy) * 180 / PI + 22.3, where (dx, dy) is the
// tip's offset in px from the hero's center (worked out for a 1100 x 560 hero).
export interface CursorSpec {
  x: string; // tip position, from the hero's top left
  y: string;
  w: string; // width; height follows at 21.8 / 15.7
  rz: number; // turn in the plane of the screen, degrees
  rx?: number; // lean toward the viewer, degrees
  focus: "all" | "none" | "tip"; // which part is sharp
  blur?: number; // px, for the soft parts
  alpha?: number;
  plain?: boolean;
  depth: number; // how near it is; sets how far it drifts
  wide?: boolean; // only shown when the showcase is 48rem or wider
}

export const CURSORS: readonly CursorSpec[] = [
  // Far: small, soft, faint
  { x: "7%", y: "11%", w: "16px", rz: 137.4, focus: "none", blur: 1, alpha: 0.5, depth: 4 },
  { x: "95.5%", y: "66%", w: "18px", rz: -57.5, focus: "none", blur: 0.6, alpha: 0.8, plain: true, depth: 5, wide: true },
  { x: "10%", y: "84%", w: "18px", rz: 88.9, focus: "none", blur: 0.8, alpha: 0.7, plain: true, depth: 4 },
  // In focus, on the same plane as the words
  { x: "72.5%", y: "14%", w: "clamp(28px, 3.6cqi, 40px)", rz: -106.4, focus: "all", plain: true, depth: 9 },
  { x: "13.5%", y: "55%", w: "clamp(48px, 6.5cqi, 72px)", rz: 108, focus: "all", depth: 14, wide: true },
  { x: "53.5%", y: "91%", w: "clamp(40px, 5.4cqi, 60px)", rz: 11.8, focus: "all", depth: 12 },
  { x: "84.5%", y: "39%", w: "clamp(60px, 8cqi, 88px)", rz: -76.7, rx: 8, focus: "tip", blur: 4, depth: 18, wide: true },
  // Near: big and out of focus
  { x: "20%", y: "16%", w: "clamp(90px, 11.5cqi, 130px)", rz: 142.2, focus: "none", blur: 12, alpha: 0.7, depth: 44, wide: true },
  { x: "77%", y: "88%", w: "clamp(110px, 13.5cqi, 150px)", rz: -35.4, rx: 12, focus: "tip", blur: 12, depth: 30 },
];
```

### 7.4 `icons.tsx`

```tsx
import type { ReactNode } from "react";

export type IconName =
  | "arrowUpRight"
  | "plus"
  | "layoutGrid"
  | "waypoints"
  | "chartColumn"
  | "rotateCcw";

// Path data from Lucide (ISC license), the icon set squareshare.eu uses,
// inlined so the showcase needs no icon package.
const PATHS: Record<IconName, ReactNode> = {
  arrowUpRight: (
    <>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </>
  ),
  plus: (
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>
  ),
  layoutGrid: (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ),
  waypoints: (
    <>
      <circle cx="12" cy="4.5" r="2.5" />
      <path d="m10.2 6.3-3.9 3.9" />
      <circle cx="4.5" cy="12" r="2.5" />
      <path d="M7 12h10" />
      <circle cx="19.5" cy="12" r="2.5" />
      <path d="m13.8 17.7 3.9-3.9" />
      <circle cx="12" cy="19.5" r="2.5" />
    </>
  ),
  chartColumn: (
    <>
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </>
  ),
  rotateCcw: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 2,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

// The Square Share mark: three flush squares make an L (square), and a
// smaller, detached L sits up and to the right (share).
export function SquareShareLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7 7"
      width="22"
      height="22"
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="0" y="1" width="3" height="3" />
      <rect x="0" y="4" width="3" height="3" />
      <rect x="3" y="4" width="3" height="3" />
      <rect x="4" y="0" width="3" height="1" />
      <rect x="6" y="0" width="1" height="3" />
    </svg>
  );
}
```

### 7.5 `hooks.ts`

```ts
import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** SSR-safe media query: false on the server and during hydration, then live. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION);
}

/** True while the element is on screen. */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) setInView(last.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/**
 * The scroll-in entrance, driven by a data attribute so it costs no renders.
 * An element still below the fold gets data-ss-state="armed" (hidden by the
 * stylesheet), then "play" once enough of it scrolls in. The server markup
 * carries no state, so without JavaScript, under reduced motion, or when the
 * element is already on screen at load, everything just stays visible.
 */
export function useEntrance(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.25
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia(REDUCED_MOTION).matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.ssState = "armed";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.dataset.ssState = "play";
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      delete el.dataset.ssState;
    };
  }, [ref, threshold]);
}

/** Plays an entrance again from the start. */
export function replayEntrance(el: HTMLElement): void {
  el.dataset.ssState = "armed";
  // Reading layout flushes the "armed" styles, so the animation restarts.
  el.getBoundingClientRect();
  el.dataset.ssState = "play";
}
```

### 7.6 `Entrance.tsx`

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { useEntrance } from "./hooks";

// A block that fades up as it scrolls into view. Children marked .ss-rise
// animate; the block itself does too if it carries .ss-rise.
export default function Entrance({
  children,
  className,
  threshold,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEntrance(ref, threshold);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

### 7.7 `CursorField.tsx`

```tsx
import type { CSSProperties } from "react";
import type { CursorSpec } from "./data";

// The arrow's box, with its tip at (4, 2.2), so the stylesheet can place,
// turn, and mask it about the tip.
const VIEW_BOX = "2.5 0.7 15.7 21.8";
const POINTER = "M4 2.2 L4 18.8 L8.3 14.6 L11.1 21 L13.8 19.8 L11 13.5 L16.7 13.2 Z";

function Glyph({ plain }: { plain?: boolean }) {
  return (
    <svg viewBox={VIEW_BOX} aria-hidden="true" focusable="false">
      <path d={POINTER} className={plain ? "ss-ink ss-ink--plain" : "ss-ink"} />
    </svg>
  );
}

// One cursor: up to three copies of the arrow stacked (softer, soft, sharp),
// masked so a "tip" cursor is in focus at the tip and blurred toward the tail.
function Cursor({ spec, index }: { spec: CursorSpec; index: number }) {
  const { focus, blur = 0, plain } = spec;
  const ranged = focus === "tip";
  const style = {
    "--x": spec.x,
    "--y": spec.y,
    "--w": spec.w,
    "--alpha": spec.alpha ?? 1,
    "--rz": `${spec.rz}deg`,
    "--rx": `${spec.rx ?? 0}deg`,
    "--soft": `${ranged ? blur * 0.3 : blur}px`,
    "--softer": `${blur}px`,
    "--pad": `${Math.ceil(blur * 2.5)}px`,
    // Each arrives a beat after the last, and drifts on its own clock.
    "--delay": `${(0.1 + index * 0.07).toFixed(2)}s`,
    "--drift": `${4 + spec.depth * 0.5}px`,
    "--drift-time": `${9 + ((index * 29) % 7)}s`,
    "--drift-delay": `${-((index * 17) % 9)}s`,
  } as CSSProperties;

  return (
    <div
      className="ss-cursor"
      data-focus={focus}
      data-wide={spec.wide ? "" : undefined}
      style={style}
    >
      <div className="ss-cursor__enter">
        <div className="ss-cursor__drift">
          <div className="ss-cursor__tilt">
            {ranged ? (
              <div className="ss-cursor__layer ss-cursor__layer--softer">
                <Glyph plain={plain} />
              </div>
            ) : null}
            {focus !== "all" ? (
              <div className="ss-cursor__layer ss-cursor__layer--soft">
                <Glyph plain={plain} />
              </div>
            ) : null}
            {focus !== "none" ? (
              <div className="ss-cursor__layer ss-cursor__layer--sharp">
                <Glyph plain={plain} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Arrow cursors hanging round the hero's words at different depths. Pure
// markup and CSS: no JavaScript, so it renders on the server as is.
export default function CursorField({ cursors }: { cursors: readonly CursorSpec[] }) {
  return (
    <div className="ss-cursors" aria-hidden="true">
      {cursors.map((spec, i) => (
        <Cursor key={i} spec={spec} index={i} />
      ))}
    </div>
  );
}
```

### 7.8 `PixelSeam.tsx`

```tsx
import type { CSSProperties } from "react";

// Deterministic pseudo-random in [0, 1): the same scatter on every load, and
// the same on the server and the client.
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
}

// How deep the black runs in each column. Each column heads for a fresh
// random depth but moves at most 1 row from its neighbor (2, now and then),
// so the edge looks noisy without tall one-column drips.
function skylineDepths(cols: number, rows: number, minDepth: number): number[] {
  const span = rows - minDepth + 1;
  const out: number[] = [];
  let d = minDepth + Math.floor(seededRandom(2.7) * span);
  for (let c = 0; c < cols; c++) {
    if (c > 0) {
      const target = minDepth + Math.floor(seededRandom(c * 1.37 + 0.5) * span);
      const limit = seededRandom(c * 5.1 + 9) < 0.22 ? 2 : 1;
      d = Math.min(d + limit, Math.max(d - limit, target));
    }
    out.push(d);
  }
  return out;
}

// The light ground under the skyline, as one path so no seams show between
// cells. The black above it is left transparent: that is the hero showing
// through, so the hero's cursors can pass behind the light squares.
function groundPath(depths: number[], rows: number): string {
  let d = `M0 ${rows}`;
  depths.forEach((depth, c) => {
    d += `V${depth}H${c + 1}`;
  });
  return `${d}V${rows}Z`;
}

// Column counts per showcase width, so the cells stay roughly 25 to 50px
// square. The stylesheet shows one band at a time with container queries.
const BANDS = [
  { cols: 10, className: "ss-seam__band ss-seam__band--s" },
  { cols: 18, className: "ss-seam__band ss-seam__band--m" },
  { cols: 28, className: "ss-seam__band ss-seam__band--l" },
] as const;

// The jagged pixel edge where the black hero meets the light panel: black
// runs down into the light as a ragged skyline of squares instead of a flat
// line. Static and decorative.
export default function PixelSeam({
  rows = 4,
  minDepth = 1,
}: {
  rows?: number;
  minDepth?: number;
}) {
  return (
    <div className="ss-seam" aria-hidden="true">
      {BANDS.map((band) => (
        <div
          key={band.cols}
          className={band.className}
          style={{ "--cols": band.cols, "--rows": rows } as CSSProperties}
        >
          <svg
            viewBox={`0 0 ${band.cols} ${rows}`}
            preserveAspectRatio="none"
            shapeRendering="crispEdges"
            focusable="false"
          >
            <path d={groundPath(skylineDepths(band.cols, rows, minDepth), rows)} />
          </svg>
        </div>
      ))}
    </div>
  );
}
```

### 7.9 `BuildPreview.tsx`

```tsx
"use client";

import { useRef, type CSSProperties } from "react";
import { ASSET_BASE, TILES } from "./data";
import { replayEntrance, useEntrance } from "./hooks";
import { Icon } from "./icons";

// The storefront grid, built tile by tile as it scrolls into view: each
// product drops into its cell, and the two big tiles then grow from one cell
// to their full 2 x 2. Dashed guides show the empty cells while it builds.
// "Replay build" runs it again.
export default function BuildPreview() {
  const frameRef = useRef<HTMLDivElement>(null);
  useEntrance(frameRef, 0.4);

  const replay = () => {
    if (frameRef.current) replayEntrance(frameRef.current);
  };

  return (
    <div className="ss-build">
      <div
        ref={frameRef}
        role="img"
        aria-label="A Square Share storefront: six product photos in a four by three grid"
        className="ss-build__frame"
      >
        <div className="ss-build__inner" aria-hidden="true">
          <div className="ss-build__guides">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="ss-build__guide" />
            ))}
          </div>
          <div className="ss-build__grid">
            {TILES.map((tile, i) => {
              const big = tile.cw > 1 || tile.rh > 1;
              const style = {
                gridColumn: `${tile.col} / span ${tile.cw}`,
                gridRow: `${tile.row} / span ${tile.rh}`,
                "--ss-i": i,
                // A big tile lands at about one cell's size, then grows.
                "--ss-from": big ? 0.48 : 1,
              } as CSSProperties;
              return (
                <div key={tile.id} className="ss-tile" style={style}>
                  <img
                    src={`${ASSET_BASE}/${tile.file}`}
                    alt=""
                    width={600}
                    height={600}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ss-build__bar">
        <button type="button" className="ss-replay" onClick={replay}>
          <Icon name="rotateCcw" className="ss-replay__icon" />
          Replay build
        </button>
      </div>
    </div>
  );
}
```

### 7.10 `RotatingWord.tsx`

```tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ROTATING_WORDS as WORDS } from "./data";
import { useInView, useReducedMotion } from "./hooks";

const HOLD_MS = 2400;

// Where a word sits on the drum, by how many turns until it is current.
// 0 is on show. 1 waits above the line, blurred and faint, so the reader sees
// what's coming. The one that just left has dropped below, and the rest are
// parked out of sight. Rows move by their own height, so it holds at any size.
function rowStyle(turns: number, count: number): CSSProperties {
  if (turns === 0) return { transform: "translateY(0%)", opacity: 1, filter: "blur(0px)" };
  if (turns === 1) return { transform: "translateY(-100%)", opacity: 0.32, filter: "blur(3px)" };
  if (turns === count - 1) return { transform: "translateY(100%)", opacity: 0, filter: "blur(8px)" };
  return { transform: "translateY(-200%)", opacity: 0, filter: "blur(8px)" };
}

// The changing word in "Every ___". The cell is as wide as the widest word,
// so "Every" never moves. It only turns while on screen, and a screen reader
// hears the first word alone.
export default function RotatingWord() {
  const ref = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const rotating = inView && !reduced;

  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), HOLD_MS);
    return () => clearInterval(id);
  }, [rotating]);

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
              const turns = rotating
                ? (i - index + WORDS.length) % WORDS.length
                : i === 0
                  ? 0
                  : WORDS.length - 2;
              return (
                <span
                  key={word}
                  className="ss-drum__word"
                  style={rowStyle(turns, WORDS.length)}
                >
                  {word}
                </span>
              );
            })}
          </span>
        </span>
      </span>
    </span>
  );
}
```

### 7.11 `FeatureCards.tsx`

```tsx
"use client";

import { useId, useState } from "react";
import { FEATURES, type Feature } from "./data";
import { Icon } from "./icons";

function FeatureCard({
  feature,
  open,
  onToggle,
}: {
  feature: Feature;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  return (
    <li className="ss-feature" data-open={open}>
      <h4>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="ss-feature__toggle"
        >
          <Icon name={feature.icon} className="ss-feature__icon" />
          <span className="ss-feature__title">{feature.title}</span>
          <Icon name="plus" className="ss-feature__plus" />
        </button>
      </h4>
      {/* inert while closed: the line is out of the tab order and hidden
          from screen readers, but stays in the DOM so the height can ease. */}
      <div id={panelId} className="ss-feature__panel" inert={!open}>
        <p className="ss-feature__body">
          <span>{feature.body}</span>
        </p>
      </div>
    </li>
  );
}

// Dark cards, each a title that opens to one line of explanation. One open
// at a time.
export default function FeatureCards() {
  const [openTitle, setOpenTitle] = useState<string | null>(null);
  return (
    <ul className="ss-features">
      {FEATURES.map((feature) => (
        <FeatureCard
          key={feature.title}
          feature={feature}
          open={openTitle === feature.title}
          onToggle={() =>
            setOpenTitle((prev) => (prev === feature.title ? null : feature.title))
          }
        />
      ))}
    </ul>
  );
}
```

### 7.12 `SquareShareShowcase.tsx`

```tsx
import type { CSSProperties } from "react";
import BuildPreview from "./BuildPreview";
import CursorField from "./CursorField";
import Entrance from "./Entrance";
import FeatureCards from "./FeatureCards";
import PixelSeam from "./PixelSeam";
import RotatingWord from "./RotatingWord";
import { ASSET_BASE, CALLOUT, CURSORS, HERO, SQ, STEPS } from "./data";
import { Icon, SquareShareLogo } from "./icons";
import "./squareshare-showcase.css";

const delay = (seconds: number) => ({ "--ss-delay": `${seconds}s` }) as CSSProperties;

// A compact Square Share for a portfolio page: the dark hero, a pixel seam,
// then a light panel with the storefront build and the dashboard callout.
// No hooks here, so in Next.js this stays a Server Component and only the
// interactive leaves ship JavaScript.
export default function SquareShareShowcase({ className }: { className?: string }) {
  return (
    <section
      aria-label="Square Share showcase"
      className={className ? `ss-showcase ${className}` : "ss-showcase"}
    >
      <header className="ss-meta">
        <h2 className="ss-meta__brand">
          <SquareShareLogo className="ss-meta__logo" />
          {SQ.name}
        </h2>
        <div className="ss-meta__side">
          <p className="ss-meta__stack">{SQ.stack.join(" · ")}</p>
          <a
            className="ss-meta__link"
            href={SQ.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {SQ.domain}
            <Icon name="arrowUpRight" />
            <span className="ss-sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </header>

      {/* 1. Hero (dark) */}
      <Entrance className="ss-hero">
        <CursorField cursors={CURSORS} />
        <div className="ss-hero__copy">
          <p className="ss-hero__title ss-rise">
            Turn attention <br />
            into <span className="ss-hero__word">sales</span>
          </p>
          <p className="ss-hero__lead ss-rise" style={delay(0.1)}>
            {HERO.lead}
          </p>
          <a
            className="ss-cta ss-rise"
            style={delay(0.2)}
            href={SQ.url}
            target="_blank"
            rel="noopener noreferrer"
          >
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
          <Entrance className="ss-callout__copy">
            <h3 className="ss-h3 ss-rise">
              <span className="ss-nowrap">
                Every <RotatingWord />
              </span>{" "}
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
    </section>
  );
}
```

### 7.13 Mounting it

**Next.js (App Router).** Adjust the import path to wherever the folder lives. The wrapper's Tailwind classes are only the host container; any 72rem-max, padded container works.

```tsx
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import SquareShareShowcase from "@/components/squareshare-showcase/SquareShareShowcase";

const ssDisplay = Space_Grotesk({ subsets: ["latin"], variable: "--font-ss-display", display: "swap" });
const ssSans = Geist({ subsets: ["latin"], variable: "--font-ss-sans", display: "swap" });
const ssMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-ss-mono", display: "swap" });

export default function WorkPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <SquareShareShowcase className={`${ssDisplay.variable} ${ssSans.variable} ${ssMono.variable}`} />
    </section>
  );
}
```

**Next.js (Pages Router).** Global CSS can only be imported from `_app`. Remove the CSS import from `SquareShareShowcase.tsx` and add `import "../components/squareshare-showcase/squareshare-showcase.css";` to `pages/_app.tsx`.

**Vite or any React app.** Put the Google Fonts `<link>` from section 4.2 in `index.html`, then:

```tsx
import SquareShareShowcase from "./components/squareshare-showcase/SquareShareShowcase";

export function Work() {
  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1rem" }}>
      <SquareShareShowcase />
    </div>
  );
}
```

**Images under a base path.** If Rootlabs is served under a subpath, or the images live elsewhere, change `ASSET_BASE` in `data.ts`. It is the only place image URLs are built.

---

## 8. Accessibility, performance, host compatibility

### 8.1 Accessibility

- **Landmarks and headings:** the showcase is a region labelled "Square Share showcase". The project name is an `h2`, each light-panel block has an `h3`, and card titles are `h4`. Shift the levels if the Rootlabs page outline needs it.
- **Tagline:** "Turn attention into sales" is a `<p>` styled large, not a heading. On the Rootlabs page it is a quoted product line, not a section title.
- **Decoration hidden from screen readers:** cursors, the seam, the glow, step numbers, and the drum's spare words are all `aria-hidden`. The storefront is one `role="img"` with a label, and the screenshot has alt text.
- **Rotating word:** a screen reader hears "Every sale One dashboard." once, not a stream of words.
- **Feature cards:** real buttons with `aria-expanded` and `aria-controls`. A collapsed card's text is `inert`, so it's out of the tab order and hidden from screen readers.
- **New tabs:** both links say "(opens in a new tab)" to screen readers.
- **Contrast (AA):**
  - White 50% on black: 5.3:1.
  - White 60% on black: 7.4:1.
  - White 70% on `#0a0a0a`: 9.7:1.
  - `#525252` on `#f9f9f9`: 7.4:1.
  - `#737373` on `#f9f9f9`: 4.5:1.
  - `#8a8a8a` (large text only) on `#f9f9f9`: 3.3:1.
  - Ghost step numbers (`#e5e5e5`) are decorative and hidden from screen readers.
- **Motion:**
  - Every animation stops under reduced motion.
  - Without reduced motion, the cursor drift and the glow loop for as long as the page is open, as on the live site.
  - If Rootlabs needs a visible pause control for WCAG 2.2.2, add a button that sets `animation-play-state: paused` on `.ss-cursor__drift` and `.ss-shot__blob`.

### 8.2 Performance

- **Size, excluding React** (measured with esbuild, minified):
  - JavaScript: 13.0 KB (4.7 KB gzipped).
  - CSS: 13.2 KB (3.6 KB gzipped).
- **Client JavaScript:** only four small client components: `Entrance`, `BuildPreview`, `RotatingWord`, `FeatureCards`. No animation library. The hero cursors and the seam are static markup.
- **Animation cost:** all motion is CSS `transform`, `opacity`, or `filter`. The blurs (four soft cursors, two glow blobs) are the most expensive part. If they cost too much on low-end phones, drop the two `wide` near cursors first.
- **Images** have `width`, `height`, and `loading="lazy"`, so they don't cause layout shift and load only near the viewport.

### 8.3 Host compatibility

- **Scoping:** everything is namespaced: `.ss-*` classes, `--ss-*` tokens, and a container named `ss`. Nothing is global except `@keyframes` named `ss-*`.
- **Tested against hostile host styles:** these globals were injected on the host page and none changed the showcase:
  - `a`, `a:visited`, `a:hover` set red and underlined
  - `h2, h3, h4, p` with 2rem margins and 40px font size
  - `ul, ol` with disc bullets and 3rem padding
  - `img { height: auto }`
- **Not defended:** host rules on `button:hover` that set a background. If Rootlabs has one, add `.ss-showcase button:hover { background: none; }`.
- **Tailwind:** compatible with Tailwind's preflight (v3 or v4), and doesn't need Tailwind at all.
- **Next.js lint:** `@next/next/no-img-element` warns on the two `<img>` sites. Either disable that rule for this folder, or swap in `next/image`. If you swap, keep `width` and `height`, keep `alt=""` on tiles, and keep the element a direct child of `.ss-tile` and `.ss-shot__frame` so the styles still apply.

---

## 9. Acceptance checklist

Compare against squareshare.eu side by side.

**Visual (wide, 56rem and up)**

- [ ] Black hero with "Turn attention" over "into **sales**"; only "sales" is purple.
- [ ] Nine outline cursors point in at the headline. The near ones are big and blurred; one at the bottom right is sharp at the tip and soft at the tail, and slides behind the seam's light squares.
- [ ] The CTA is a flat white rectangle with square corners and a black label. On hover only the arrow moves, up and right.
- [ ] The seam is a jagged skyline of squares with no straight line and no gray hairline at either edge.
- [ ] The light panel is `#f9f9f9`, not white: steps on the left, the storefront on the right.
- [ ] The storefront has rounded corners (1rem frame, 0.5rem tiles); everything else is square.
- [ ] The callout has the screenshot left over a faint purple wash and the copy right. Cards are near-black with square corners.
- [ ] No color other than purple anywhere.

**Visual (narrow, below 48rem)**

- [ ] No horizontal scroll at 320px viewport width.
- [ ] "sales" is bigger than "into". Only the corner cursors show, and none overlaps the CTA.
- [ ] Order: steps, storefront, callout copy, cards, screenshot.

**Motion**

- [ ] With the showcase below the fold at load: the hero copy rises in and the cursors glide in one after another when it scrolls into view.
- [ ] Storefront tiles drop in one by one, the camera then the headphones growing from one cell to 2 x 2. "Replay build" plays it again.
- [ ] The rotating word turns every 2.4s while on screen: the next word waits blurred above, then drops in.
- [ ] Clicking a card opens it smoothly and turns its icon purple and its plus into an x. Opening another card closes the first.
- [ ] With reduced motion on: nothing moves, everything is visible at once, the word shows "sale", and "Replay build" is hidden.
- [ ] With JavaScript off: everything is visible, the cards are closed, the word shows "sale".

**Code**

- [ ] The eleven files match section 7. `tsc --noEmit` and the Rootlabs lint pass.
- [ ] The seven images load from `ASSET_BASE` (no 404s in the network panel).
- [ ] All copy matches section 11.

---

## 10. Reference: the live site's Tailwind classes

These are verbatim from the squareshare.eu source, for anyone building variants with Tailwind instead of the scoped stylesheet. `acid` and `surface-light` are theme tokens (defined below), and `font-display` maps to Space Grotesk.

| Element | Classes |
|---------|---------|
| Hero headline | `relative font-display font-black tracking-tight text-white mb-6 text-6xl leading-[1.16] md:text-8xl md:leading-[0.92] lg:text-9xl` |
| Hero "sales" | `text-8xl text-acid lg:text-9xl` |
| Hero lead | `text-lg text-white/50 md:text-xl mx-auto mb-10 max-w-xl` |
| CTA (shared) | `group inline-flex shrink-0 items-center justify-center gap-2.5 px-7 py-4 text-base font-black whitespace-nowrap select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50` + light tone `bg-white text-black focus-visible:ring-white focus-visible:ring-offset-black` (hero adds `px-10 py-5 text-lg`) |
| CTA arrow (`ArrowUpRight`, `strokeWidth={2.5}`) | `size-[1.1em] shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none motion-safe:group-hover:translate-x-[3px] motion-safe:group-hover:-translate-y-[3px]` |
| "3 steps" section | `relative scroll-mt-24 overflow-x-clip bg-[#F9F9F9] pb-24 md:pb-32` |
| "3 steps" heading | `font-display text-5xl font-black leading-[1.05] text-neutral-900 md:text-8xl`, muted span `text-neutral-400` |
| Step number | `block font-display text-6xl font-black leading-none text-neutral-200 md:text-7xl` |
| Step title / body | `mt-4 font-display text-3xl font-black leading-tight text-neutral-900 md:text-4xl` / `mt-4 max-w-md text-base leading-relaxed text-neutral-600` |
| Storefront frame | `aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)]` |
| Storefront grid / tile / empty cell | `grid h-full grid-cols-4 grid-rows-3 gap-2` / `relative overflow-hidden rounded-lg border border-neutral-200/70 bg-neutral-100` / `rounded-lg border border-dashed border-neutral-300 bg-neutral-50` |
| Dashboard heading | `font-display text-3xl font-black leading-[1.05] text-neutral-900 min-[360px]:text-4xl sm:text-5xl md:text-7xl lg:text-8xl` |
| Dashboard lead | `mx-auto mt-6 max-w-xl text-lg text-neutral-600 md:text-xl` |
| Feature card | `group border border-white/10 bg-neutral-950 text-white` |
| Card button | `flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-acid` |
| Card icon (18px) / title / plus (16px) | `shrink-0 text-white/70 transition-colors group-data-[open=true]:text-acid` / `font-display text-sm font-bold leading-tight` / `ml-auto shrink-0 text-white/50 transition-transform duration-300 group-data-[open=true]:rotate-45` |
| Card panel / body | `grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-data-[open=true]:grid-rows-[1fr]` / `overflow-hidden px-4 text-sm leading-snug text-white/70` with inner `block pb-3` |
| Purple wash blobs | `animate-glow-roam-a absolute inset-y-0 left-0 w-3/5 bg-acid/15 blur-3xl` and `animate-glow-roam-b absolute inset-y-0 right-0 w-3/5 bg-acid/15 blur-3xl` |
| Screenshot frame / fade | `relative border border-b-0 border-neutral-200 bg-white` / `pointer-events-none absolute inset-x-0 -bottom-0.5 h-2/5 bg-gradient-to-b from-transparent to-surface-light backdrop-blur-sm [mask-image:linear-gradient(to_bottom,transparent,black_70%)]` |
| Header nav link | `text-white/60 hover:text-white font-mono text-xs tracking-wide transition-colors duration-200` |
| Eyebrow | `font-mono text-xs uppercase tracking-[0.25em] text-neutral-400` |

The site's theme tokens (Tailwind v4 `@theme` in `globals.css`). Its shadcn layer also sets `--radius: 0rem`, and the page runs in dark mode.

```css
@theme {
  --color-acid: #a855f7;
  --color-acid-hover: #9333ea;
  --color-surface-dark: #000000;
  --color-surface-light: #F9F9F9;
  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif; /* the loaded face is Geist */
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --shadow-btn-glow: 0 0 30px rgba(168, 85, 247, 0.3);
}
```

---

## 11. Copy reference

Use these strings exactly. Everything except the three marked "showcase only" is verbatim from squareshare.eu.

| Where | Text |
|-------|------|
| Meta bar name | Square Share |
| Meta bar stack (showcase only) | Next.js · Tailwind CSS · Supabase · Cloudflare |
| Meta bar link | squareshare.eu |
| Hero tagline | Turn attention into sales |
| Hero lead | Start taking payments anywhere people find you. Run it all from one dashboard. |
| Hero CTA (showcase only; the site says "Get started") | Visit squareshare.eu |
| Steps heading | It only takes 3 steps |
| Step 01 | Build your shelf / Curate a grid that's all yours. |
| Step 02 | Embed anywhere / Drop your storefront onto your site. |
| Step 03 | Get discovered and sell / Connect Stripe and take payment. |
| Storefront button (showcase only) | Replay build |
| Callout heading | Every [sale, channel, post, member, order, store, metric] / One dashboard. |
| Callout lead | Manage the whole sales side of your business in one place. Sales, channels, social content, orders, storefront design, and analytics are already connected, so there is nothing to wire up. |
| Card: Storefront design | Arrange your products in a grid and size each one. No templates, no code. |
| Card: Sales channels | Storefronts and purchase buttons on any site, managed from one list. |
| Card: Analytics | See which channels and content bring in sales. |
| Screenshot alt | The Square Share dashboard with a storefront grid of photos |

**Copy rules** (Square Share's house style):

- No em dashes or en dashes; use a period, comma, or parentheses.
- Sentence case.
- American spelling.
- Plain, concrete claims only. No "seamless", "robust", "elevate", or "unlock".
