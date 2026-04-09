import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  useContext,
} from "react";
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  normalizeAuthUser,
  registerRequest,
  type AuthUser,
} from "../api/authApi";
import { AUTH_TOKEN_KEY } from "../api/authorizedFetch";
import {
  AUTH_BROADCAST_CHANNEL,
  type AuthBroadcastMessage,
} from "../constants/authBroadcast";
import { dispatchNotificationsRefetch } from "../constants/notificationEvents";
interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  authReady: boolean;
  /** Re-fetch `/auth/me` and update user (e.g. after role change; notifications load from API). */
  refreshUser: () => Promise<AuthUser | null>;
  /** Apply user payload when the current user was updated elsewhere (e.g. User Management). */
  applyRemoteUserUpdate: (me: AuthUser) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!t) return null;
    try {
      const me = await fetchCurrentUser(t);
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const applyRemoteUserUpdate = useCallback((me: AuthUser) => {
    const normalized = normalizeAuthUser(me);
    const prev = userRef.current;
    if (!prev || Number(prev.id) !== Number(normalized.id)) return;
    setUser(normalized);
  }, []);

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

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    const onMsg = (ev: MessageEvent<AuthBroadcastMessage>) => {
      const msg = ev.data;
      if (!msg || msg.type !== "role-maybe-changed") return;
      const u = userRef.current;
      if (!u || Number(u.id) !== Number(msg.userId)) return;
      void (async () => {
        await refreshUser();
        dispatchNotificationsRefetch();
      })();
    };
    ch.addEventListener("message", onMsg);
    return () => {
      ch.removeEventListener("message", onMsg);
      ch.close();
    };
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await loginRequest(username, password);
    localStorage.setItem(AUTH_TOKEN_KEY, res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      passwordConfirmation: string
    ) => {
      const res = await registerRequest(
        username,
        email,
        password,
        passwordConfirmation
      );
      localStorage.setItem(AUTH_TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
    },
    []
  );

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
      value={{
        token,
        user,
        authReady,
        refreshUser,
        applyRemoteUserUpdate,
        login,
        register,
        logout,
      }}
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
