"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
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
        className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        Try again
      </button>
    </div>
  );
}
