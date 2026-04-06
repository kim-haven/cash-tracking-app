import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { Eye } from "lucide-react";
import { fetchDailySummaries, type CashTrackItem } from "../../api/cashTrackApi";
import { fetchAllExpenses } from "../../api/expensesApi";
import { formatUsShortDate } from "../../utils/usShortDate";

/** Match cash-track / expense rows on calendar date (YYYY-MM-DD prefix). */
function ymdKeyFromDateString(dateStr: string): string | null {
  const iso = String(dateStr ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

/** Sum cash_in + cash_out for one expense API row (camelCase or snake_case). */
function expenseCashInPlusOut(e: Record<string, unknown>): number {
  const cin = Number(e.cash_in ?? e.cashIn ?? 0);
  const cout = Number(e.cash_out ?? e.cashOut ?? 0);
  return cin + cout;
}

function expenseRowDateKey(e: Record<string, unknown>): string | null {
  return ymdKeyFromDateString(String(e.date ?? ""));
}

type DateViewMode =
  | "all_earliest"
  | "today"
  | "all_latest"
  | "last_week"
  | "last_month"
  | "last_3_months";

/** Calendar day as YYYYMMDD for comparisons (local), from API date string. */
function calendarKeyFromRowDate(dateStr: string): number | null {
  const trimmed = String(dateStr ?? "").trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return (
      Number(iso[1]) * 10_000 + Number(iso[2]) * 100 + Number(iso[3])
    );
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return (
    d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate()
  );
}

function calendarKeyFromDate(d: Date): number {
  return (
    d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate()
  );
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function compareRowDates(a: CashTrackItem, b: CashTrackItem): number {
  const ka = calendarKeyFromRowDate(a.date);
  const kb = calendarKeyFromRowDate(b.date);
  if (ka === null && kb === null) return 0;
  if (ka === null) return 1;
  if (kb === null) return -1;
  return ka - kb;
}

function applyDateViewMode(
  list: CashTrackItem[],
  mode: DateViewMode
): CashTrackItem[] {
  const now = new Date();
  const todayKey = calendarKeyFromDate(now);

  switch (mode) {
    case "today": {
      return list
        .filter((item) => calendarKeyFromRowDate(item.date) === todayKey)
        .sort(compareRowDates);
    }
    case "last_week": {
      const end = startOfDay(now);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const minK = calendarKeyFromDate(start);
      const maxK = calendarKeyFromDate(end);
      return list
        .filter((item) => {
          const k = calendarKeyFromRowDate(item.date);
          return k !== null && k >= minK && k <= maxK;
        })
        .sort(compareRowDates);
    }
    case "last_month": {
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastPrev = new Date(firstThisMonth.getTime() - 1);
      const firstPrev = new Date(
        lastPrev.getFullYear(),
        lastPrev.getMonth(),
        1
      );
      const minK = calendarKeyFromDate(firstPrev);
      const maxK = calendarKeyFromDate(lastPrev);
      return list
        .filter((item) => {
          const k = calendarKeyFromRowDate(item.date);
          return k !== null && k >= minK && k <= maxK;
        })
        .sort(compareRowDates);
    }
    case "last_3_months": {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const minK = calendarKeyFromDate(start);
      const maxK = todayKey;
      return list
        .filter((item) => {
          const k = calendarKeyFromRowDate(item.date);
          return k !== null && k >= minK && k <= maxK;
        })
        .sort(compareRowDates);
    }
    case "all_earliest":
      return [...list].sort(compareRowDates);
    case "all_latest":
      return [...list].sort((a, b) => -compareRowDates(a, b));
    default:
      return list;
  }
}

const CashOnHand: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CashTrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateViewMode, setDateViewMode] =
    useState<DateViewMode>("all_earliest");

  const [expenseApiRows, setExpenseApiRows] = useState<Record<string, unknown>[]>(
    []
  );

  const rowsPerPage = 10;

  /** Per calendar day: sum of expense cash_in + cash_out (from Expenses API). */
  const expensesInOutSumByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const raw of expenseApiRows) {
      const key = expenseRowDateKey(raw);
      if (!key) continue;
      m.set(key, (m.get(key) ?? 0) + expenseCashInPlusOut(raw));
    }
    return m;
  }, [expenseApiRows]);

  // Load daily summaries + expenses (for Expenses column totals)
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    Promise.all([
      fetchDailySummaries(),
      fetchAllExpenses().catch(() => []),
    ])
      .then(([summaries, expenses]) => {
        setItems(summaries);
        setExpenseApiRows(
          Array.isArray(expenses)
            ? (expenses as Record<string, unknown>[])
            : []
        );
      })
      .catch((err: unknown) =>
        setLoadError(
          err instanceof Error ? err.message : "Failed to load data"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const searchFiltered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.date.toLowerCase().includes(term) ||
        formatUsShortDate(item.date).toLowerCase().includes(term) ||
        item.amController.toLowerCase().includes(term) ||
        item.pmController.toLowerCase().includes(term) ||
        item.courier.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const viewData = useMemo(
    () => applyDateViewMode(searchFiltered, dateViewMode),
    [searchFiltered, dateViewMode]
  );

  const totalPages = Math.max(1, Math.ceil(viewData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = viewData.slice(indexOfFirstRow, indexOfLastRow);

  // Format currency
  const cashFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const fmtMoney = (value: unknown) => cashFmt.format(Number(value ?? 0));

  // Columns definition including Actions column
  const columns: Column<CashTrackItem>[] = [
    {
      header: "Date",
      accessor: "date",
      render: (val) => formatUsShortDate(String(val ?? "")),
    },
    { header: "AM Controller", accessor: "amController" },
    { header: "PM Controller", accessor: "pmController" },
    {
      header: "Register Drops",
      accessor: "registerDrops",
      render: (value) => (
        <span className="font-medium">{fmtMoney(value)}</span>
      ),
      align: "right",
    },
    {
      header: "Expenses",
      accessor: "expenses",
      render: (_value, row) => {
        const key = ymdKeyFromDateString(row.date);
        const sum = key ? expensesInOutSumByDate.get(key) ?? 0 : 0;
        return (
          <span className="font-medium text-red-500" title="Cash in + cash out">
            {fmtMoney(sum)}
          </span>
        );
      },
      align: "right",
    },
    {
      header: "Balance",
      accessor: "balance",
      render: (value) => (
        <span className="font-medium">{fmtMoney(value)}</span>
      ),
      align: "right",
    },
    {
      header: "Deposit",
      accessor: "deposit",
      render: (value) => (
        <span className="font-medium text-green-600">{fmtMoney(value)}</span>
      ),
      align: "right",
    },
    { header: "Courier", accessor: "courier" },
    {
      header: "Drop Safe Balance",
      accessor: "finalBalance",
      render: (value) => (
        <span className="font-bold text-blue-600">{fmtMoney(value)}</span>
      ),
      align: "right",
    },
    {
      header: "Actions",
      accessor: "id",
      align: "center",
      render: () => (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => navigate("/register-drops")}
            className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-blue-600 shadow-sm hover:bg-blue-50"
            title="View register drops"
            aria-label="View register drops"
          >
            <Eye className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Drops</h3>
          <p className="text-2xl font-bold">
            {cashFmt.format(
              viewData.reduce((sum, i) => sum + Number(i.registerDrops ?? 0), 0)
            )}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-500">
            {cashFmt.format(
              viewData.reduce((acc, i) => {
                const key = ymdKeyFromDateString(i.date);
                return (
                  acc + (key ? expensesInOutSumByDate.get(key) ?? 0 : 0)
                );
              }, 0)
            )}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Deposit</h3>
          <p className="text-2xl font-bold text-green-600">
            {cashFmt.format(
              viewData.reduce((sum, i) => sum + Number(i.deposit ?? 0), 0)
            )}
          </p>
        </div>
      </div>

      {/* Section title + date range */}
      <div className="flex flex-col items-center gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Search */}
        <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
          />
        </div>
        <label className="flex min-w-0 w-full flex-col gap-1 text-sm text-gray-600 sm:w-auto sm:max-w-md sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:self-end">
          <span className="shrink-0 whitespace-nowrap sm:text-right">
            Date range
          </span>
          <select
            value={dateViewMode}
            onChange={(e) => {
              setDateViewMode(e.target.value as DateViewMode);
              setCurrentPage(1);
            }}
            className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-300 sm:min-w-[18rem]"
            aria-label="Sort and filter by date"
          >
            <option value="all_earliest">Earliest</option>
            <option value="all_latest">Latest</option>
            <option value="today">Today</option>
            <option value="last_week">Last 7 days</option>
            <option value="last_month">
              Last calendar month
            </option>
            <option value="last_3_months">
              Last 3 months
            </option>
          </select>
        </label>
      </div>

      {/* Table */}
      {loadError ? (
        <div className="text-red-600">{loadError}</div>
      ) : loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No records found"
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CashOnHand;