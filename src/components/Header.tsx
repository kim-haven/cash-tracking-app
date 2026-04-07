import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const storeRef = useRef<HTMLDivElement>(null);

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
    <div className="w-full flex justify-between items-center bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">

      {/* LEFT - Store selector */}
      <div ref={storeRef} className="relative">
        <div
          onClick={() => setStoreDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 cursor-pointer border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50"
        >
          <span className="text-gray-700 font-medium">
            {!storesReady ? "Loading stores…" : selectedStoreLabel}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </div>

        {storesError ? (
          <p className="mt-1 text-xs text-red-600">{storesError}</p>
        ) : null}

        {storeDropdownOpen && storesReady && (
          <div className="absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-30 max-h-64 overflow-y-auto">

            <button
              type="button"
              onClick={() => {
                setSelectedPhysicalStoreId(null);
                setStoreDropdownOpen(false);
              }}
              className={`w-full text-left text-base px-4 py-2 hover:bg-gray-100 transition ${
                selectedPhysicalStoreId === null
                  ? "bg-gray-100 font-semibold"
                  : ""
              } text-blue-600 font-medium`}
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
                className={`w-full text-left text-base px-4 py-2 hover:bg-gray-100 transition ${
                  selectedPhysicalStoreId === store.id
                    ? "bg-gray-100 font-semibold"
                    : ""
                } text-gray-800`}
              >
                {store.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification */}
        <div ref={notifRef} className="relative">
          <div
            className="relative cursor-pointer"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
          >
            <Bell className="text-gray-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-30">
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No notifications
              </div>
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
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-base text-gray-700 font-medium">
                  {user?.name ?? "—"}
                </div>
                <div className="text-gray-400 text-xs lowercase">
                  {user?.role ?? "—"}
                </div>
              </div>

              <button
                type="button"
                className="block w-full text-left text-base px-4 py-2 hover:bg-gray-100 text-gray-800"
              >
                Profile
              </button>
              <button
                type="button"
                className="block w-full text-left text-base px-4 py-2 hover:bg-gray-100 text-red-600"
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
