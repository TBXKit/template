import Image from "next/image";
import Link from "next/link";
import type { Package } from "@/lib/tebex/types";
import { PackageBadge } from "./package-badge";
import { PackagePrice } from "./package-price";
import { QuickAddButton } from "./quick-add-button";

export function PackageCard({
  pkg,
  currency,
  layout = "grid",
}: {
  pkg: Package;
  currency: string;
  layout?: "grid" | "list";
}) {
  const isList = layout === "list";
  // A package with variables needs its full add-to-basket form (per-variable
  // inputs, a recipient field for gifting) — there's no room for that inside
  // a grid tile, so only a variable-less package gets a quick-add control
  // here; everything else still routes through the link below to its own
  // detail page.
  const canQuickAdd = pkg.variables.length === 0;

  return (
    // The quick-add button below is a sibling of the Link, not nested
    // inside it — a <button> inside an <a> is invalid HTML and makes both
    // controls fight over the same click. `group` lives on this wrapper
    // (rather than the Link, as before) so the image's hover-scale still
    // triggers regardless of which part of the card is hovered.
    <div
      className={`group flex rounded-lg border border-border bg-card transition-colors hover:border-primary ${
        isList ? "flex-row items-center" : "flex-col"
      }`}
    >
      <Link
        href={`/package/${pkg.id}`}
        className={`focus-ring flex flex-1 ${
          isList ? "flex-row items-center" : "flex-col"
        }`}
      >
        {/*
          overflow-hidden lives here (the image wrapper), not on the Link
          above, so it only clips the image's rounded corners/hover-scale —
          putting it on the Link itself would also clip its own focus
          outline, making keyboard focus nearly invisible on this card.
        */}
        <div
          className={`relative overflow-hidden bg-muted ${
            isList
              ? "aspect-square h-24 w-24 shrink-0 rounded-l-lg"
              : "aspect-square w-full rounded-t-lg"
          }`}
        >
          {pkg.image ? (
            <Image
              src={pkg.image}
              alt={pkg.name}
              fill
              unoptimized
              sizes={
                isList
                  ? "96px"
                  : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              }
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="text-sm font-medium text-card-foreground">
            {pkg.name}
          </h3>
          <PackageBadge type={pkg.type} />
          <PackagePrice
            basePrice={pkg.base_price}
            totalPrice={pkg.total_price}
            discount={pkg.discount}
            currency={currency}
            className="text-sm font-medium text-primary"
          />
        </div>
      </Link>
      {canQuickAdd ? (
        <div className={isList ? "shrink-0 pr-4" : "px-4 pb-4"}>
          <QuickAddButton packageId={pkg.id} />
        </div>
      ) : null}
    </div>
  );
}
