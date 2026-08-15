const TEBEX_LEGAL_LINKS = [
  { href: "https://checkout.tebex.io/impressum", label: "Impressum" },
  { href: "https://checkout.tebex.io/terms", label: "Terms of Service" },
  { href: "https://checkout.tebex.io/privacy", label: "Privacy Policy" },
];

export function Footer({
  siteName,
  platformType,
  discordUrl,
}: {
  siteName: string;
  platformType?: string;
  /** `DISCORD_URL` env var — omitted from the footer entirely when unset. */
  discordUrl?: string;
}) {
  return (
    <footer className="border-t border-border text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} {siteName}
        </span>
        <div className="flex flex-wrap items-center gap-4">
          {platformType ? <span>{platformType}</span> : null}
          {discordUrl ? (
            <a
              href={discordUrl}
              className="focus-ring rounded-sm hover:text-foreground"
            >
              Join our Discord
            </a>
          ) : null}
        </div>
      </div>
      {/*
        Required by Tebex on every storefront built on the Headless API —
        confirmed against Tebex's own docs (docs.tebex.io/developers/templates/footer,
        docs.tebex.io/creators/tebex-control-panel/webstore/appearance/tebex-footer):
        a store built on Tebex's own hosted theme system gets this footer
        injected automatically ("appears automatically without requiring
        developer implementation"), but that injection never happens for a
        Headless API storefront like this one, which renders its own
        complete frontend with no Tebex-side page chrome at all. Tebex's own
        reference Headless client (components/Footer.vue in
        tebexio/Headless-Template) hand-writes the equivalent disclosure for
        exactly this reason — this mirrors that, not an independent choice.
        Removing or hiding it voids Tebex's terms and can get the store
        disabled from public view, since Tebex (as merchant of record) is
        obligated by card-network rules (Visa/Mastercard) to disclose which
        company a customer is actually purchasing from.
      */}
      <div className="border-t border-border px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs">
            This store is powered by Tebex. Tebex Limited is the reseller and
            merchant of record for purchases made here, and handles checkout,
            billing, and order-related inquiries.
          </p>
          <div className="flex shrink-0 gap-4 text-xs">
            {TEBEX_LEGAL_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="focus-ring rounded-sm hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
