import { buildApiUrl } from "../config/apiBase";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

/** Coerce API payloads (Laravel may send `id` as string in JSON). */
export function normalizeAuthUser(raw: AuthUser): AuthUser {
  return {
    ...raw,
    id: Number(raw.id),
    role: String(raw.role ?? ""),
  };
}

type LoginSuccess = {
  message: string;
  token: string;
  user: AuthUser;
};

type MeResponse = {
  data: AuthUser;
};

function messageFromAuthErrorBody(data: {
  message?: string;
  errors?: Record<string, string[]>;
}): string {
  if (data.errors) {
    const parts = Object.values(data.errors).flat();
    if (parts.length) return parts.join(" ");
  }
  if (typeof data.message === "string") return data.message;
  return "";
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    const fromBody = messageFromAuthErrorBody(data);
    if (fromBody) return fromBody;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function loginRequest(
  username: string,
  password: string
): Promise<LoginSuccess> {
  const res = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  type ErrBody = { message?: string; errors?: Record<string, string[]> };
  const data = (await res.json()) as LoginSuccess & ErrBody;
  if (!res.ok) {
    const msg = messageFromAuthErrorBody(data) || "Login failed.";
    throw new Error(msg);
  }
  return {
    ...data,
    user: normalizeAuthUser(data.user),
  };
}

export async function registerRequest(
  username: string,
  email: string,
  password: string,
  passwordConfirmation: string
): Promise<LoginSuccess> {
  const res = await fetch(buildApiUrl("/api/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });
  type ErrBody = { message?: string; errors?: Record<string, string[]> };
  const data = (await res.json()) as LoginSuccess & ErrBody;
  if (!res.ok) {
    const msg = messageFromAuthErrorBody(data) || "Registration failed.";
    throw new Error(msg);
  }
  return {
    ...data,
    user: normalizeAuthUser(data.user),
  };
}

/** Revokes the token on the server. Ignores HTTP errors so the client can always clear local state. */
export async function logoutRequest(token: string): Promise<void> {
  await fetch(buildApiUrl("/api/auth/logout"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const res = await fetch(buildApiUrl("/api/auth/me"), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const data = (await res.json()) as MeResponse;
  return normalizeAuthUser(data.data);
}
