/** Display as M/D/YYYY (e.g. 3/31/2026). Parses YYYY-MM-DD without timezone shift. */
export function formatUsShortDate(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const day = Number(iso[3]);
    return `${m}/${day}/${y}`;
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  }
  return trimmed;
}

/** Normalize API date for <input type="date" /> (YYYY-MM-DD). */
export function toDateInputValue(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  return trimmed;
}
