import Image from "next/image";
import Link from "next/link";
import type { Category, Webstore } from "@/lib/tebex/types";

export function Header({
  webstore,
  categories,
}: {
  webstore: Webstore;
  categories: Category[];
}) {
  const links = [
    { href: "/", label: "Home" },
    ...categories.map((category) => ({
      href: `/category/${category.id}`,
      label: category.name,
    })),
  ];

  return (
    <header className="relative border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          {webstore.logo ? (
            <Image
              src={webstore.logo}
              alt=""
              width={28}
              height={28}
              unoptimized
              className="rounded-sm"
            />
          ) : null}
          {webstore.name}
        </Link>

        <nav className="hidden gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <details className="md:hidden">
          <summary className="cursor-pointer list-none text-sm text-muted-foreground">
            Menu
          </summary>
          <nav className="absolute inset-x-0 top-full flex flex-col gap-3 border-b border-border bg-card px-6 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
