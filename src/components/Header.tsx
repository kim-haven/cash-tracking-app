import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown } from "lucide-react";

const stores = [
  "All Stores",
  "Belmont",
  "DTLB",
  "Fresno",
  "Lakewood",
  "Los Alamitos",
  "Maywood",
  "Orange County",
  "Paramount",
  "Porterville",
  "San Bernardino",
  "Hawthorn",
  "Corona",
];

const Header: React.FC = () => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState("All Stores");

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
          <span className="text-gray-700 font-medium">{selectedStore}</span>
          <ChevronDown size={16} className="text-gray-500" />
        </div>

        {storeDropdownOpen && (
          <div className="absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-30 max-h-64 overflow-y-auto">

            {stores.map((store) => (
              <React.Fragment key={store}>
                
                {/* Divider after "All Stores" */}
                {store === "Belmont" && (
                  <div className="border-t border-gray-200 my-1"></div>
                )}

                <button
                  onClick={() => {
                    setSelectedStore(store);
                    setStoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                    selectedStore === store
                      ? "bg-gray-100 font-semibold"
                      : ""
                  } ${
                    store === "All Stores" ? "text-blue-600 font-medium" : ""
                  }`}
                >
                  {store}
                </button>
              </React.Fragment>
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
          >
            A
          </div>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-30">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-gray-700 font-medium">John Doe</div>
                <div className="text-gray-400 text-xs lowercase">admin</div>
              </div>

              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                Profile
              </button>
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
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