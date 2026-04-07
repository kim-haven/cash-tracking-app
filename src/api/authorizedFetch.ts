/** Must match `AuthContext` / login storage. */
export const AUTH_TOKEN_KEY = "cash_track_auth_token";

/**
 * `fetch` with `Authorization: Bearer <token>` when logged in (Laravel Sanctum).
 * Merges with existing `init.headers`.
 */
export function authorizedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
