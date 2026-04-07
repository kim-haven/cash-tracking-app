import type { CashTrackItem } from "../api/cashTrackApi";

/** Match cash-track / expense rows on calendar date (YYYY-MM-DD prefix). */
export function ymdKeyFromDateString(dateStr: string): string | null {
  const iso = String(dateStr ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

/** Sum cash_in + cash_out for one expense API row (camelCase or snake_case). */
export function expenseCashInPlusOut(e: Record<string, unknown>): number {
  const cin = Number(e.cash_in ?? e.cashIn ?? 0);
  const cout = Number(e.cash_out ?? e.cashOut ?? 0);
  return cin + cout;
}

export function expenseRowDateKey(e: Record<string, unknown>): string | null {
  return ymdKeyFromDateString(String(e.date ?? ""));
}

/** Calendar day as YYYYMMDD for comparisons (local), from API date string. */
export function calendarKeyFromRowDate(dateStr: string): number | null {
  const trimmed = String(dateStr ?? "").trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return (
      Number(iso[1]) * 10_000 + Number(iso[2]) * 100 + Number(iso[3])
    );
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return (
    d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate()
  );
}

export function compareRowDates(a: CashTrackItem, b: CashTrackItem): number {
  const ka = calendarKeyFromRowDate(a.date);
  const kb = calendarKeyFromRowDate(b.date);
  if (ka === null && kb === null) return 0;
  if (ka === null) return 1;
  if (kb === null) return -1;
  return ka - kb;
}

function calendarKeyFromDate(d: Date): number {
  return (
    d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Dashboard / analytics date range for cash-on-hand summaries. */
export type SummaryScope = "daily" | "weekly" | "monthly" | "all";

export function rowDateInSummaryScope(
  dateStr: string,
  scope: SummaryScope
): boolean {
  if (scope === "all") return true;
  const k = calendarKeyFromRowDate(dateStr);
  if (k === null) return false;
  const now = new Date();
  const todayKey = calendarKeyFromDate(now);

  switch (scope) {
    case "daily":
      return k === todayKey;
    case "weekly": {
      const end = startOfDay(now);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const minK = calendarKeyFromDate(start);
      const maxK = calendarKeyFromDate(end);
      return k >= minK && k <= maxK;
    }
    case "monthly": {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const minK = calendarKeyFromDate(firstThisMonth);
      return k >= minK && k <= todayKey;
    }
    default:
      return true;
  }
}

export function filterCashTrackBySummaryScope(
  list: CashTrackItem[],
  scope: SummaryScope
): CashTrackItem[] {
  if (scope === "all") return [...list];
  return list.filter((row) => rowDateInSummaryScope(row.date, scope));
}

export function filterExpenseRowsBySummaryScope(
  rows: Record<string, unknown>[],
  scope: SummaryScope
): Record<string, unknown>[] {
  if (scope === "all") return [...rows];
  return rows.filter((row) =>
    rowDateInSummaryScope(String(row.date ?? ""), scope)
  );
}

/** Per calendar day: sum of expense cash_in + cash_out (from Expenses API). */
export function buildExpensesInOutSumByDate(
  expenseApiRows: Record<string, unknown>[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const raw of expenseApiRows) {
    const key = expenseRowDateKey(raw);
    if (!key) continue;
    m.set(key, (m.get(key) ?? 0) + expenseCashInPlusOut(raw));
  }
  return m;
}
