import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { useStore } from "../context/StoreContext";
import { formatUserRoleLabel } from "../utils/userRoleLabel";
import {
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  type HeaderNotificationItem,
} from "../api/notificationsApi";
import { NOTIFICATIONS_REFETCH_EVENT } from "../constants/notificationEvents";

const CLIENT_VERSION = import.meta.env.VITE_APP_VERSION ?? "";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, token, refreshUser } = useAuth();
  const { notificationsEnabled, darkMode, setDarkMode } = useUserPreferences();
  const {
    stores,
    storesReady,
    storesError,
    selectedPhysicalStoreId,
    setSelectedPhysicalStoreId,
    selectedStoreLabel,
  } = useStore();

  const physicalStores = useMemo(
    () => stores.filter((s) => !s.is_all_stores),
    [stores]
  );

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<HeaderNotificationItem[]>([]);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    if (!notificationsEnabled) {
      setNotifItems([]);
      return;
    }
    try {
      const items = await fetchUserNotifications(CLIENT_VERSION);
      setNotifItems(items);
    } catch {
      /* keep existing list on failure */
    }
  }, [token, notificationsEnabled]);

  useEffect(() => {
    if (!user?.id || !token) {
      setNotifItems([]);
      return;
    }
    void loadNotifications();
  }, [user?.id, token, loadNotifications]);

  useEffect(() => {
    if (!notificationsEnabled) {
      setNotifDropdownOpen(false);
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    const onRefetch = () => {
      void loadNotifications();
    };
    window.addEventListener(NOTIFICATIONS_REFETCH_EVENT, onRefetch);
    return () => window.removeEventListener(NOTIFICATIONS_REFETCH_EVENT, onRefetch);
  }, [loadNotifications]);

  const pollSession = useCallback(() => {
    void refreshUser();
    void loadNotifications();
  }, [refreshUser, loadNotifications]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(pollSession, 30_000);
    return () => window.clearInterval(id);
  }, [token, pollSession]);

  useEffect(() => {
    if (!token) return;
    const onVis = () => {
      if (document.visibilityState === "visible") pollSession();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [token, pollSession]);

  const unreadCount = notifItems.filter((n) => !n.read).length;

  const markNotifRead = (id: string) => {
    if (!notificationsEnabled) return;
    const num = Number(id);
    if (!Number.isFinite(num)) return;
    void (async () => {
      try {
        await markNotificationsRead([num]);
        setNotifItems((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      } catch {
        /* ignore */
      }
    })();
  };

  const markAllNotifsRead = () => {
    if (!notificationsEnabled) return;
    void (async () => {
      try {
        await markAllNotificationsRead();
        setNotifItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        /* ignore */
      }
    })();
  };

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (storeRef.current && !storeRef.current.contains(event.target as Node)) {
        setStoreDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
      {/* LEFT - Store selector */}
      <div ref={storeRef} className="relative">
        <div
          onClick={() => setStoreDropdownOpen((prev) => !prev)}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-4 py-2 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          <span className="font-medium text-gray-700 dark:text-gray-100">
            {!storesReady ? "Loading stores…" : selectedStoreLabel}
          </span>
          <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
        </div>

        {storesError ? (
          <p className="mt-1 text-xs text-red-600">{storesError}</p>
        ) : null}

        {storeDropdownOpen && storesReady && (
          <div className="absolute left-0 z-30 mt-2 max-h-64 w-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900">

            <button
              type="button"
              onClick={() => {
                setSelectedPhysicalStoreId(null);
                setStoreDropdownOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-base font-medium text-blue-600 transition hover:bg-gray-100 dark:hover:bg-slate-800 ${
                selectedPhysicalStoreId === null
                  ? "bg-gray-100 font-semibold dark:bg-slate-800"
                  : ""
              }`}
            >
              All Stores
            </button>

            {physicalStores.length > 0 ? (
              <div className="border-t border-gray-200 my-1" />
            ) : null}

            {physicalStores.map((store) => (
              <button
                key={store.id}
                type="button"
                onClick={() => {
                  setSelectedPhysicalStoreId(store.id);
                    setStoreDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-base text-gray-800 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800 ${
                  selectedPhysicalStoreId === store.id
                    ? "bg-gray-100 font-semibold dark:bg-slate-800"
                    : ""
                }`}
              >
                {store.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="ml-auto flex items-center gap-3 sm:gap-4">
        {/* Dark mode toggle (moon / sun on the knob) */}
        <button
          type="button"
          role="switch"
          aria-checked={darkMode}
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            darkMode
              ? "border-[#0f1629] bg-[#030619]"
              : "border-gray-200 bg-gray-200 dark:border-slate-600 dark:bg-slate-600"
          }`}
        >
          <span
            className={`pointer-events-none absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-out will-change-transform ${
              darkMode ? "translate-x-6" : "translate-x-0"
            }`}
            aria-hidden
          >
            {darkMode ? (
              <Sun className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.25} />
            ) : (
              <Moon className="h-3.5 w-3.5 text-slate-600" strokeWidth={2.25} />
            )}
          </span>
          <span className="sr-only">
            {darkMode ? "Dark mode on" : "Dark mode off"}
          </span>
        </button>

        {/* Notification */}
        <div ref={notifRef} className="relative">
          <div
            className={`relative ${
              notificationsEnabled
                ? "cursor-pointer"
                : "cursor-not-allowed opacity-45"
            }`}
            onClick={() => {
              if (!notificationsEnabled) return;
              setNotifDropdownOpen((prev) => !prev);
            }}
            title={
              notificationsEnabled
                ? "Notifications"
                : "Notifications are off — enable in Settings"
            }
            role="button"
            aria-disabled={!notificationsEnabled}
          >
            <Bell
              className={
                notificationsEnabled
                  ? "text-gray-500 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-600"
              }
            />
            {unreadCount > 0 ? (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white"
                aria-hidden
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </div>

          {notifDropdownOpen && notificationsEnabled && (
            <div className="absolute right-0 z-30 mt-2 flex max-h-80 w-72 flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-slate-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Notifications
                </span>
                {notifItems.length > 0 && unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllNotifsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifItems.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No notifications
                  </div>
                ) : (
                  notifItems.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => markNotifRead(n.id)}
                      className={`w-full border-b border-gray-50 px-3 py-3 text-left text-sm transition hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                        n.read
                          ? "text-gray-500 dark:text-gray-400"
                          : "bg-blue-50/50 font-medium text-gray-900 dark:bg-slate-800/80 dark:text-gray-100"
                      }`}
                    >
                      {n.text}
                    </button>
                  ))
                )}
              </div>
              <p className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-400 dark:border-slate-700 dark:text-gray-500">
                Entries older than 10 days are removed automatically.
              </p>
            </div>
          )}
        </div>

        {/* User */}
        <div ref={userRef} className="relative">
          <div
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold cursor-pointer"
            onClick={() => setUserDropdownOpen((prev) => !prev)}
            title={user?.name ?? "Account"}
          >
            {user?.name?.trim()?.charAt(0)?.toUpperCase() ?? "?"}
          </div>

          {userDropdownOpen && (
            <div className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700">
                <div className="text-base font-medium text-gray-700 dark:text-gray-100">
                  {user?.name ?? "—"}
                </div>
                <div className="text-xs capitalize text-gray-400 dark:text-gray-500">
                  {user?.role ? formatUserRoleLabel(user.role) : "—"}
                </div>
              </div>

              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-base text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                Profile
              </button>
              <button
                type="button"
                className="block w-full px-4 py-2 text-left text-base text-red-600 hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={() => {
                  setUserDropdownOpen(false);
                  void (async () => {
                    await logout();
                    navigate("/login", { replace: true });
                  })();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
