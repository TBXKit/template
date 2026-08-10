/**
 * Starter "why buy here" content — plain JSX, not Tebex data, meant to be
 * rewritten per store. Ships intentionally unfinished (bracketed
 * placeholders, not polished copy) so it reads as "edit me," not as
 * finished content a forker could mistake for real and leave in place.
 */
export function ValueProposition() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-foreground">
        {/* Replace with a real headline about why players should buy here. */}
        [Why buy here?]
      </h2>
      <ul className="flex flex-col gap-2 text-foreground">
        {/* Replace these with real reasons — e.g. delivery speed, checkout
            security, support channels. */}
        <li>[Reason one — e.g. Instant delivery after purchase]</li>
        <li>[Reason two — e.g. Secure checkout powered by Tebex]</li>
        <li>[Reason three — e.g. Friendly support in our Discord]</li>
      </ul>
    </div>
  );
}
