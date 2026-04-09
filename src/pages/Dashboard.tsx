import React, { useRef, useState } from "react";
import { Upload, Download } from "lucide-react";
import DepositWidget from "../components/Widgets/DepositWidget";
import RevenueWidget from "../components/Widgets/RevenueWidget";
import ExpenseWidget from "../components/Widgets/ExpensesWidget";
import GraphChart from "../components/Charts/GraphChart";
import BarChart from "../components/Charts/BarChart";
import { useSummaryScope } from "../context/SummaryScopeContext";
import { useStore } from "../context/StoreContext";
import { fetchDailySummaries } from "../api/cashTrackApi";
import { filterCashTrackBySummaryScope } from "../utils/cashOnHandShared";
import {
  cashTrackRowsToWorkbook,
  parseSpreadsheetFirstSheet,
} from "../utils/cashTrackSpreadsheet";
import * as XLSX from "xlsx";

const IMPORT_ACCEPT =
  ".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";

const Dashboard: React.FC = () => {
  const { summaryScope } = useSummaryScope();
  const { selectedPhysicalStoreId } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setImportMessage(null);
    setImportError(null);
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const { sheetName, rowCount } = parseSpreadsheetFirstSheet(data, file.name);
      setImportMessage(
        `Read ${rowCount} data row${rowCount === 1 ? "" : "s"} from sheet “${sheetName}” (${file.name}).`
      );
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Could not read that file."
      );
    }
  };

  const onExportExcel = async () => {
    setExporting(true);
    setImportError(null);
    try {
      const rows = await fetchDailySummaries(selectedPhysicalStoreId);
      const scoped = filterCashTrackBySummaryScope(rows, summaryScope);
      const wb = cashTrackRowsToWorkbook(scoped);
      const dateStamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(
        wb,
        `cash-summaries-${summaryScope}-${dateStamp}.xlsx`
      );
    } catch (err) {
      console.error(err);
      setImportError(
        err instanceof Error ? err.message : "Export failed."
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-end gap-2">
        <div className="flex justify-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={IMPORT_ACCEPT}
            className="hidden"
            aria-hidden
            onChange={(ev) => void onImportFile(ev)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            <Upload size={16} className="text-gray-500 dark:text-gray-400" />
            Import Excel
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void onExportExcel()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"
          >
            <Download size={16} className="text-gray-500 dark:text-gray-400" />
            {exporting ? "Exporting…" : "Export Excel"}
          </button>
        </div>
        {importMessage ? (
          <p
            role="status"
            className="max-w-full text-right text-sm text-green-700 dark:text-green-400"
          >
            {importMessage}
          </p>
        ) : null}
        {importError ? (
          <p
            role="alert"
            className="max-w-full text-right text-sm text-red-700 dark:text-red-400"
          >
            {importError}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <DepositWidget summaryScope={summaryScope} />
        <ExpenseWidget summaryScope={summaryScope} />
        <RevenueWidget />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Analytics
        </h3>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900/70 lg:col-span-2">
            <BarChart summaryScope={summaryScope} />
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-slate-600 dark:bg-slate-900/70">
            <GraphChart summaryScope={summaryScope} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
