"use client";

import { useEffect } from "react";
import "./globals.css";

// Only fires for errors thrown by the root layout (app/layout.tsx) itself —
// error.tsx can't catch those, since it renders *inside* that layout. This
// file must render its own <html>/<body> (and re-import global CSS) because
// it fully replaces the root layout when active.
export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          Store unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't load the store. Please try again shortly.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
