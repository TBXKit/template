import Link from "next/link";
import type { Category } from "@/lib/tebex/types";

export function Header({
  siteName,
  categories,
}: {
  siteName: string;
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
    <header className="relative border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold text-zinc-950 dark:text-zinc-50"
        >
          {siteName}
        </Link>

        <nav className="hidden gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <details className="md:hidden">
          <summary className="cursor-pointer list-none text-sm text-zinc-600 dark:text-zinc-400">
            Menu
          </summary>
          <nav className="absolute inset-x-0 top-full flex flex-col gap-3 border-b border-black/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-950">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-600 dark:text-zinc-400"
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
