import React, { useMemo, useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Wallet,
  CreditCard,
  Landmark,
  Receipt,
  Gift,
  Shield,
} from "lucide-react";

type SidebarLinkEntry = {
  kind: "link";
  name: string;
  path: string;
  icon?: React.ElementType;
};

type SidebarGroupItem = {
  kind: "link";
  name: string;
  path: string;
};

type SidebarGroupEntry = {
  kind: "group";
  title: string;
  icon?: React.ElementType;
  items: SidebarGroupItem[];
};

type SidebarEntry = SidebarLinkEntry | SidebarGroupEntry;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navLinkBase =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium";

  const groups: SidebarEntry[] = useMemo(
    () => [
      { kind: "link", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },

      {
        kind: "group",
        title: "Cash Management",
        icon: Wallet,
        items: [
          { kind: "link", name: "Cash on Hand", path: "/cash-on-hand" },
          { kind: "link", name: "Register Drops", path: "/register-drops" },
          { kind: "link", name: "Drop Safe", path: "/drop-safe" },
          { kind: "link", name: "Change Bank", path: "/change-bank" },
        ],
      },

      {
        kind: "group",
        title: "Sales & Reconciliation",
        icon: CreditCard,
        items: [
          { kind: "link", name: "POS Reconcile", path: "/pos-reconcile" },
          { kind: "link", name: "Blaze Accounting Summary", path: "/blaze-summary" },
        ],
      },

      {
        kind: "group",
        title: "Cashless / ATM Tracking",
        icon: Landmark,
        items: [
          { kind: "link", name: "Cashless ATM", path: "/cashless-atm" },
          { kind: "link", name: "Cashless ATM Reconcile", path: "/atm-reconcile" },
        ],
      },

      {
        kind: "group",
        title: "Expenses & Adjustments",
        icon: Receipt,
        items: [{ kind: "link", name: "Expenses", path: "/expenses" }],
      },

      {
        kind: "group",
        title: "Staff / Misc",
        icon: Gift,
        items: [{ kind: "link", name: "Tips", path: "/tips" }],
      },

      { kind: "link", name: "Controllers", path: "/users", icon: Users },
      { kind: "link", name: "Settings", path: "/settings", icon: Settings },
    ],
    []
  );

  // Track which dropdown is open
  const [openGroup, setOpenGroup] = useState<string | null>(
    groups.find(
      (g): g is SidebarGroupEntry =>
        g.kind === "group" &&
        g.items.some((item) => location.pathname.startsWith(item.path))
    )?.title ?? null
  );

  // Refs to store each dropdown's DOM element
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownHeights, setDropdownHeights] = useState<Record<string, number>>({});

  // Update height when openGroup changes
  useEffect(() => {
    if (openGroup) {
      const el = dropdownRefs.current[openGroup];
      if (el) {
        setDropdownHeights((prev) => ({
          ...prev,
          [openGroup]: el.scrollHeight,
        }));
      }
    }
  }, [openGroup]);

  return (
    <div className="bg-gray-900 text-gray-300 h-screen shadow-xl border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 text-white text-xl font-bold flex items-center gap-3 flex-shrink-0">
        <Shield size={20} />
        <span>Admin Panel</span>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <nav className="flex flex-col gap-2">
          {groups.map((entry) => {
            if (entry.kind === "link") {
              const Icon = entry.icon;
              return (
                <NavLink
                  key={entry.name}
                  to={entry.path}
                  end
                  className={({ isActive }) =>
                    `${navLinkBase} ${
                      isActive
                        ? "bg-gray-800 text-white shadow-md"
                        : "hover:bg-gray-800"
                    }`
                  }
                  onClick={() => setOpenGroup(null)} // close any open dropdown
                >
                  {Icon ? <Icon size={18} /> : null}
                  {entry.name}
                </NavLink>
              );
            }

            // Dropdown group
            const GroupIcon = entry.icon;
            const isOpen = openGroup === entry.title;

            return (
              <div key={entry.title} className="pt-2">
                {/* Group Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setOpenGroup((prev) =>
                      prev === entry.title ? null : entry.title
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenGroup((prev) =>
                        prev === entry.title ? null : entry.title
                      );
                    }
                  }}
                  className={`${navLinkBase} cursor-pointer ${
                    isOpen
                      ? "bg-gray-800 text-white font-semibold shadow-md"
                      : "hover:bg-gray-800"
                  }`}
                >
                  {GroupIcon ? <GroupIcon size={18} /> : null}
                  <span>{entry.title}</span>
                </div>

                {/* Sub-items with smooth transition */}
                <div
                  ref={(el) => {
                    if (el) dropdownRefs.current[entry.title] = el;
                  }}
                  style={{
                    maxHeight: isOpen
                      ? `${dropdownHeights[entry.title] || 0}px`
                      : "0px",
                    transition: "max-height 0.3s ease",
                    overflow: "hidden",
                  }}
                  className="flex flex-col gap-1 mt-2 ml-4"
                >
                  {entry.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `${navLinkBase} py-2 ${
                          isActive
                            ? "text-green-500 font-semibold"
                            : "text-white hover:text-green-300"
                        }`
                      }
                    >
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;