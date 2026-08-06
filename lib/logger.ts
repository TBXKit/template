import pino from "pino";

/**
 * Single structured logger for the whole app. Server-only — this project
 * has no client-side logging destination; a browser-side error boundary
 * forwards to this logger via a Server Action instead of writing to the
 * browser console directly (see `app/log-client-error-action.ts`).
 *
 * No `transport`/`pino-pretty` here deliberately: pino's transport option
 * spawns a worker thread that resolves a separate file at runtime, which
 * doesn't survive Next.js's bundling. Plain synchronous JSON-to-stdout has
 * no such caveat and needs nothing from the Next.js build.
 *
 * Level defaults to "debug" outside production and "info" in production,
 * overridable via `LOG_LEVEL` for local troubleshooting without a redeploy.
 */
export const logger = pino({
  level:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
  // Defense-in-depth: every call site below chooses its own fields, but
  // redact any of these common names if one ever gets passed in by mistake,
  // rather than relying solely on call-site discipline.
  redact: {
    paths: ["*.password", "*.token", "*.cookie", "*.authorization"],
    remove: true,
  },
  // Lets every call site log a caught error as `{ err }` and get a proper
  // {type, message, stack} shape instead of an empty object — Error's own
  // fields aren't enumerable, so JSON.stringify(error) silently drops them
  // without this.
  serializers: { err: pino.stdSerializers.err },
});

/**
 * A Tebex basket `ident` is a bearer credential, not just an identifier —
 * Tebex's API accepts it as sufficient authorization to read or mutate that
 * basket, the same trust level as a session cookie. Logging it in full
 * would let anyone with log access do the same, so every log site
 * mentioning a basket logs this instead: enough to correlate related log
 * lines for one basket without reconstructing the credential itself.
 */
export function redactBasketIdent(ident: string): string {
  return ident.length <= 6 ? "…" : `…${ident.slice(-6)}`;
}
