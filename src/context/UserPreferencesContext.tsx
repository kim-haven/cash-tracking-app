import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

const NOTIFICATIONS_KEY = "cashTrack.notificationsEnabled";
const DARK_KEY = "cashTrack.darkMode";

function readBool(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === "true";
  } catch {
    return fallback;
  }
}

type UserPreferencesContextType = {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
};

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() =>
    readBool(NOTIFICATIONS_KEY, true)
  );
  const [darkMode, setDarkModeState] = useState(() => readBool(DARK_KEY, false));

  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem(DARK_KEY, darkMode ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [darkMode]);

  const setNotificationsEnabled = useCallback((value: boolean) => {
    setNotificationsEnabledState(value);
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, value ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{
        notificationsEnabled,
        setNotificationsEnabled,
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextType {
  const ctx = useContext(UserPreferencesContext);
  if (ctx === undefined) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    );
  }
  return ctx;
}
