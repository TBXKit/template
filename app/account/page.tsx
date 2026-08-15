import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@/components/auth/logout-action";
import { getWebstore } from "@/lib/tebex";
import { getEffectiveUsername } from "@/lib/tebex/session";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false },
};

export default async function AccountPage() {
  const [webstore, username] = await Promise.all([
    getWebstore(),
    getEffectiveUsername(),
  ]);

  if (!username) {
    redirect("/login?next=/account");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold text-foreground">My Account</h1>

      <dl className="mt-6 divide-y divide-border rounded-lg border border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-muted-foreground">Username</dt>
          <dd className="text-sm font-medium text-foreground">{username}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-muted-foreground">Platform</dt>
          <dd className="text-sm font-medium text-foreground">
            {webstore.platform_type}
          </dd>
        </div>
      </dl>

      {/*
        Purchase history isn't shown: it isn't exposed by the public-token
        Headless API this storefront uses — it lives behind the separate
        Plugin API's X-Tebex-Secret private key instead, which this project
        doesn't hold yet. Stated plainly rather than silently omitted.
      */}
      <p className="mt-4 text-sm text-muted-foreground">
        Purchase history isn't available through this store's front end.
      </p>

      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="focus-ring rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
