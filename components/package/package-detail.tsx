import Image from "next/image";
import type { Package } from "@/lib/tebex/types";
import { PackageBadge } from "./package-badge";
import { PackageGallery } from "./package-gallery";
import { PackagePrice } from "./package-price";

function formatExpiration(expirationDate: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(
    new Date(expirationDate),
  );
}

export function PackageDetail({
  pkg,
  currency,
}: {
  pkg: Package;
  currency: string;
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {pkg.media.length > 0 ? (
        <PackageGallery media={pkg.media} alt={pkg.name} />
      ) : (
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
      )}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">{pkg.name}</h1>
        <PackageBadge type={pkg.type} className="mt-3" />
        {pkg.expiration_date ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Available until {formatExpiration(pkg.expiration_date)}
          </p>
        ) : null}
        <PackagePrice
          basePrice={pkg.base_price}
          totalPrice={pkg.total_price}
          discount={pkg.discount}
          currency={currency}
          className="mt-2 block text-xl font-medium text-primary"
        />
        {pkg.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {pkg.description}
          </p>
        ) : (
          <p className="mt-6 text-sm italic text-muted-foreground">
            No description available.
          </p>
        )}
      </div>
    </div>
  );
}
