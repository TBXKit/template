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
      className="group flex flex-col overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
    >
      <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900">
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
        <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {pkg.name}
        </h3>
        <PackagePrice
          amount={pkg.total_price}
          currency={currency}
          className="text-sm text-zinc-600 dark:text-zinc-400"
        />
      </div>
    </Link>
  );
}
