import { buildApiUrl } from "../config/apiBase";
import { authorizedFetch } from "./authorizedFetch";

export type ServerNotificationRow = {
  id: string;
  type: string;
  text: string;
  read: boolean;
  created_at: string | null;
};

export type HeaderNotificationItem = {
  id: string;
  text: string;
  read: boolean;
  createdAt: number;
  type: string;
};

function mapRow(row: ServerNotificationRow): HeaderNotificationItem {
  const createdAt = row.created_at
    ? Date.parse(row.created_at)
    : Date.now();
  return {
    id: row.id,
    text: row.text,
    read: row.read,
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
    type: row.type,
  };
}

export async function fetchUserNotifications(
  clientVersion: string
): Promise<HeaderNotificationItem[]> {
  const params = new URLSearchParams();
  if (clientVersion) params.set("client_version", clientVersion);
  const q = params.toString();
  const url = buildApiUrl(`/api/notifications${q ? `?${q}` : ""}`);
  const res = await authorizedFetch(url);
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Failed to load notifications (${res.status})`);
  }
  const json = (await res.json()) as {
    data?: ServerNotificationRow[];
  };
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map(mapRow).sort((a, b) => b.createdAt - a.createdAt);
}

export async function markNotificationsRead(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const res = await authorizedFetch(buildApiUrl("/api/notifications/read"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update notifications (${res.status})`);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await authorizedFetch(buildApiUrl("/api/notifications/read"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mark_all: true }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update notifications (${res.status})`);
  }
}
