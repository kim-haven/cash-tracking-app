import { buildApiUrl } from "../config/apiBase";
import type { CashlessAtmReconciliationItem } from "../data/ATMReconcileData";

export type CashlessAtmReconciliationApiRow = {
  date: string;
  sum_of_debit_total_sales: string | number;
  sum_of_blaze_sales: string | number;
  variance_percent: string | null;
  difference: string | number;
};

export type CashlessAtmReconciliationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type CashlessAtmReconciliationResponse = {
  data: CashlessAtmReconciliationApiRow[];
  meta: CashlessAtmReconciliationMeta;
};

function dec(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number.parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

export function mapCashlessAtmReconciliationRow(
  row: CashlessAtmReconciliationApiRow
): CashlessAtmReconciliationItem {
  const vp = row.variance_percent;
  return {
    date: row.date?.trim() ?? "",
    sumDebitTotalSales: dec(row.sum_of_debit_total_sales),
    sumBlazeSales: dec(row.sum_of_blaze_sales),
    variancePercent: vp == null || String(vp).trim() === "" ? null : String(vp).trim(),
    difference: dec(row.difference),
  };
}

const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 100;

export async function fetchCashlessAtmReconciliation(
  page: number = 1,
  perPage: number = DEFAULT_PER_PAGE
): Promise<{
  rows: CashlessAtmReconciliationItem[];
  meta: CashlessAtmReconciliationMeta;
}> {
  const safePer = Math.min(
    Math.max(1, Math.floor(perPage)),
    MAX_PER_PAGE
  );
  const url = new URL(
    buildApiUrl("/api/cashless-atm-reconciliation"),
    window.location.origin
  );
  url.searchParams.set("page", String(Math.max(1, page)));
  url.searchParams.set("per_page", String(safePer));

  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Cashless ATM reconciliation failed (${res.status})`);
  }

  const json: CashlessAtmReconciliationResponse = await res.json();
  const data = Array.isArray(json.data) ? json.data : [];
  const meta = json.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: safePer,
    total: data.length,
  };

  return {
    rows: data.map(mapCashlessAtmReconciliationRow),
    meta: {
      current_page: meta.current_page ?? 1,
      last_page: Math.max(1, meta.last_page ?? 1),
      per_page: meta.per_page ?? safePer,
      total: meta.total ?? data.length,
    },
  };
}
