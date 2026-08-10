import Link from "next/link";

const FEATURES = [
  "Browse categories, packages, and package detail pages, with search",
  "A basket: add/remove items, quantities, package variables, and gifting",
  "Coupons, gift cards, and creator codes",
  "Checkout via Tebex.js",
  "Username-based or external-provider authentication, depending on your store",
  "An account page",
];

// Ordered to match the sequence a fresh clone actually requires — you're
// seeing this page at all only because step 1 is already satisfied
// (TEBEX_PUBLIC_TOKEN is thrown-if-unset app-wide, see AGENTS.md), but it's
// listed for completeness rather than starting from step 2, which would
// read as though flipping HOMEPAGE_MODE alone were enough.
const SETUP_STEPS = [
  {
    title: "Set TEBEX_PUBLIC_TOKEN",
    description:
      "Required before any route can render — you're seeing this page, so this part's already done.",
  },
  {
    title: "Add categories and packages",
    description: "In your Tebex dashboard, at creator.tebex.io.",
  },
  {
    title: "Set HOMEPAGE_MODE=storefront",
    description:
      "Once your catalog is ready, to show it here instead of this page.",
  },
];

const RESOURCE_LINKS = [
  { href: "https://creator.tebex.io", label: "Tebex creator dashboard" },
  {
    href: "https://docs.tebex.io/developers/headless-api/overview",
    label: "Tebex Headless API docs",
  },
];

/**
 * Shown on the homepage in place of `CategoryGrid` when `HOMEPAGE_MODE` is
 * unset or not `"storefront"` — the default first-run state for a
 * freshly-cloned store that has a `TEBEX_PUBLIC_TOKEN` but no populated
 * catalog yet. See `app/page.tsx`.
 */
export function GettingStarted() {
  return (
    <div className="flex flex-col gap-12">
      <Intro />
      <Features />
      <SetupSteps />
      <ResourceLinks />
    </div>
  );
}

// Only ever rendered as GettingStarted's own lead-in section — not exported,
// since nothing else in the app shows this content outside template mode.
function Intro() {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <h2 className="text-lg font-medium text-foreground">
        Your store isn&apos;t showing packages here yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Add categories and packages in your Tebex dashboard to start showing
        them here.
      </p>
      <Link
        href="/search"
        className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Browse the store
      </Link>
    </div>
  );
}

function Features() {
  return (
    <div>
      <h3 className="text-base font-medium text-foreground">
        What this template includes
      </h3>
      <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden="true">•</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SetupSteps() {
  return (
    <div>
      <h3 className="text-base font-medium text-foreground">Setup steps</h3>
      <ol className="mt-4 flex flex-col gap-4 text-sm">
        {SETUP_STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="text-muted-foreground">{index + 1}.</span>
            <div>
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ResourceLinks() {
  return (
    <div>
      <h3 className="text-base font-medium text-foreground">Resources</h3>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {RESOURCE_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
