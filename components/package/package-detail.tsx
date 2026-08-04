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
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
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
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          {pkg.name}
        </h1>
        <PackagePrice
          amount={pkg.total_price}
          currency={currency}
          className="mt-2 block text-xl text-zinc-600 dark:text-zinc-400"
        />
        {pkg.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {pkg.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
