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
