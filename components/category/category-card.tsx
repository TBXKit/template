import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/tebex/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary"
    >
      <div className="relative aspect-video w-full bg-muted">
        {category.image_url ? (
          <Image
            src={category.image_url}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-medium text-card-foreground">
          {category.name}
        </h3>
        {category.description ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {category.description}
          </p>
        ) : null}
        <span className="mt-4 text-sm text-muted-foreground">
          {category.packages.length}{" "}
          {category.packages.length === 1 ? "package" : "packages"}
        </span>
      </div>
    </Link>
  );
}
