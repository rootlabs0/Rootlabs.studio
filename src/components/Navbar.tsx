import { MenuToggle } from './NavigationOverlay'

const LINKS = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

type NavbarProps = {
  menuOpen: boolean
  onMenuToggle: () => void
}

export function Navbar({ menuOpen, onMenuToggle }: NavbarProps) {
  return (
    // Sits above the overlay (z-40) so the toggle stays reachable to close it.
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10">
      {/* Tint + blur live on their own layer so they never affect the text's stacking. */}
      <div aria-hidden className="absolute inset-0 bg-ink/50 backdrop-blur-md" />

      <div className="relative flex items-center justify-between px-6 py-5 md:px-12 md:py-6">
        <a
          href="#top"
          aria-label="Rootlabs home"
          className="text-xs font-medium uppercase tracking-spaced text-paper transition-opacity duration-300 hover:opacity-70 md:text-sm"
        >
          ROOT<span className="text-zinc-500">LABS</span>
        </a>

        <div className="flex items-center gap-6 md:gap-10">
          <nav
            aria-label="Sections"
            className={`hidden items-center gap-8 transition-opacity duration-300 md:flex ${menuOpen ? 'pointer-events-none opacity-0' : ''}`}
            aria-hidden={menuOpen}
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                tabIndex={menuOpen ? -1 : undefined}
                className="group relative py-1 text-xs uppercase tracking-spaced text-paper/60 transition-colors duration-300 hover:text-paper focus-visible:text-paper"
              >
                {link.label}
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              </a>
            ))}
          </nav>

          <MenuToggle open={menuOpen} onToggle={onMenuToggle} />
        </div>
      </div>
    </header>
  )
}
