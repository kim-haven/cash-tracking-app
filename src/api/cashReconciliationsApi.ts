/** Matches `Route::apiResource('cash-reconciliations', …)` in `routes/api.php`. */
const DEFAULT_BASE = "/api/cash-reconciliations";

const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

const GET_HEADERS = { Accept: "application/json" } as const;

/**
 * Path-only values must start with `/` or `fetch()` resolves relative to the
 * current route (e.g. `/pos-reconcile` → wrong URL / 404).
 */
function ensureRootRelativePath(path: string): string {
  const p = path.trim().replace(/\/$/, "");
  if (!p) return DEFAULT_BASE;
  if (p.startsWith("/")) return p;
  return `/${p}`;
}

/**
 * In dev, `http://127.0.0.1:8000/api/...` triggers CORS from the Vite origin.
 * Use the pathname only so the browser hits `localhost:5173/api/...` and Vite
 * proxies to Laravel (see vite.config.ts). Remote URLs in prod stay absolute.
 */
function cashReconciliationsBaseUrl(): string {
  const raw = (
    import.meta.env.VITE_CASH_RECONCILIATIONS_API as string | undefined
  )?.trim();
  if (!raw) return DEFAULT_BASE;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      const isLocalBackend =
        u.hostname === "127.0.0.1" || u.hostname === "localhost";
      if (import.meta.env.DEV && isLocalBackend) {
        const path = u.pathname.replace(/\/$/, "") || "/";
        return ensureRootRelativePath(path);
      }
      return raw.replace(/\/$/, "");
    } catch {
      return DEFAULT_BASE;
    }
  }

  return ensureRootRelativePath(raw.replace(/\/$/, "") || DEFAULT_BASE);
}

function resourceUrl(id?: number | string): string {
  const base = cashReconciliationsBaseUrl();
  /** SPA route mistaken for API base in env — never call the page URL. */
  if (base === "/pos-reconcile" || base.startsWith("/pos-reconcile/")) {
    return id === undefined
      ? DEFAULT_BASE
      : `${DEFAULT_BASE}/${String(id).replace(/^\//, "")}`;
  }
  if (id === undefined) return base;
  if (/^https?:\/\//i.test(base)) {
    const u = new URL(base);
    u.pathname = `${u.pathname.replace(/\/$/, "")}/${id}`;
    return u.toString();
  }
  return `${ensureRootRelativePath(base)}/${id}`;
}

/**
 * Root-absolute URL for fetch(). Plain paths like `/api/...` must not be passed
 * to fetch() alone: without a leading `/`, the browser resolves them against
 * `/pos-reconcile` and hits the SPA (404). `new URL('/api/…', origin)` fixes that.
 */
function fetchHref(pathOrFullUrl: string): string {
  const s = pathOrFullUrl.trim();
  if (/^https?:\/\//i.test(s)) return s;
  const path = ensureRootRelativePath(s);
  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(path, window.location.origin).href;
  }
  return path;
}

export type CashReconciliationItem = {
  id: number;
  date: string;
  controller: string;
  cashIn: number;
  cashRefunds: number;
  cashlessAtmCashBack: number;
  reportedCashCollected: number;
  cashCollected: number;
  cashDifference: number;
  creditDifference: number;
  cashlessAtmDifference: number;
  cashVsCashlessAtmDifference: number;
  /** Maps from `reason_notes` */
  notes: string;
};

export type CashReconciliationPayload = Omit<CashReconciliationItem, "id">;

/**
 * Full payload from a row returned by the API. Use when PATCH must include all
 * validated fields (e.g. notes-only UI updates while Laravel requires date, etc.).
 */
export function cashReconciliationRowToPayload(
  row: CashReconciliationItem
): CashReconciliationPayload {
  return {
    date: row.date,
    controller: row.controller,
    cashIn: row.cashIn,
    cashRefunds: row.cashRefunds,
    cashlessAtmCashBack: row.cashlessAtmCashBack,
    reportedCashCollected: row.reportedCashCollected,
    cashCollected: row.cashCollected,
    cashDifference: row.cashDifference,
    creditDifference: row.creditDifference,
    cashlessAtmDifference: row.cashlessAtmDifference,
    cashVsCashlessAtmDifference: row.cashVsCashlessAtmDifference,
    notes: row.notes ?? "",
  };
}

function normalizeCashReconciliation(raw: Record<string, unknown>): CashReconciliationItem {
  const num = (k: string, alt?: string) =>
    Number(raw[k] ?? (alt ? raw[alt] : undefined) ?? 0);
  const str = (k: string, alt?: string) =>
    String(raw[k] ?? (alt ? raw[alt] : undefined) ?? "");
  return {
    id: Number(raw.id),
    date: str("date").slice(0, 10),
    controller: str("controller"),
    cashIn: num("cash_in", "cashIn"),
    cashRefunds: num("cash_refunds", "cashRefunds"),
    cashlessAtmCashBack: num(
      "cashless_atm_cash_back",
      "cashlessAtmCashBack"
    ),
    reportedCashCollected: num(
      "reported_cash_collected",
      "reportedCashCollected"
    ),
    cashCollected: num("cash_collected", "cashCollected"),
    cashDifference: num("cash_difference", "cashDifference"),
    creditDifference: num("credit_difference", "creditDifference"),
    cashlessAtmDifference: num(
      "cashless_atm_difference",
      "cashlessAtmDifference"
    ),
    cashVsCashlessAtmDifference: num(
      "cash_vs_cashless_atm_difference",
      "cashVsCashlessAtmDifference"
    ),
    notes: str("reason_notes", "reasonNotes"),
  };
}

