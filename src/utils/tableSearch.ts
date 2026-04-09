/**
 * Client-side table filter: matches when `term` is empty/whitespace, or when any
 * `field` contains the term (case-insensitive). Safe for null/undefined API values.
 */
export function matchesTableSearch(term: string, ...fields: unknown[]): boolean {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  for (const f of fields) {
    if (String(f ?? "").toLowerCase().includes(t)) return true;
  }
  return false;
}
