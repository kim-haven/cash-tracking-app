import React, { useMemo, useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Wallet,
  Calculator,
  CreditCard,
  Landmark,
  Receipt,
  Gift,
  Shield,
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
  const navLinkBase =
    "flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium";
  const [isCashDeskOpen, setIsCashDeskOpen] = useState(false);
  const [cashDeskForm, setCashDeskForm] = useState({
    cash1000: "",
    cash500: "",
    cash100: "",
    cash50: "",
    posTerminalSales: "",
    posRefunds: "",
    posCashBack: "",
    tips: "",
    notes: "",
  });

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
    <>
      <div className="bg-gray-900 text-gray-300 h-screen shadow-xl border-r border-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 text-white text-xl font-bold flex items-center gap-3 shrink-0">
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

          <button
            type="button"
            onClick={() => setIsCashDeskOpen(true)}
            className="cursor-pointer mt-2 w-full rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-left text-emerald-100 shadow-sm transition-all hover:bg-emerald-500/25 hover:shadow-md active:scale-[0.99]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <Calculator size={18} />
              Cash Desk
            </span>
            <span className="mt-1 block text-xs text-emerald-200/80">
              Open cash entry form
            </span>
          </button>
        </nav>
      </div>
      </div>

      {isCashDeskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Cash Desk Entry</h3>
              <button
                type="button"
                onClick={() => setIsCashDeskOpen(false)}
                className="rounded-md px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="number"
                placeholder="1000 denomination amount"
                value={cashDeskForm.cash1000}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, cash1000: e.target.value }))}
              />
              <input
                type="number"
                placeholder="500 denomination amount"
                value={cashDeskForm.cash500}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, cash500: e.target.value }))}
              />
              <input
                type="number"
                placeholder="100 denomination amount"
                value={cashDeskForm.cash100}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, cash100: e.target.value }))}
              />
              <input
                type="number"
                placeholder="50 denomination amount"
                value={cashDeskForm.cash50}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, cash50: e.target.value }))}
              />
              <input
                type="number"
                placeholder="POS terminal sales"
                value={cashDeskForm.posTerminalSales}
                onChange={(e) =>
                  setCashDeskForm((prev) => ({ ...prev, posTerminalSales: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="POS refunds"
                value={cashDeskForm.posRefunds}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, posRefunds: e.target.value }))}
              />
              <input
                type="number"
                placeholder="POS cash back"
                value={cashDeskForm.posCashBack}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, posCashBack: e.target.value }))}
              />
              <input
                type="number"
                placeholder="Tips"
                value={cashDeskForm.tips}
                onChange={(e) => setCashDeskForm((prev) => ({ ...prev, tips: e.target.value }))}
              />
            </div>

            <textarea
              className="mt-4 w-full"
              rows={3}
              placeholder="Notes"
              value={cashDeskForm.notes}
              onChange={(e) => setCashDeskForm((prev) => ({ ...prev, notes: e.target.value }))}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCashDeskOpen(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCashDeskOpen(false);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default Sidebar;