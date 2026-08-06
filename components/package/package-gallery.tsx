import Image from "next/image";
import type { PackageMedia } from "@/lib/tebex/types";

export function PackageGallery({
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
