import * as XLSX from "xlsx";
import type { CashTrackItem } from "../api/cashTrackApi";

/** Column order for export / expected import layout (matches API shape). */
export const CASH_TRACK_SHEET_COLUMNS: (keyof CashTrackItem)[] = [
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

const SHEET_NAME = "Cash summaries";

export function cashTrackRowsToWorkbook(rows: CashTrackItem[]): XLSX.WorkBook {
  const header = CASH_TRACK_SHEET_COLUMNS;
  const aoa: (string | number)[][] = [
    header as string[],
    ...rows.map((row) =>
      header.map((k) => {
        const v = row[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        return v ?? "";
      })
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  return wb;
}

/**
 * Read first worksheet from an Excel (.xlsx, .xls) or CSV file.
 * Returns row count of object rows (excluding header row when detected).
 */
export function parseSpreadsheetFirstSheet(data: ArrayBuffer, fileName: string): {
  sheetName: string;
  rowCount: number;
} {
  const lower = fileName.toLowerCase();
  const wb = lower.endsWith(".csv")
    ? XLSX.read(new TextDecoder("utf-8").decode(data), { type: "string" })
    : XLSX.read(data, { type: "array" });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("The file has no sheets.");
  }
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Could not read the first sheet.");
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return { sheetName, rowCount: rows.length };
}
