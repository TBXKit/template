import createClient from "openapi-fetch";
import { logger } from "@/lib/logger";
import type { paths } from "./generated/schema";

// The live Tebex Headless API. Overridable via TEBEX_API_BASE only so the
// end-to-end tests can point every Tebex call at a local fixture server
// (see test/e2e/) — production deployments leave it unset and hit Tebex.
const API_BASE =
  process.env.TEBEX_API_BASE?.replace(/\/$/, "") ??
  "https://headless.tebex.io/api";

// The public storefront token is safe to expose (see TEBEX_PUBLIC_TOKEN's
// own docs), but it still identifies this store's account, so debug logs
// below redact it from the URL rather than assuming "public" means "fine to
// repeat in every log line."
function redactAccountToken(url: string): string {
  return url.replace(/\/accounts\/[^/]+/, "/accounts/[redacted]");
}

function accountBaseUrl(): string {
  const token = process.env.TEBEX_PUBLIC_TOKEN;

  if (!token) {
    throw new Error("TEBEX_PUBLIC_TOKEN is not set");
  }

  return `${API_BASE}/accounts/${token}`;
}

/**
 * Builds a fresh openapi-fetch client scoped to the store's public token.
 * Cheap to create per call — there's no connection state worth reusing,
 * and it keeps the "token missing" check at call-time rather than import-time.
 */
export function tebexClient() {
  return createClient<paths>({
    baseUrl: accountBaseUrl(),
    headers: { "Content-Type": "application/json" },
  });
}

type TebexResult<T> = { data?: T; error?: unknown; response: Response };

// Tebex's own error responses follow this shape (an RFC 7807-style problem
// object) across the endpoints this app has hit one on — confirmed against a
// live store's `applyCoupon`/`applyGiftCard`/`applyCreatorCode`/`addPackageToBasket`
// 422s. `detail` is written to be a human-readable, user-safe explanation
// (e.g. "The selected coupon code is invalid."), so it's safe to surface
// directly rather than replacing it with a hand-written generic message.
function extractErrorDetail(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const detail = (error as Record<string, unknown>).detail;
  return typeof detail === "string" && detail.length > 0 ? detail : undefined;
}

/**
 * Basket-package mutations (add/remove/update-quantity) are NOT scoped under
 * `/accounts/{token}/...` like every other endpoint this app calls —
 * confirmed against a live store. This contradicts both the generated schema
 * (which declares the path as `/{basketIdent}/packages`, missing a `baskets/`
 * segment, implicitly relative to the account-scoped base like everything
 * else in `paths`) and Tebex's own published docs (which claim account
 * scoping applies here too). The real, working endpoint is
 * `{API_BASE}/baskets/{basketIdent}/packages`, relative to the bare API root
 * with no account token in the path at all. Since no key in the generated
 * `paths` type matches this, these calls can't go through `tebexClient()`'s
 * typed `GET`/`POST` — this is a plain `fetch` instead, but still funneled
 * through `resolveTebexResponse` for the same not-found/error handling every
 * other call gets.
 */
export async function basketPackageRequest<T>(
  path: string,
  init: RequestInit,
): Promise<TebexResult<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (response.ok) {
    return { data: (await response.json()) as T, response };
  }
  const error = await response.json().catch(() => undefined);
  return { error, response };
}

/**
 * Resolves an openapi-fetch call the way the Tebex Headless API actually
 * behaves: expected "not found" responses (the status varies per endpoint —
 * Tebex doesn't consistently use 404) resolve to `null` instead of throwing,
 * so route handlers can call Next's `notFound()`. Any other non-OK response
 * throws, rather than being silently swallowed.
 */
export async function resolveTebexResponse<T>(
  result: Promise<TebexResult<T>>,
  notFoundStatuses: number[] = [404],
): Promise<T | null> {
  const { data, error, response } = await result;

  // Every Tebex call funnels through here regardless of call site
  // (tebexClient or basketPackageRequest), so this is the one place that
  // can log request/response pairs for all of them without duplicating the
  // same log call at every index.ts function. Deliberately excludes
  // response bodies (may carry a visitor's username/basket contents) — the
  // status/URL pair is enough to correlate against a specific failure
  // without risking a sensitive payload in the logs.
  logger.debug(
    { url: redactAccountToken(response.url), status: response.status },
    "Tebex API request",
  );

  if (notFoundStatuses.includes(response.status)) {
    return null;
  }

  if (!response.ok || data === undefined) {
    throw new Error(
      extractErrorDetail(error) ??
        `Tebex API request failed (${response.status}): ${response.url}`,
    );
  }

  return data;
}