function toApiPayload(
  payload: CashReconciliationPayload
): Record<string, unknown> {
  return {
    date: payload.date,
    controller: payload.controller,
    cash_in: payload.cashIn,
    cash_refunds: payload.cashRefunds,
    cashless_atm_cash_back: payload.cashlessAtmCashBack,
    reported_cash_collected: payload.reportedCashCollected,
    cash_collected: payload.cashCollected,
    cash_difference: payload.cashDifference,
    credit_difference: payload.creditDifference,
    cashless_atm_difference: payload.cashlessAtmDifference,
    cash_vs_cashless_atm_difference: payload.cashVsCashlessAtmDifference,
    reason_notes: payload.notes.trim() || null,
  };
}

async function readErrorMessage(
  res: Response,
  fallback: string
): Promise<string> {
  try {
    const err = (await res.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (err.errors) {
      const msgs = Object.values(err.errors).flat().filter(Boolean);
      if (msgs.length) return msgs.join(" ");
    }
    if (err.message) return err.message;
  } catch {
    /* ignore */
  }
  return fallback;
}

async function parseResourceJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) return {};
  const data = JSON.parse(text) as unknown;
  return (data && typeof data === "object"
    ? (data as { data?: unknown }).data ?? data
    : {}) as Record<string, unknown>;
}

/** GET /api/cash-reconciliations — index (array or `{ data: [] }`). */
export async function fetchAllCashReconciliations(): Promise<
  CashReconciliationItem[]
> {
  const res = await fetch(fetchHref(resourceUrl()), { headers: GET_HEADERS });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to fetch cash reconciliations")
    );
  }
  const data = await res.json();
  const rows = Array.isArray(data) ? data : data.data ?? [];
  return rows.map((r: Record<string, unknown>) =>
    normalizeCashReconciliation(r)
  );
}

/** GET /api/cash-reconciliations/{id} — show */
export async function fetchCashReconciliation(
  id: number
): Promise<CashReconciliationItem> {
  const res = await fetch(fetchHref(resourceUrl(id)), {
    headers: GET_HEADERS,
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to fetch cash reconciliation")
    );
  }
  const data = await res.json();
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return normalizeCashReconciliation(raw);
}

/** POST /api/cash-reconciliations — store */
export async function createCashReconciliation(
  payload: CashReconciliationPayload
): Promise<CashReconciliationItem> {
  const res = await fetch(fetchHref(resourceUrl()), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(toApiPayload(payload)),
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to create cash reconciliation")
    );
  }
  const data = await res.json();
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return normalizeCashReconciliation(raw);
}

/**
 * PATCH /api/cash-reconciliations/{id} — update (partial body; Laravel apiResource).
 * Falls back to refetch on 204 No Content.
 */
export async function updateCashReconciliation(
  id: number,
  payload: Partial<CashReconciliationPayload>
): Promise<CashReconciliationItem> {
  if (!Number.isFinite(Number(id))) {
    throw new Error("Invalid cash reconciliation id");
  }
  const body: Record<string, unknown> = {};
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.controller !== undefined) body.controller = payload.controller;
  if (payload.cashIn !== undefined) body.cash_in = payload.cashIn;
  if (payload.cashRefunds !== undefined) body.cash_refunds = payload.cashRefunds;
  if (payload.cashlessAtmCashBack !== undefined)
    body.cashless_atm_cash_back = payload.cashlessAtmCashBack;
  if (payload.reportedCashCollected !== undefined)
    body.reported_cash_collected = payload.reportedCashCollected;
  if (payload.cashCollected !== undefined) body.cash_collected = payload.cashCollected;
  if (payload.cashDifference !== undefined)
    body.cash_difference = payload.cashDifference;
  if (payload.creditDifference !== undefined)
    body.credit_difference = payload.creditDifference;
  if (payload.cashlessAtmDifference !== undefined)
    body.cashless_atm_difference = payload.cashlessAtmDifference;
  if (payload.cashVsCashlessAtmDifference !== undefined)
    body.cash_vs_cashless_atm_difference = payload.cashVsCashlessAtmDifference;
  if (payload.notes !== undefined)
    body.reason_notes = payload.notes.trim() || null;

  const res = await fetch(fetchHref(resourceUrl(id)), {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to update cash reconciliation")
    );
  }
  if (res.status === 204) {
    return fetchCashReconciliation(id);
  }
  const raw = await parseResourceJson(res);
  if (Object.keys(raw).length === 0) {
    return fetchCashReconciliation(id);
  }
  return normalizeCashReconciliation(raw);
}

/** DELETE /api/cash-reconciliations/{id} — destroy */
export async function deleteCashReconciliation(id: number): Promise<void> {
  if (!Number.isFinite(Number(id))) {
    throw new Error("Invalid cash reconciliation id");
  }
  const res = await fetch(fetchHref(resourceUrl(id)), {
    method: "DELETE",
    headers: GET_HEADERS,
  });
  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Failed to delete cash reconciliation")
    );
  }
}
