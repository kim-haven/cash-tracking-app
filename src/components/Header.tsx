import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

const Header: React.FC = () => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userRef.current && !userRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        notifRef.current && !notifRef.current.contains(event.target as Node)
      ) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full flex justify-between items-center bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">

      {/* Right */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <div
            className="relative cursor-pointer"
            onClick={() => setNotifDropdownOpen((prev) => !prev)}
          >
            <Bell className="text-gray-500" />
            {/* Red dot */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </div>

          {/* Notification dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-30 transition-all duration-200">
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No notifications
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div ref={userRef} className="relative">
          <div
            className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold cursor-pointer"
            onClick={() => setUserDropdownOpen((prev) => !prev)}
          >
            A
          </div>

            {/* User dropdown */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden z-30 transition-all duration-200">
                
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-gray-700 font-medium">John Doe</div>
                  <div className="text-gray-400 text-xs lowercase">admin</div>
                </div>
                

                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  Profile
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  onClick={() => setUserDropdownOpen(false)}
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