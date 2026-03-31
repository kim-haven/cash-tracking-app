import { buildApiUrl } from "../config/apiBase";
import type { RegisterDropItem } from "../data/RegisterDropsData";

export type RegisterDropApiRow = {
  id: number;
  date: string;
  register: string;
  time_start: string | null;
  time_end: string | null;
  action: string;
  cash_in: string;
  initials: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RegisterDropsPaginatedResponse = {
  current_page: number;
  data: RegisterDropApiRow[];
  last_page?: number;
  per_page?: number;
  total?: number;
};

/** Body for POST /api/register-drops */
export type RegisterDropCreatePayload = {
  date: string;
  register: string;
  time_start: string;
  time_end: string | null;
  action: string;
  cash_in: number;
  initials: string;
  notes: string | null;
};

function formatApiDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeHms(hms: string | null | undefined): string {
  if (hms == null || hms === "") return "";
  const parts = hms.split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (Number.isNaN(h)) return hms;
  const d = new Date(2000, 0, 1, h, m, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function mapRegisterDropApiToItem(row: RegisterDropApiRow): RegisterDropItem {
  return {
    id: row.id,
    date: formatApiDate(row.date),
    register: row.register,
    timeStart: formatTimeHms(row.time_start),
    timeEnd: formatTimeHms(row.time_end),
    action: row.action,
    cashIn: Number.parseFloat(row.cash_in),
    initials: row.initials,
    notes: row.notes ?? "",
    dateValue: row.date.slice(0, 10),
    timeStartValue:
      row.time_start != null && row.time_start.length >= 5
        ? row.time_start.slice(0, 5)
        : "",
    timeEndValue:
      row.time_end != null && row.time_end.length >= 5 ? row.time_end.slice(0, 5) : "",
    cashInRaw: row.cash_in,
  };
}

export type RegisterDropUpdatePayload = {
  date: string;
  register: string;
  time_start: string;
  time_end: string | null;
  action: string;
  cash_in: number;
  initials: string;
  notes: string | null;
};

export async function fetchRegisterDropsPage(
  page: number
): Promise<RegisterDropsPaginatedResponse> {
  const url = new URL(buildApiUrl("/api/register-drops"), window.location.origin);
  url.searchParams.set("page", String(page));
  const res = await fetch(url.toString(), { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Register drops request failed (${res.status})`);
  }
  return res.json() as Promise<RegisterDropsPaginatedResponse>;
}

/** Loads every page so client search/pagination work without extra query params. */
export async function fetchAllRegisterDrops(): Promise<RegisterDropItem[]> {
  const first = await fetchRegisterDropsPage(1);
  const lastPage = first.last_page ?? 1;
  let rows = [...first.data];
  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        fetchRegisterDropsPage(i + 2)
      )
    );
    for (const chunk of rest) {
      rows = rows.concat(chunk.data);
    }
  }
  return rows.map(mapRegisterDropApiToItem);
}

export async function createRegisterDrop(
  payload: RegisterDropCreatePayload
): Promise<unknown> {
  const res = await fetch(buildApiUrl("/api/register-drops"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Save failed (${res.status})`;
    try {
      const errJson: Record<string, unknown> = await res.json();
      if (typeof errJson.message === "string") msg = errJson.message;
      const errors = errJson.errors;
      if (errors && typeof errors === "object" && errors !== null) {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") msg = first;
      }
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function updateRegisterDrop(
  id: number,
  payload: RegisterDropUpdatePayload
): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/register-drops/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Update failed (${res.status})`;
    try {
      const errJson: Record<string, unknown> = await res.json();
      if (typeof errJson.message === "string") msg = errJson.message;
      const errors = errJson.errors;
      if (errors && typeof errors === "object" && errors !== null) {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") msg = first;
      }
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function deleteRegisterDrop(
  id: number,
  deleteReason?: string
): Promise<unknown> {
  const res = await fetch(buildApiUrl(`/api/register-drops/${id}`), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      deleted_by: "1",
      ...(deleteReason?.trim() ? { delete_reason: deleteReason.trim() } : {}),
    }),
  });
  if (!res.ok) {
    let msg = `Delete failed (${res.status})`;
    // For now, suppress backend "Unauthenticated." messaging in UI.
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

/** POST /api/register-drops/add-time-out */
export async function addRegisterDropTimeOut(
  id: number,
  timeOut: string
): Promise<unknown> {
  const res = await fetch(buildApiUrl("/api/register-drops/add-time-out"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ id, time_out: timeOut.trim() }),
  });
  if (!res.ok) {
    let msg = `Update failed (${res.status})`;
    try {
      const errJson: Record<string, unknown> = await res.json();
      if (typeof errJson.message === "string") msg = errJson.message;
      const errors = errJson.errors;
      if (errors && typeof errors === "object" && errors !== null) {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") msg = first;
      }
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return res.json();
}

/** Convert `<input type="time">` (HH:mm) to API string like `8:00 PM` for bulk time-out. */
export function formatTimeInputForBulkTimeOutApi(hhmm: string): string {
  const parts = hhmm.trim().split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (Number.isNaN(h)) return hhmm.trim();
  const d = new Date(2000, 0, 1, h, m, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** POST /api/register-drops/bulk-time-out-update */
export async function bulkRegisterDropTimeOut(
  ids: number[],
  timeOut: string
): Promise<unknown> {
  const res = await fetch(buildApiUrl("/api/register-drops/bulk-time-out-update"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ids, time_out: timeOut.trim() }),
  });
  if (!res.ok) {
    let msg = `Bulk update failed (${res.status})`;
    try {
      const errJson: Record<string, unknown> = await res.json();
      if (typeof errJson.message === "string") msg = errJson.message;
      const errors = errJson.errors;
      if (errors && typeof errors === "object" && errors !== null) {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") msg = first;
      }
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  return res.json();
}
