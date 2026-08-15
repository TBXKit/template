"use client";

import { useEffect } from "react";
import { logClientErrorAction } from "./log-client-error-action";

// Catches errors thrown while rendering any route below the root layout.
// Errors thrown by the root layout itself skip this and hit
// global-error.tsx instead, since this boundary lives inside that layout.
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorAction({
      message: error.message,
      digest: error.digest,
      boundary: "route",
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn't load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="focus-ring mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        Try again
      </button>
    </div>
  );
}
