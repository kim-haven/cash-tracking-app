const BASE_URL = import.meta.env.VITE_TIPS_API as string;

export type TipItem = {
  id: number;
  initials: string;
  cash_tip_amount: number;
  end_of_pay_period_total: number;
  cash_balance: number;
  date: string;
  cash_tip: number;
  credit_tips: number;
  ach_tips: number;
  debit_tips: number;
  total: number;
  note: string;
};

type TipPayload = Omit<TipItem, "id">;

function normalizeTip(raw: Record<string, unknown>): TipItem {
  const num = (k: string, alt?: string) =>
    Number(raw[k] ?? (alt ? raw[alt] : undefined) ?? 0);
  const str = (k: string, alt?: string) =>
    String(raw[k] ?? (alt ? raw[alt] : undefined) ?? "");
  return {
    id: Number(raw.id),
    initials: str("initials"),
    cash_tip_amount: num("cash_tip_amount", "cashTipAmount"),
    end_of_pay_period_total: num(
      "end_of_pay_period_total",
      "endOfPayPeriodTotal"
    ),
    cash_balance: num("cash_balance", "cashBalance"),
    date: str("date"),
    cash_tip: num("cash_tip", "cashTip"),
    credit_tips: num("credit_tips", "creditTips"),
    ach_tips: num("ach_tips", "achTips"),
    debit_tips: num("debit_tips", "debitTips"),
    total: num("total"),
    note: str("note"),
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const err = (await res.json()) as { message?: string };
    if (err.message) return err.message;
  } catch {
    /* ignore */
  }
  return fallback;
}

/** GET /api/tips — list (handles plain array or { data: [] }). */
export async function fetchAllTips(): Promise<TipItem[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to fetch tips"));
  }
  const data = await res.json();
  const rows = Array.isArray(data) ? data : data.data ?? [];
  return rows.map((r: Record<string, unknown>) => normalizeTip(r));
}

/** GET /api/tips/{id} */
export async function fetchTip(id: number): Promise<TipItem> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to fetch tip"));
  }
  const data = await res.json();
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return normalizeTip(raw);
}

/** POST /api/tips */
export async function createTip(payload: TipPayload): Promise<TipItem> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to create tip"));
  }
  const data = await res.json();
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return normalizeTip(raw);
}

/** PUT /api/tips/{id} */
export async function updateTip(
  id: number,
  payload: Partial<TipPayload>
): Promise<TipItem> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to update tip"));
  }
  const data = await res.json();
  const raw = (data?.data ?? data) as Record<string, unknown>;
  return normalizeTip(raw);
}

/** DELETE /api/tips/{id} */
export async function deleteTip(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to delete tip"));
  }
}

/** GET /api/tips/template — triggers browser download (CSV/XLSX per server). */
export async function downloadTipsTemplate(): Promise<void> {
  const res = await fetch(`${BASE_URL}/template`);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to download template"));
  }
  const blob = await res.blob();
  const dispo = res.headers.get("Content-Disposition");
  const match = dispo?.match(/filename\*?=(?:UTF-8'')?["']?([^";\n]+)/i);
  const filename =
    match?.[1]?.trim() ||
    dispo?.match(/filename="([^"]+)"/)?.[1] ||
    "tips-import-template";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
