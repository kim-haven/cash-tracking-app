import { buildApiUrl } from "../config/apiBase";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type LoginSuccess = {
  message: string;
  token: string;
  user: AuthUser;
};

type MeResponse = {
  data: AuthUser;
};

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string };
    if (typeof data.message === "string") return data.message;
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
  const data = (await res.json()) as LoginSuccess & { message?: string };
  if (!res.ok) {
    throw new Error(
      typeof data.message === "string" ? data.message : "Login failed."
    );
  }
  return data;
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
  return data.data;
}
