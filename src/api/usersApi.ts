import { buildApiUrl } from "../config/apiBase";
import { authorizedFetch } from "./authorizedFetch";
import { normalizeAuthUser, type AuthUser } from "./authApi";

/** Roles that can be assigned via User Management (superadmin is bootstrap-only). */
export const ASSIGNABLE_USER_ROLES = ["admin", "manager", "user"] as const;
export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number];

type ErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

function messageFromErrorBody(data: ErrorBody): string {
  if (data.errors) {
    const parts = Object.values(data.errors).flat();
    if (parts.length) return parts.join(" ");
  }
  if (typeof data.message === "string") return data.message;
  return "";
}

function normalizeUsersPayload(raw: unknown): AuthUser[] {
  if (Array.isArray(raw)) {
    return raw as AuthUser[];
  }
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = (raw as { data: unknown }).data;
    if (Array.isArray(inner)) {
      return inner as AuthUser[];
    }
    if (
      inner &&
      typeof inner === "object" &&
      "data" in inner &&
      Array.isArray((inner as { data: unknown }).data)
    ) {
      return (inner as { data: AuthUser[] }).data;
    }
  }
  return [];
}

export async function fetchUsers(): Promise<AuthUser[]> {
  const res = await authorizedFetch(buildApiUrl("/api/admin/users"));
  if (!res.ok) {
    let message = `Failed to load users (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (typeof body.message === "string") message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const raw = await res.json();
  return normalizeUsersPayload(raw).map((u) => normalizeAuthUser(u));
}

export async function updateUserRole(
  userId: number,
  role: AssignableUserRole
): Promise<AuthUser> {
  const res = await authorizedFetch(
    buildApiUrl(`/api/admin/users/${userId}/role`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ role }),
    }
  );
  const data = (await res.json()) as { data?: AuthUser } & ErrorBody;
  if (!res.ok) {
    throw new Error(
      messageFromErrorBody(data) || "Failed to update role."
    );
  }
  if (!data.data) {
    throw new Error("Invalid response from server.");
  }
  return normalizeAuthUser(data.data);
}

export async function deleteAdminUser(userId: number): Promise<void> {
  const res = await authorizedFetch(
    buildApiUrl(`/api/admin/users/${userId}`),
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
    }
  );
  if (res.ok) {
    return;
  }
  const data = (await res.json().catch(() => ({}))) as ErrorBody;
  throw new Error(messageFromErrorBody(data) || "Failed to delete user.");
}
