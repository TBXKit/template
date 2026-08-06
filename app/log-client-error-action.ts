"use server";

import { logger } from "@/lib/logger";

/**
 * The only bridge from a browser-side error boundary (`error.tsx`,
 * `global-error.tsx` — both Client Components, since Next.js requires that)
 * to the structured server-side logger. This project has no API routes to
 * post to, so a Server Action is the lightest way to get a rendering error
 * into the same log stream as everything else, replacing a bare
 * `console.error(error)` in the browser console that no one but the
 * visitor would ever see.
 *
 * Only `message`/`digest`/`name` are forwarded, not `error.stack` — Next.js
 * already strips stack traces from what a Client Component receives in
 * production, and `digest` is the mechanism Next.js provides specifically
 * to correlate a visitor-facing error back to the full server-side error it
 * came from, without shipping stack contents through the browser at all.
 */
export async function logClientErrorAction(input: {
  message: string;
  digest?: string;
  boundary: "route" | "root";
}): Promise<void> {
  logger.error(
    { digest: input.digest, boundary: input.boundary },
    input.message,
  );
}
