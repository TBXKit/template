import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SITE_URL } from "@/lib/site";
import { getBasketAuthProviders, getWebstore } from "@/lib/tebex";
import { getCurrentBasket } from "@/lib/tebex/session";
import { isSafeRedirectPath } from "./safe-redirect";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawNext = params.next;
  const next =
    typeof rawNext === "string" && isSafeRedirectPath(rawNext) ? rawNext : "/";

  const webstore = await getWebstore();

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Sign In</h1>

      {webstore.supports_usernames ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your {webstore.platform_type} username to continue.
          </p>
          <LoginForm next={next} />
        </>
      ) : (
        <ExternalProviderLinks next={next} />
      )}
    </div>
  );
}

// Not exported: only ever rendered as part of LoginPage above.
async function ExternalProviderLinks({ next }: { next: string }) {
  const basket = await getCurrentBasket();

  if (!basket) {
    // The external-provider flow authorizes an *existing* basket in place
    // (unlike the username flow, which needs one created with the username
    // already attached) — nothing to authorize yet if the visitor hasn't
    // added anything. Reachable if a visitor opens /login directly (e.g.
    // from the header) rather than being redirected here mid-add.
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        Add something to your basket first, then sign in from checkout.
      </p>
    );
  }

  const returnUrl = `${SITE_URL}${next}`;
  const providers = await getBasketAuthProviders(basket.ident, returnUrl);

  if (providers.length === 0) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        This store doesn't have a sign-in method configured yet.
      </p>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {providers.map((provider) => (
        <li key={provider.name}>
          <a
            href={provider.url}
            className="block rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:border-primary"
          >
            Continue with {provider.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
