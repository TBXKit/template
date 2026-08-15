import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SITE_URL } from "@/lib/site";
import { getBasketAuthProviders, getWebstore } from "@/lib/tebex";
import { getCurrentBasket } from "@/lib/tebex/session";
import { startSignInAction } from "./ensure-basket-action";
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
    // from the header), or is redirected here as their very first action
    // (e.g. attempting to gift a package before adding anything else),
    // where signing in is exactly the action that triggered the redirect.
    // `startSignInAction` creates an anonymous basket server-side so this
    // page can re-render with real provider links below.
    return (
      <form action={startSignInAction.bind(null, next)} className="mt-4">
        <p className="text-sm text-muted-foreground">
          Sign-in is tied to your basket on this store — continue to start one.
        </p>
        <button
          type="submit"
          className="focus-ring mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
        >
          Continue to sign in
        </button>
      </form>
    );
  }

  // Unlike the username-login path (login-action.ts), a pending add-to-basket
  // call (see add-to-basket-action.ts) isn't replayed automatically after an
  // external-provider redirect: doing so would need to read and clear a
  // cookie on the way back in, which Next.js only allows from a Server
  // Action or Route Handler — and this app deliberately has neither (see
  // AGENTS.md's Non-Negotiable Constraints). A visitor signing in this way just
  // retries the add manually once they're back.
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
            className="focus-ring block rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground transition-colors hover:border-primary"
          >
            Continue with {provider.name}
          </a>
        </li>
      ))}
    </ul>
  );
}
