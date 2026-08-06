import createClient from "openapi-fetch";
import type { paths } from "./generated/schema";

const API_BASE = "https://headless.tebex.io/api";

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

type TebexResult<T> = { data?: T; response: Response };

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

  const data = response.ok ? ((await response.json()) as T) : undefined;
  return { data, response };
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
  const { data, response } = await result;

  if (notFoundStatuses.includes(response.status)) {
    return null;
  }

  if (!response.ok || data === undefined) {
    throw new Error(
      `Tebex API request failed (${response.status}): ${response.url}`,
    );
  }

  return data;
}
