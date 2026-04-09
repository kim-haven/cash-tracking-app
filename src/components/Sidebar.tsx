import React, { useMemo, useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  SUMMARY_OPTIONS,
  useSummaryScope,
} from "../context/SummaryScopeContext";
import { useAuth } from "../context/AuthContext";
import { formatUserRoleLabel } from "../utils/userRoleLabel";
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
  ShieldCheck,
  ChevronDown,
  ChevronUp,
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
  const { user } = useAuth();
  const { summaryScope, setSummaryScope } = useSummaryScope();
  const [summaryDropdownOpen, setSummaryDropdownOpen] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const navLinkBase =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium";

  const selectedSummaryLabel =
    SUMMARY_OPTIONS.find((o) => o.scope === summaryScope)?.label ??
    "All data summaries";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        summaryRef.current &&
        !summaryRef.current.contains(event.target as Node)
      ) {
        setSummaryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

      { kind: "link", name: "User Management", path: "/users", icon: Users },
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
    <div className="flex h-screen flex-col border-r border-gray-800 bg-gray-900 text-gray-300 shadow-xl">
      {/* Header */}
      <div className="p-6 text-white text-xl font-bold flex items-center gap-3 shrink-0">
        <Shield size={20} />
        <span>Admin Panel</span>
      </div>

      <div className="shrink-0 px-3 pb-3 pt-1">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Summaries
        </p>
        <div ref={summaryRef} className="relative z-40">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setSummaryDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSummaryDropdownOpen((prev) => !prev);
              }
            }}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-600 bg-gray-800/90 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
          >
            <span className="min-w-0 flex-1 truncate font-medium">
              {selectedSummaryLabel}
            </span>
            <ChevronDown size={16} className="shrink-0 text-gray-400" />
          </div>

          {summaryDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-md border border-gray-600 bg-gray-800 shadow-lg">
              {SUMMARY_OPTIONS.map((opt) => (
                <React.Fragment key={opt.scope}>
                  {opt.scope === "all" && (
                    <div className="my-1 border-t border-gray-700" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSummaryScope(opt.scope);
                      setSummaryDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm transition hover:bg-gray-700 ${
                      summaryScope === opt.scope
                        ? "bg-gray-700 font-semibold text-white"
                        : ""
                    } ${
                      opt.scope === "all"
                        ? "font-medium text-blue-400"
                        : "text-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="shrink-0 border-t border-gray-700"
        aria-hidden
      />

      {/* Scrollable nav */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
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
                  aria-expanded={isOpen}
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
                  className={`${navLinkBase} cursor-pointer justify-between ${
                    isOpen
                      ? "bg-gray-800 text-white font-semibold shadow-md"
                      : "hover:bg-gray-800"
                  }`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    {GroupIcon ? <GroupIcon size={18} className="shrink-0" /> : null}
                    <span className="truncate">{entry.title}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp
                      size={18}
                      className="shrink-0 opacity-70"
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      size={18}
                      className="shrink-0 opacity-70"
                      aria-hidden
                    />
                  )}
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
                        `${navLinkBase} py-2 text-base ${
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

      <div className="shrink-0 border-t border-gray-800 px-3 pb-5 pt-4">
        <div
          className="pointer-events-none flex w-full cursor-default select-none items-center gap-3 rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/20 to-emerald-900/30 px-3 py-3 text-left shadow-sm ring-1 ring-emerald-400/20"
          role="status"
          aria-label={`Signed in as ${user?.name?.trim() || "unknown"}, ${user?.role ? formatUserRoleLabel(user.role) : "unknown role"}`}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/30"
            aria-hidden
          >
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex flex-col justify-center gap-0.5 leading-tight">
            <span className="truncate text-sm font-semibold text-emerald-50">
              {user?.name?.trim() || "—"}
            </span>
            <span className="text-[11px] font-semibold capitalize tracking-wide text-emerald-300/95">
              {user?.role ? formatUserRoleLabel(user.role) : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;