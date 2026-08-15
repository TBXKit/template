import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/components/auth/logout-action";
import { PlayerAvatar } from "@/components/player-avatar";
import { SearchForm } from "@/components/search-form";
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
          className="focus-ring flex items-center gap-2 rounded-sm text-lg font-semibold text-foreground"
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
                className="focus-ring rounded-sm text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <SearchForm className="hidden w-40 md:block" />

          <Link
            href="/cart"
            className="focus-ring flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
          >
            Cart
            {itemCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">
                {itemCount}
              </span>
            ) : null}
          </Link>

          {/*
            Hidden on mobile, not just squeezed — with the store name, cart,
            and menu toggle already competing for a 375px-wide bar, adding
            "Signed in as {username}" here caused the store name to wrap
            mid-word (confirmed in a real mobile-viewport pass). Repeated
            inside the mobile menu below instead, the same way `links` is
            already duplicated between the desktop nav and mobile nav rather
            than extracted — matching this file's existing pattern.
          */}
          <div className="hidden items-center gap-4 md:flex">
            {username ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link
                  href="/account"
                  className="focus-ring flex items-center gap-1.5 rounded-sm hover:text-foreground"
                >
                  <PlayerAvatar
                    username={username}
                    platformType={webstore.platform_type}
                  />
                  Signed in as {username}
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="focus-ring rounded-sm underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="focus-ring rounded-sm text-sm text-muted-foreground hover:text-foreground"
              >
                Login
              </Link>
            )}
          </div>

          <details className="md:hidden">
            <summary className="focus-ring cursor-pointer list-none rounded-sm text-sm text-muted-foreground">
              Menu
            </summary>
            <nav
              aria-label="Primary"
              className="absolute inset-x-0 top-full flex flex-col gap-3 border-b border-border bg-card px-6 py-4"
            >
              <SearchForm />
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="focus-ring rounded-sm text-sm text-muted-foreground hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3">
                {username ? (
                  <>
                    <Link
                      href="/account"
                      className="focus-ring flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground"
                    >
                      <PlayerAvatar
                        username={username}
                        platformType={webstore.platform_type}
                      />
                      Signed in as {username}
                    </Link>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="focus-ring rounded-sm text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      >
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="focus-ring rounded-sm text-sm text-muted-foreground hover:text-foreground"
                  >
                    Login
                  </Link>
                )}
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
