import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  useContext,
} from "react";
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  type AuthUser,
} from "../api/authApi";
import { AUTH_TOKEN_KEY } from "../api/authorizedFetch";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  authReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const t = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!t) {
        if (!cancelled) setAuthReady(true);
        return;
      }
      try {
        const me = await fetchCurrentUser(t);
        if (!cancelled) {
          setToken(t);
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await loginRequest(username, password);
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    if (t) {
      await logoutRequest(t);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, authReady, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
