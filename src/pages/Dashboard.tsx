import React, { useRef, useState } from "react";
import { Upload, Download } from "lucide-react";
import DepositWidget from "../components/Widgets/DepositWidget";
import RevenueWidget from "../components/Widgets/RevenueWidget";
import ExpenseWidget from "../components/Widgets/ExpensesWidget";
import GraphChart from "../components/Charts/GraphChart";
import BarChart from "../components/Charts/BarChart";
import { useSummaryScope } from "../context/SummaryScopeContext";
import { useStore } from "../context/StoreContext";
import { fetchDailySummaries, type CashTrackItem } from "../api/cashTrackApi";
import { filterCashTrackBySummaryScope } from "../utils/cashOnHandShared";

function escapeCsvField(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const CASH_TRACK_CSV_KEYS: (keyof CashTrackItem)[] = [
  "id",
  "date",
  "amController",
  "pmController",
  "registerDrops",
  "expenses",
  "balance",
  "deposit",
  "courier",
  "finalBalance",
];

function cashTrackRowsToCsv(rows: CashTrackItem[]): string {
  const header = CASH_TRACK_CSV_KEYS.join(",");
  const body = rows.map((row) =>
    CASH_TRACK_CSV_KEYS.map((k) => escapeCsvField(row[k] as string | number)).join(
      ","
    )
  );
  return [header, ...body].join("\r\n");
}

const Dashboard: React.FC = () => {
  const { summaryScope } = useSummaryScope();
  const { selectedPhysicalStoreId } = useStore();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);

  const onCsvSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      e.target.value = "";
    }
  };

  const onExportCsv = async () => {
    setExporting(true);
    try {
      const rows = await fetchDailySummaries(selectedPhysicalStoreId);
      const scoped = filterCashTrackBySummaryScope(rows, summaryScope);
      const csv = cashTrackRowsToCsv(scoped);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cash-summaries-${summaryScope}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          aria-hidden
          onChange={onCsvSelected}
        />
        <button
          type="button"
          onClick={() => csvInputRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <Upload size={16} className="text-gray-500" />
          Import CSV
        </button>
        <button
          type="button"
          disabled={exporting}
          onClick={() => void onExportCsv()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} className="text-gray-500" />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <DepositWidget summaryScope={summaryScope} />
        <ExpenseWidget />
        <RevenueWidget />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Analytics</h3>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm lg:col-span-2">
            <BarChart summaryScope={summaryScope} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <GraphChart summaryScope={summaryScope} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
