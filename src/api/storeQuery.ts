/**
 * Build a URL for `authorizedFetch` and attach `?store_id=` when a physical store is selected.
 * Omit the param for "All Stores" (backend returns data for every store).
 */
export function toRequestUrl(pathOrUrl: string): URL {
  const s = pathOrUrl.trim();
  if (/^https?:\/\//i.test(s)) {
    return new URL(s);
  }
  const path = s.startsWith("/") ? s : `/${s}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(path, window.location.origin);
  }
  return new URL(path, "http://localhost");
}

export function applyStoreIdParam(
  url: URL,
  storeId: number | null | undefined
): void {
  if (storeId != null && Number.isFinite(storeId)) {
    url.searchParams.set("store_id", String(storeId));
  }
}
