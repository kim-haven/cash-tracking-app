/** Base URL for the cash-tracking API (no trailing slash). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.CASH_TRACKING_APP_API?.trim() ?? "";
  return raw.replace(/\/+$/, "");
}
