"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/login-action";

/**
 * Username-only login form for username-auth stores
 * (`Webstore.supports_usernames`). No password field — this mirrors the
 * reference client's actual behavior, not an independent decision (Tebex
 * validates/creates the identity itself once a basket is created with it).
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <div>
        <label
          htmlFor="username"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
      {state && !state.success ? (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
