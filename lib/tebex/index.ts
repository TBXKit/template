import type { Category, Package, Webstore } from "./types";

const API_BASE = "https://headless.tebex.io/api";

function accountPath(path: string) {
  const token = process.env.TEBEX_PUBLIC_TOKEN;

  if (!token) {
    throw new Error("TEBEX_PUBLIC_TOKEN is not set");
  }

  return `${API_BASE}/accounts/${token}${path}`;
}

async function tebexFetch<T>(path: string): Promise<T | null> {
  const res = await fetch(accountPath(path), {
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Tebex API request failed (${res.status}): ${path}`);
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function getWebstore(): Promise<Webstore> {
  const webstore = await tebexFetch<Webstore>("");

  if (!webstore) {
    throw new Error("Webstore data is unavailable");
  }

  return webstore;
}

export async function getCategories(): Promise<Category[]> {
  const categories = await tebexFetch<Category[]>(
    "/categories?includePackages=1",
  );
  return categories ?? [];
}

export function getCategory(id: number): Promise<Category | null> {
  return tebexFetch<Category>(`/categories/${id}?includePackages=1`);
}

export function getPackage(id: number): Promise<Package | null> {
  return tebexFetch<Package>(`/packages/${id}`);
}
