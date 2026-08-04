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
      className={`group flex overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary ${
        isList ? "flex-row items-center" : "flex-col"
      }`}
    >
      <div
        className={`relative bg-muted ${
          isList ? "aspect-square h-24 w-24 shrink-0" : "aspect-square w-full"
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
