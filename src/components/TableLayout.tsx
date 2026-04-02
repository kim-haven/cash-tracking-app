import React, { useEffect, useRef, type ReactNode } from "react";

function twoLineHeader(line1: string, line2: string): ReactNode {
  return (
    <span className="inline-block leading-snug">
      <span className="block">{line1}</span>
      <span className="block">{line2}</span>
    </span>
  );
}

/**
 * Shortens wide headers: text after ":" on a second line, or a trailing "(…)" clause
 * on a second line (e.g. "TOTAL CASH BACK" / "(ON RECEIPT)").
 */
function formatColumnHeader(header: string): ReactNode {
  const colonIdx = header.indexOf(":");
  if (colonIdx >= 0) {
    const afterColon = header.slice(colonIdx + 1).trim();
    if (afterColon) {
      return twoLineHeader(header.slice(0, colonIdx + 1).trimEnd(), afterColon);
    }
  }

  const parenMatch = header.match(/^(.*?)\s+(\([^)]+\))\s*$/);
  if (parenMatch) {
    const line1 = parenMatch[1].trim();
    const line2 = parenMatch[2].trim();
    if (line1 && line2) {
      return twoLineHeader(line1, line2);
    }
  }

  return header;
}

function headerUsesMultilineBreak(header: string): boolean {
  const colonIdx = header.indexOf(":");
  if (colonIdx >= 0 && header.slice(colonIdx + 1).trim().length > 0) {
    return true;
  }
  const parenMatch = header.match(/^(.*?)\s+(\([^)]+\))\s*$/);
  return !!(
    parenMatch &&
    parenMatch[1].trim().length > 0 &&
    parenMatch[2].trim().length > 0
  );
}

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

/** Top header row: each entry spans `colSpan` columns (must sum to `columns.length`). */
export type TableHeaderGroup = {
  label: string;
  colSpan: number;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowSelection?: RowSelectionConfig<T>;
  getRowKey?: (row: T, index: number) => React.Key;
  /** Optional first header tier (e.g. grouped column labels). */
  headerGroups?: TableHeaderGroup[];
};

function Table<T extends object>({
  data,
  columns,
  emptyMessage = "No data available",
  rowSelection,
  getRowKey,
  headerGroups,
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

  const groupSpanSum =
    headerGroups?.reduce((s, g) => s + g.colSpan, 0) ?? 0;
  const groupsValid =
    headerGroups &&
    headerGroups.length > 0 &&
    groupSpanSum === columns.length;

  /** Column indices where a new header group starts (vertical rule between sections). */
  const dividerBeforeColIndices: number[] = [];
  if (groupsValid && headerGroups!.length >= 2) {
    let acc = 0;
    for (let i = 0; i < headerGroups!.length - 1; i++) {
      acc += headerGroups![i].colSpan;
      dividerBeforeColIndices.push(acc);
    }
  }
  const sectionDividerClass = "border-l-[3px] border-cyan-500";

  return (
    <div className="max-w-full min-w-0 w-full overflow-x-auto overscroll-x-contain bg-white rounded-2xl border border-gray-200 shadow-md">
      <table className="w-full min-w-max text-sm text-gray-700 border-collapse table-auto">
        <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
          {groupsValid ? (
            <>
              <tr className="border-b border-gray-200 bg-gray-100">
                {rowSelection && (
                  <th
                    rowSpan={2}
                    className="w-12 border-b border-gray-200 bg-gray-100 px-3 py-3 align-middle"
                  >
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
                {headerGroups!.map((group, gi) => (
                  <th
                    key={group.label}
                    colSpan={group.colSpan}
                    scope="colgroup"
                    className={`border-b border-gray-200 px-5 py-3 text-center text-sm font-semibold tracking-wide text-gray-800 ${
                      gi > 0 ? sectionDividerClass : ""
                    }`}
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50">
                {columns.map((col, colIndex) => {
                  const wrapMultiline = headerUsesMultilineBreak(col.header);
                  const sectionEdge = dividerBeforeColIndices.includes(
                    colIndex
                  );
                  return (
                    <th
                      key={`${String(col.accessor)}-${col.header}`}
                      scope="col"
                      title={col.header}
                      aria-label={col.header}
                      className={`px-5 py-4 align-top font-medium text-gray-600 uppercase tracking-wider ${
                        wrapMultiline ? "whitespace-normal" : "whitespace-nowrap"
                      } ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      } ${sectionEdge ? sectionDividerClass : ""}`}
                    >
                      {formatColumnHeader(col.header)}
                    </th>
                  );
                })}
              </tr>
            </>
          ) : (
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
              {columns.map((col) => {
                const wrapMultiline = headerUsesMultilineBreak(col.header);
                return (
                  <th
                    key={`${String(col.accessor)}-${col.header}`}
                    scope="col"
                    title={col.header}
                    aria-label={col.header}
                    className={`px-5 py-4 align-top font-medium text-gray-600 uppercase tracking-wider ${
                      wrapMultiline ? "whitespace-normal" : "whitespace-nowrap"
                    } ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {formatColumnHeader(col.header)}
                  </th>
                );
              })}
            </tr>
          )}
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
                {columns.map((col, colIndex) => {
                  const value = row[col.accessor as keyof T];
                  const cellExtra = col.cellClassName?.(value, row);
                  const sectionEdge = dividerBeforeColIndices.includes(
                    colIndex
                  );
                  return (
                    <td
                      key={`${rowIndex}-${String(col.accessor)}`}
                      className={`px-5 py-3 align-middle ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      } ${sectionEdge ? sectionDividerClass : ""} ${cellExtra ?? ""}`}
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
