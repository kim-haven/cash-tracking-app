/** Cashless ATM Reconcile row — matches reconciliation / pivot export fields. */
export type ATMReconcileItem = {
  id: number;
  /** Date (Col A) — reference date for terminal / debit reconciliation. */
  dateColA: string;
  /** SUM of Debit: Total Sales */
  sumDebitTotalSales: number;
  /** SUM of Blaze: Sales */
  sumBlazeSales: number;
  /** Variance (%) between terminal and POS reports. */
  variancePercent: number;
  /**
   * Difference ($). Negative = Blaze reported more than terminals;
   * positive = terminals higher than Blaze.
   */
  differenceDollars: number;
  /** Date (Col H) — reference for Blaze Accounting Summary pivot. */
  dateColH: string;
  /** SUM of ATM Tendered — gross charged to cards (sales + tips + cashback). */
  sumAtmTendered: number;
  /** SUM of ATM Change Due — physical cash back as change. */
  sumAtmChangeDue: number;
  /** SUM of ATM Cashback — optional breakdown (often 0 or same as change due). */
  sumAtmCashback: number | null;
};

function formatYmdDisplay(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export function formatATMReconcileDate(ymd: string): string {
  return formatYmdDisplay(ymd);
}

export const ATMReconcileData: ATMReconcileItem[] = [
  {
    id: 1,
    dateColA: "2026-03-28",
    sumDebitTotalSales: 15_432.5,
    sumBlazeSales: 15_380.0,
    variancePercent: -0.34,
    differenceDollars: 52.5,
    dateColH: "2026-03-28",
    sumAtmTendered: 16_200.0,
    sumAtmChangeDue: 420.75,
    sumAtmCashback: 0,
  },
  {
    id: 2,
    dateColA: "2026-03-29",
    sumDebitTotalSales: 18_900.0,
    sumBlazeSales: 19_050.0,
    variancePercent: 0.79,
    differenceDollars: -150.0,
    dateColH: "2026-03-29",
    sumAtmTendered: 19_800.0,
    sumAtmChangeDue: 512.0,
    sumAtmCashback: null,
  },
];
