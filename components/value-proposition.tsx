/**
 * Starter "why buy here" content — plain JSX, not Tebex data, meant to be
 * rewritten per store. Ships intentionally unfinished (bracketed
 * placeholders, not polished copy) so it reads as "edit me," not as
 * finished content a forker could mistake for real and leave in place.
 */
export function ValueProposition() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
        {/* Replace with a real headline about why players should buy here. */}
        [Why buy here?]
      </h2>
      {/*
        marker:font-mono/marker:text-primary restyles the bullet itself —
        a small "status readout" touch (see AGENTS.md session notes: this
        is homepage-only for now, PackagePrice/PackageCard elsewhere stay
        plain sans until a deliberate follow-up extends the mono treatment).
      */}
      <ul className="flex list-disc flex-col gap-2 pl-5 text-foreground marker:font-mono marker:text-primary">
        {/* Replace these with real reasons — e.g. delivery speed, checkout
            security, support channels. */}
        <li>[Reason one — e.g. Instant delivery after purchase]</li>
        <li>[Reason two — e.g. Secure checkout powered by Tebex]</li>
        <li>[Reason three — e.g. Friendly support in our Discord]</li>
      </ul>
    </div>
  );
}
