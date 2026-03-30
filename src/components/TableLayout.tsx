import React, { useEffect, useRef } from "react";

export type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: "left" | "center" | "right"; // New: alignment for columns
  /** Optional className for the table cell (e.g. empty-cell styling). */
  cellClassName?: (value: T[keyof T], row: T) => string | undefined;
};

export type RowSelectionConfig<T> = {
  isRowSelected: (row: T) => boolean;
  onToggleRow: (row: T) => void;
  headerChecked: boolean;
  headerIndeterminate: boolean;
  onToggleHeader: () => void;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowSelection?: RowSelectionConfig<T>;
  getRowKey?: (row: T, index: number) => React.Key;
};

function Table<T extends object>({
  data,
  columns,
  emptyMessage = "No data available",
  rowSelection,
  getRowKey,
}: TableProps<T>) {
  const headerSelectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = headerSelectRef.current;
    if (!el || !rowSelection) return;
    el.indeterminate = rowSelection.headerIndeterminate;
  }, [
    rowSelection?.headerIndeterminate,
    rowSelection?.headerChecked,
    data.length,
  ]);

  const colCount = columns.length + (rowSelection ? 1 : 0);

  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-md">
      <table className="w-full text-sm text-gray-700 border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
          <tr>
            {rowSelection && (
              <th className="w-12 px-3 py-4 align-middle">
                <input
                  ref={headerSelectRef}
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={rowSelection.headerChecked}
                  onChange={rowSelection.onToggleHeader}
                  aria-label="Select all rows on this page"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={`${String(col.accessor)}-${col.header}`}
                className={`px-5 py-4 font-medium text-gray-600 uppercase tracking-wider text-left ${
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
                className="text-center py-6 text-gray-400 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                className={`transition-colors duration-200 ${
                  rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50`}
              >
                {rowSelection && (
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={rowSelection.isRowSelected(row)}
                      onChange={() => rowSelection.onToggleRow(row)}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const value = row[col.accessor as keyof T];
                  const cellExtra = col.cellClassName?.(value, row);
                  return (
                    <td
                      key={`${rowIndex}-${String(col.accessor)}`}
                      className={`px-5 py-3 align-middle ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      } ${cellExtra ?? ""}`}
                    >
                      {col.render
                        ? col.render(value, row)
                        : typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
