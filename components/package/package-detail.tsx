import Image from "next/image";
import type { Package, PackageMedia } from "@/lib/tebex/types";
import { AddToBasketButton } from "./add-to-basket-button";
import { PackageBadge } from "./package-badge";
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
        <AddToBasketButton
          packageId={pkg.id}
          variables={pkg.variables}
          disableQuantity={pkg.disable_quantity}
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

// Renders pkg.media as a hero image/video plus a thumbnail grid. Only ever
// used by PackageDetail above (there's no other place in the app that shows
// a package's media), so it stays a private helper rather than its own export.
function PackageGallery({
  media,
  alt,
}: {
  media: PackageMedia[];
  alt: string;
}) {
  const primaryIndex = media.findIndex((item) => item.primary);
  const heroIndex = primaryIndex === -1 ? 0 : primaryIndex;
  const hero = media[heroIndex];
  const rest = media.filter((_, index) => index !== heroIndex);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        <MediaItem
          item={hero}
          alt={alt}
          sizes="(min-width: 768px) 50vw, 100vw"
        />
      </div>
      {rest.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {rest.map((item) => (
            <div
              key={item.url}
              className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted"
            >
              <MediaItem item={item} alt={alt} sizes="33vw" />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MediaItem({
  item,
  alt,
  sizes,
}: {
  item: PackageMedia;
  alt: string;
  sizes: string;
}) {
  if (item.type === "video") {
    return (
      // biome-ignore lint/a11y/useMediaCaption: Tebex-supplied media has no caption track available.
      <video src={item.url} controls className="h-full w-full object-cover" />
    );
  }

  return (
    <Image
      src={item.url}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      className="object-cover"
    />
  );
}
