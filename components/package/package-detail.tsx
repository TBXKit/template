import Image from "next/image";
import type { Package } from "@/lib/tebex/types";
import { PackagePrice } from "./package-price";

export function PackageDetail({
  pkg,
  currency,
}: {
  pkg: Package;
  currency: string;
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {pkg.image ? (
          <Image
            src={pkg.image}
            alt={pkg.name}
            fill
            unoptimized
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-foreground">{pkg.name}</h1>
        <PackagePrice
          amount={pkg.total_price}
          currency={currency}
          className="mt-2 block text-xl font-medium text-primary"
        />
        {pkg.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {pkg.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
