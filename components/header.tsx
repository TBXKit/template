import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/components/auth/logout-action";
import type { Category, Webstore } from "@/lib/tebex/types";

export function Header({
  webstore,
  categories,
  itemCount = 0,
  username = null,
}: {
  webstore: Webstore;
  categories: Category[];
  /** Computed in app/layout.tsx from the current basket; this component only renders it. */
  itemCount?: number;
  /** The signed-in player identity, if any — see app/layout.tsx. */
  username?: string | null;
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

        <div className="flex items-center gap-4">
          <nav aria-label="Primary" className="hidden gap-6 md:flex">
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

          <Link
            href="/cart"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Cart
            {itemCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                {itemCount}
              </span>
            ) : null}
          </Link>

          {username ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/account" className="hover:text-foreground">
                Signed in as {username}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="underline-offset-2 hover:text-foreground hover:underline"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Login
            </Link>
          )}

          <details className="md:hidden">
            <summary className="cursor-pointer list-none text-sm text-muted-foreground">
              Menu
            </summary>
            <nav
              aria-label="Primary"
              className="absolute inset-x-0 top-full flex flex-col gap-3 border-b border-border bg-card px-6 py-4"
            >
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
      </div>
    </header>
  );
}
