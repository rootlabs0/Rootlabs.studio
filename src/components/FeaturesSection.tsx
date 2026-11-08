// Dark section after About: a single paragraph-style headline, set near the top. The centred grid line starts
// where the paragraph ends and runs down to the section's bottom edge. On phones the paragraph widens to the 88vw
// column the other sections use and its type roughly doubles, so it reads as a headline rather than fine print.
export function FeaturesSection() {
  return (
    <section
      id="capabilities"
      data-snap="start"
      className="relative z-20 flex min-h-svh flex-col overflow-hidden bg-ink text-paper"
    >
      {/* Phones on their side get the wide-screen measure: at the upright-phone size it would run past one screen. */}
      <div className="relative mx-auto mt-[10vh] w-[88vw] py-[3vw] short:mt-14 short:w-[67vw] md:w-[67vw]">
        <p className="indent-[8vw] text-[6.4vw] font-semibold leading-[1.06] tracking-tight short:indent-[4.7vw] short:text-[3.4vw] short:leading-[1.02] md:indent-[4.7vw] md:text-[3.4vw] md:leading-[1.02]">
          We modernize your digital operations in one place. Optimize with AI Automations, build faster using
          Modular Infrastructure, and link up through a unified Network of innovators who actually get it.
        </p>
      </div>

      {/* ml-[50%] puts the line's left edge on the page centre, exactly where the other sections draw theirs. */}
      <div aria-hidden className="pointer-events-none ml-[50%] w-px flex-1 bg-line" />
    </section>
  )
}
