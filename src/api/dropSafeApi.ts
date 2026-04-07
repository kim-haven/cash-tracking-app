import { buildApiUrl } from "../config/apiBase";
import { authorizedFetch } from "./authorizedFetch";
import { applyStoreIdParam } from "./storeQuery";
import type { DropSafeItem } from "../data/DropSafeData";

export type DropSafeApiRow = {
  id: number;
  bag_no: string;
  prepared_date: string;
  prepared_time: string;
  prepared_by: string;
  prepared_amount: string;
  courier_date: string | null;
  courier_time: string | null;
  courier_given_by: string | null;
  courier_received_by: string | null;
  courier_amount: string | null;
  created_at?: string;
  updated_at?: string;
};

type DropSafeListResponse = {
  data: DropSafeApiRow[];
};

/** Body for POST /api/drop-safes */
export type DropSafeCreatePayload = {
  store_id: number;
  bag_no: string;
  prepared_date: string;
  prepared_time: string;
  prepared_by: string;
  prepared_amount: string;
  courier_date: string | null;
  courier_time: string | null;
  courier_given_by: string | null;
  courier_received_by: string | null;
  courier_amount: string | null;
};

function timeInputToHms(hhmm: string): string {
  const t = hhmm.trim();
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

function formatAmountForApi(n: number): string {
  return n.toFixed(2);
}

function formatYmdToDisplay(ymd: string | null | undefined): string {
  if (ymd == null || ymd === "") return "";
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
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

export function mapDropSafeApiRow(row: DropSafeApiRow): DropSafeItem {
  const raw = row as DropSafeApiRow & { store_id?: number };
  const ct = row.courier_time;
  return {
    id: row.id,
    storeId: raw.store_id != null ? Number(raw.store_id) : undefined,
    bagNumber: row.bag_no,
    datePrepared: formatYmdToDisplay(row.prepared_date),
    timePrepared: formatTimeHms(row.prepared_time),
    preparedBy: row.prepared_by,
    amountPrepared: Number.parseFloat(row.prepared_amount),
    dateGiven: formatYmdToDisplay(row.courier_date ?? ""),
    timeGiven: formatTimeHms(row.courier_time),
    givenBy: row.courier_given_by ?? "",
    receivedBy: row.courier_received_by ?? "",
    amountReceived: Number.parseFloat(row.courier_amount ?? "0"),
    preparedDateValue: row.prepared_date,
    preparedTimeValue:
      row.prepared_time != null && row.prepared_time.length >= 5
        ? row.prepared_time.slice(0, 5)
        : "",
    preparedAmountRaw: row.prepared_amount,
    courierDateValue: row.courier_date ?? "",
    courierTimeValue:
      ct != null && ct.length >= 5 ? ct.slice(0, 5) : "",
    courierAmountRaw: row.courier_amount,
  };
}

export type DropSafeCourierPatchPayload = {
  courier_date: string | null;
  courier_time: string | null;
  courier_given_by: string | null;
  courier_received_by: string | null;
  courier_amount: string | null;
};

export function buildCourierUpdatePayload(form: {
  courierDate: string;
  courierTime: string;
  courierGivenBy: string;
  courierReceivedBy: string;
  courierAmount: string;
}): DropSafeCourierPatchPayload {
  const courierAmtStr = form.courierAmount.trim();
  const courierAmtParsed = Number.parseFloat(courierAmtStr);
  return {
    courier_date: form.courierDate.trim() === "" ? null : form.courierDate,
    courier_time:
      form.courierTime.trim() === ""
        ? null
        : timeInputToHms(form.courierTime),
    courier_given_by:
      form.courierGivenBy.trim() === "" ? null : form.courierGivenBy.trim(),
    courier_received_by:
      form.courierReceivedBy.trim() === ""
        ? null
        : form.courierReceivedBy.trim(),
    courier_amount:
      courierAmtStr === "" || Number.isNaN(courierAmtParsed)
        ? null
        : formatAmountForApi(courierAmtParsed),
  };
}

export async function patchDropSafeCourier(
  id: number,
  payload: DropSafeCourierPatchPayload
): Promise<unknown> {
  const res = await authorizedFetch(buildApiUrl(`/api/drop-safes/${id}`), {
    method: "PATCH",
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

export async function fetchDropSafes(
  storeId?: number | null
): Promise<DropSafeItem[]> {
  const url = new URL(buildApiUrl("/api/drop-safes"), window.location.origin);
  applyStoreIdParam(url, storeId ?? null);
  const res = await authorizedFetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Drop safes request failed (${res.status})`);
  }
  const json: DropSafeListResponse | DropSafeApiRow[] = await res.json();
  const rows = Array.isArray(json) ? json : json.data;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map(mapDropSafeApiRow);
}

export async function createDropSafe(
  payload: DropSafeCreatePayload
): Promise<unknown> {
  const res = await authorizedFetch(buildApiUrl("/api/drop-safes"), {
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

export async function updateDropSafe(
  id: number,
  payload: DropSafeCreatePayload
): Promise<unknown> {
  const res = await authorizedFetch(buildApiUrl(`/api/drop-safes/${id}`), {
    method: "PATCH",
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

export async function deleteDropSafe(
  id: number,
  deleteReason?: string
): Promise<unknown> {
  const res = await authorizedFetch(buildApiUrl(`/api/drop-safes/${id}`), {
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

export function buildDropSafePayloadFromForm(
  storeId: number,
  form: {
    bagNo: string;
    preparedDate: string;
    preparedTime: string;
    preparedBy: string;
    preparedAmount: string;
    courierDate: string;
    courierTime: string;
    courierGivenBy: string;
    courierReceivedBy: string;
    courierAmount: string;
  }
): DropSafeCreatePayload {
  const amt = Number.parseFloat(form.preparedAmount);
  const courierAmtStr = form.courierAmount.trim();
  const courierAmtParsed = Number.parseFloat(courierAmtStr);
  return {
    store_id: storeId,
    bag_no: form.bagNo.trim(),
    prepared_date: form.preparedDate,
    prepared_time: timeInputToHms(form.preparedTime),
    prepared_by: form.preparedBy.trim(),
    prepared_amount: formatAmountForApi(amt),
    courier_date: form.courierDate.trim() === "" ? null : form.courierDate,
    courier_time:
      form.courierTime.trim() === ""
        ? null
        : timeInputToHms(form.courierTime),
    courier_given_by:
      form.courierGivenBy.trim() === "" ? null : form.courierGivenBy.trim(),
    courier_received_by:
      form.courierReceivedBy.trim() === ""
        ? null
        : form.courierReceivedBy.trim(),
    courier_amount:
      courierAmtStr === "" || Number.isNaN(courierAmtParsed)
        ? null
        : formatAmountForApi(courierAmtParsed),
  };
}
