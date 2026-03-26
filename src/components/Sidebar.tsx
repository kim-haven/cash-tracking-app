import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Settings } from "lucide-react";

const Sidebar: React.FC = () => {
  const links = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "CashTrack", path: "/cashtrack", icon: Settings },
    { name: "Controllers", path: "/users", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="bg-gray-900 text-gray-300 h-screen shadow-xl border-r border-gray-800">
      <div className="p-6 text-white text-xl font-bold">
        Admin Panel
      </div>

      <nav className="flex flex-col gap-2 px-3">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-gray-800 text-white shadow-md"
                    : "hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {link.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;