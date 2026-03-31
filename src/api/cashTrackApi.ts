const API_BASE = import.meta.env.VITE_CASH_ON_HANDS_API;


export interface CashTrackItem {
  id: number;
  date: string;
  amController: string;
  pmController: string;
  registerDrops: number;
  expenses: number;
  balance: number;
  deposit: number;
  courier: string;
  finalBalance: number;
}

async function parseJson(res: Response) {
  if (!res.ok) {
    let message = `API error: ${res.statusText}`;
    try {
      const err = (await res.json()) as { message?: string };
      if (err.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<unknown>;
}

export async function fetchDailySummaries(): Promise<CashTrackItem[]> {
  const res = await fetch(API_BASE);
  const data = await parseJson(res);
  if (Array.isArray(data)) return data;
  const wrapped = data as { data?: CashTrackItem[] };
  return wrapped.data ?? [];
}

export async function updateDailySummary(
  id: number,
  data: Partial<CashTrackItem>
): Promise<CashTrackItem> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await parseJson(res);
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: CashTrackItem }).data;
  }
  return body as CashTrackItem;
}

export async function deleteDailySummary(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    let message = `Failed to delete record: ${res.statusText}`;
    try {
      const err = (await res.json()) as { message?: string };
      if (err.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
}
