import { buildApiUrl } from "../config/apiBase";
import type { CashlessATMItem } from "../data/CashlessATMData";

/**
 * Row shape from GET /api/cashless-atm-entries (Laravel snake_case).
 * Blaze fields use `cash_less` in DB (not `cashless`) so Laravel validation
 * messages read "cash less"; we accept either spelling from JSON.
 */
export type CashlessAtmEntryApiRow = {
  id: number;
  date: string;
  employee: string;
  terminal: string;
  debit_terminal_total_dispensed: string | number | null;
  total_tips: string | number | null;
  debit_total_sales: string | number | null;
  total_cash_back: string | number | null;
  blaze_total_cash_less_sales?: string | number | null;
  blaze_total_cashless_sales?: string | number | null;
  total_cash_less_atm_change?: string | number | null;
  total_cashless_atm_change?: string | number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CashlessAtmPaginatedResponse = {
  current_page: number;
  data: CashlessAtmEntryApiRow[];
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type CashlessAtmIndexFilters = {
  date?: string;
  employee?: string;
  terminal?: string;
};

function parseApiAmount(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number.parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

function formatApiDate(iso: string): string {
  const raw = iso?.trim() ?? "";
  const ymd = raw.slice(0, 10);
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw || "—";
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

export function mapCashlessAtmApiRow(row: CashlessAtmEntryApiRow): CashlessATMItem {
  const raw = row.date?.trim() ?? "";
  const dateValue = raw.length >= 10 ? raw.slice(0, 10) : raw;
  const debitTotalSales = parseApiAmount(row.debit_total_sales);
  const totalCashBack = parseApiAmount(row.total_cash_back);
  const blazeCashlessSales = parseApiAmount(
    row.blaze_total_cash_less_sales ?? row.blaze_total_cashless_sales
  );
  const totalCashlessATMChange = parseApiAmount(
    row.total_cash_less_atm_change ?? row.total_cashless_atm_change
  );
  return {
    id: row.id,
    date: formatApiDate(raw),
    dateValue,
    employee: row.employee ?? "",
    terminal: row.terminal ?? "",
    debitTotalDispensed: parseApiAmount(row.debit_terminal_total_dispensed),
    totalTips: parseApiAmount(row.total_tips),
    debitTotalSales,
    totalCashBack,
    blazeCashlessSales,
    totalCashlessATMChange,
    totalSalesDifference: blazeCashlessSales - debitTotalSales,
    cashbackDifference: totalCashlessATMChange - totalCashBack,
    notes: row.notes ?? "",
  };
}

function applyIndexFilters(
  url: URL,
  filters?: CashlessAtmIndexFilters
): void {
  if (!filters) return;
  if (filters.date?.trim()) url.searchParams.set("date", filters.date.trim());
  if (filters.employee?.trim()) {
    url.searchParams.set("employee", filters.employee.trim());
  }
  if (filters.terminal?.trim()) {
    url.searchParams.set("terminal", filters.terminal.trim());
  }
}

export async function fetchCashlessAtmEntriesPage(
  page: number,
  filters?: CashlessAtmIndexFilters
): Promise<CashlessAtmPaginatedResponse | CashlessAtmEntryApiRow[]> {
  const url = new URL(
    buildApiUrl("/api/cashless-atm-entries"),
    window.location.origin
  );
  url.searchParams.set("page", String(page));
  applyIndexFilters(url, filters);
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Cashless ATM request failed (${res.status})`);
  }
  return res.json() as Promise<
    CashlessAtmPaginatedResponse | CashlessAtmEntryApiRow[]
  >;
}

/** Loads every page so client search/pagination work. */
export async function fetchAllCashlessAtmEntries(
  filters?: CashlessAtmIndexFilters
): Promise<CashlessATMItem[]> {
  const first = await fetchCashlessAtmEntriesPage(1, filters);
  if (Array.isArray(first)) {
    return first.map(mapCashlessAtmApiRow);
  }
  const lastPage = first.last_page ?? 1;
  let rows = [...first.data];
  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        fetchCashlessAtmEntriesPage(i + 2, filters)
      )
    );
    for (const chunk of rest) {
      if (Array.isArray(chunk)) {
        rows = rows.concat(chunk);
      } else {
        rows = rows.concat(chunk.data);
      }
    }
  }
  return rows.map(mapCashlessAtmApiRow);
}

/** Σ `debit_total_sales` grouped by calendar date (Y-m-d); multiple entries per day summed. */
export function aggregateDebitTotalSalesByDate(
  items: CashlessATMItem[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of items) {
    const raw = row.dateValue?.trim() ?? "";
    if (!raw) continue;
    const key = raw.length >= 10 ? raw.slice(0, 10) : raw;
    const next = (map.get(key) ?? 0) + row.debitTotalSales;
    map.set(key, next);
  }
  return map;
}

/** Body for POST / PUT/PATCH /api/cashless-atm-entries */
export type CashlessAtmWritePayload = {
  date: string;
  employee: string;
  terminal: string;
  debit_terminal_total_dispensed: number;
  total_tips: number;
  debit_total_sales: number;
  total_cash_back: number;
  /** Laravel column naming: cash_less, not cashless */
  blaze_total_cash_less_sales: number;
  total_cash_less_atm_change: number;
  notes: string | null;
};

export type CashlessAtmFormFields = {
  date: string;
  employee: string;
  terminal: string;
  debitTotalDispensed: string;
  totalTips: string;
  debitTotalSales: string;
  totalCashBack: string;
  blazeCashlessSales: string;
  totalCashlessATMChange: string;
  notes: string;
};

function parseRequiredNumber(raw: string, label: string): number {
  const t = raw.trim();
  if (t === "") throw new Error(`${label} is required.`);
  const n = Number.parseFloat(t);
  if (Number.isNaN(n)) throw new Error(`${label} must be a valid number.`);
  return n;
}

/** Validates string fields and builds API payload (throws with field message). */
export function buildCashlessAtmPayloadFromForm(
  form: CashlessAtmFormFields
): CashlessAtmWritePayload {
  if (!form.date.trim()) throw new Error("Date is required.");
  if (!form.employee.trim()) throw new Error("Employee is required.");
  if (!form.terminal.trim()) throw new Error("Terminal is required.");
  const notesTrim = form.notes.trim();
  return {
    date: form.date.trim(),
    employee: form.employee.trim(),
    terminal: form.terminal.trim(),
    debit_terminal_total_dispensed: parseRequiredNumber(
      form.debitTotalDispensed,
      "Debit terminal total dispensed"
    ),
    total_tips: parseRequiredNumber(form.totalTips, "Total tips"),
    debit_total_sales: parseRequiredNumber(form.debitTotalSales, "Debit total sales"),
    total_cash_back: parseRequiredNumber(form.totalCashBack, "Total cash back"),
    blaze_total_cash_less_sales: parseRequiredNumber(
      form.blazeCashlessSales,
      "Blaze total cashless sales"
    ),
    total_cash_less_atm_change: parseRequiredNumber(
      form.totalCashlessATMChange,
      "Total cashless ATM change"
    ),
    notes: notesTrim === "" ? null : notesTrim,
  };
}

async function parseJsonError(res: Response, fallback: string): Promise<string> {
  try {
    const errJson: Record<string, unknown> = await res.json();
    const errors = errJson.errors;
    if (errors && typeof errors === "object" && errors !== null) {
      const msgs = Object.values(errors)
        .flat()
        .filter((m): m is string => typeof m === "string");
      if (msgs.length > 0) return msgs.join(" ");
    }
    if (typeof errJson.message === "string") return errJson.message;
  } catch {
    /* keep fallback */
  }
  return fallback;
}

export async function createCashlessAtmEntry(
  payload: CashlessAtmWritePayload
): Promise<unknown> {
  const res = await fetch(buildApiUrl("/api/cashless-atm-entries"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await parseJsonError(res, `Save failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json();
}

export async function updateCashlessAtmEntry(
  id: number,
  payload: CashlessAtmWritePayload
): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/cashless-atm-entries/${id}`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await parseJsonError(res, `Update failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteCashlessAtmEntry(
  id: number,
  deleteReason?: string
): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/cashless-atm-entries/${id}`), {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      deleted_by: 1,
      ...(deleteReason?.trim() ? { delete_reason: deleteReason.trim() } : {}),
    }),
  });
  if (!res.ok) {
    let msg = `Delete failed (${res.status})`;
    if (res.status !== 401) {
      try {
        const errJson: Record<string, unknown> = await res.json();
        if (typeof errJson.message === "string") msg = errJson.message;
      } catch {
        /* keep default */
      }
    }
    throw new Error(msg);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}
