import Image from "next/image";
import Link from "next/link";
import type { Package } from "@/lib/tebex/types";
import { PackageBadge } from "./package-badge";
import { PackagePrice } from "./package-price";

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

  return (
    <Link
      href={`/package/${pkg.id}`}
      className={`group flex rounded-lg border border-border bg-card transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        isList ? "flex-row items-center" : "flex-col"
      }`}
    >
      {/*
        overflow-hidden lives here (the image wrapper), not on the outer
        Link, so it only clips the image's rounded corners/hover-scale —
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
        <h3 className="text-sm font-medium text-card-foreground">{pkg.name}</h3>
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
  );
}
