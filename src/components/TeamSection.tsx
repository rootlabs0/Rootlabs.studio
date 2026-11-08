import { AnimatePresence } from 'framer-motion'
import { useCallback, useState } from 'react'
import { EMAIL } from './contact'
import { ProfileCard } from './ProfileCard'
import { photoPlacement, TEAM, type Member } from './team'
import { TeamProfiles } from './TeamProfiles'

// Meet the team: a dark section after About, continuing its centred grid line. A short heading sits above a row
// of holographic profile cards, one per team member: name and role at the top, a cut-out portrait, and a glass
// bar with handle, status and a contact link. Clicking a card opens the team's profiles (TeamProfiles) on that
// member.
//
// Layout: heading and cards share a 77vw column on desktop (88vw on phones and tablets), centred. Three equal
// columns, so the middle card sits on the grid line. Cards fill their column, capped at 56% of the viewport height
// so heading + cards stay inside one screen. Phones held upright have no room for three across (the cards shrank
// to ~110px, names over faces, 21px buttons), so there the cards stack, one comfortable card per row.

const CONTACT_HREF = `mailto:${EMAIL}`

export function TeamSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const closeProfiles = useCallback(() => setOpenIndex(null), [])

  return (
    <section
      id="team"
      data-snap="start"
      className="relative z-20 flex min-h-svh flex-col justify-center overflow-hidden bg-ink pt-[max(12vh,5rem)] pb-[12vh] text-paper"
    >

      <div className="relative mx-auto w-[88vw] lg:w-[77vw]">
        {/* Ink backing so the grid line breaks around the heading. */}
        <div className="w-fit bg-ink py-2 pr-6">
          <span className="inline-block rounded-full border border-paper px-3 py-0.5 text-xs font-medium uppercase tracking-spaced-sm">
            Team
          </span>
          <h2 className="mt-3 text-[clamp(2rem,4.2vw,4.5rem)] font-semibold leading-[0.95] tracking-tight">
            Meet the team
          </h2>
        </div>

        <ul className="mt-[4vh] grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-[3vw] md:gap-x-[2vw]">
          {TEAM.map((member, index) => (
            <TeamCard key={member.src} member={member} onOpen={() => setOpenIndex(index)} />
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <TeamProfiles key="team-profiles" team={TEAM} initialIndex={openIndex} onClose={closeProfiles} />
        )}
      </AnimatePresence>
    </section>
  )
}

function TeamCard({ member, onOpen }: { member: Member; onOpen: () => void }) {
  return (
    <li>
      <ProfileCard
        // Stacked (phones): a fixed comfortable size rather than a share of the screen. Side by side: 56svh.
        className="[--pc-max-height:min(80svh,25rem)] sm:[--pc-max-height:56svh]"
        name={member.name}
        title={member.role}
        handle={member.handle}
        status="Online"
        avatarUrl={member.src}
        miniAvatarUrl={member.avatar}
        contactHref={CONTACT_HREF}
        avatarStyle={photoPlacement(member)}
        onOpen={onOpen}
        openLabel={`View ${member.name}'s profile`}
      />
    </li>
  )
}
