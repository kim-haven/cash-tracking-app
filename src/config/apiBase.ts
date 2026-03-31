/** Base URL for the cash-tracking API (no trailing slash). */
export function getApiBaseUrl(): string {
  // In dev, prefer same-origin requests + Vite proxy to avoid CORS issues.
  if (import.meta.env.DEV) return "";

  const raw = import.meta.env.CASH_TRACKING_APP_API?.trim() ?? "";
  return raw.replace(/\/+$/, "");
}

export function buildApiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${p}` : p;
}
