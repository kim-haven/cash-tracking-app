/** One reconciliation row from GET /api/cashless-atm-reconciliation (mapped). */
export type CashlessAtmReconciliationItem = {
  /** Y-m-d */
  date: string;
  sumDebitTotalSales: number;
  sumBlazeSales: number;
  /** API string with 2 decimals, or null when Blaze total is 0 */
  variancePercent: string | null;
  /** sum_debit − sum_blaze; positive = debit higher */
  difference: number;
};

function formatYmdDisplay(ymd: string): string {
  const s = ymd?.trim() ?? "";
  if (!s) return "";
  const core = s.length >= 10 ? s.slice(0, 10) : s;
  const d = new Date(`${core}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export function formatATMReconcileDate(ymd: string): string {
  return formatYmdDisplay(ymd);
}
