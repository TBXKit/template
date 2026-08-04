import Image from "next/image";
import Link from "next/link";
import type { Package } from "@/lib/tebex/types";
import { PackagePrice } from "./package-price";

export function PackageCard({
  pkg,
  currency,
}: {
  pkg: Package;
  currency: string;
}) {
  return (
    <Link
      href={`/package/${pkg.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary"
    >
      <div className="relative aspect-square w-full bg-muted">
        {pkg.image ? (
          <Image
            src={pkg.image}
            alt={pkg.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="text-sm font-medium text-card-foreground">{pkg.name}</h3>
        <PackagePrice
          amount={pkg.total_price}
          currency={currency}
          className="text-sm font-medium text-primary"
        />
      </div>
    </Link>
  );
}
