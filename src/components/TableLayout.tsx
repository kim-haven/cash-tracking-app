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
  /** Extra classes on the group `<th>` (e.g. background). */
  headerClassName?: string;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  rowSelection?: RowSelectionConfig<T>;
  getRowKey?: (row: T, index: number) => React.Key;
  /** Optional first header tier (e.g. grouped column labels). */
  headerGroups?: TableHeaderGroup[];
  /** Merged onto the outer scroll/card wrapper (e.g. `rounded-none border-0 shadow-none`). */
  className?: string;
  /**
   * `auto` (default): `min-w-max` on the table (wide content can scroll horizontally).
   * `stretch`: table fills the wrapper width (better for side-by-side narrow panes).
   */
  tableWidth?: "auto" | "stretch";
};

function Table<T extends object>({
  data,
  columns,
  emptyMessage = "No data available",
  rowSelection,
  getRowKey,
  headerGroups,
  className: wrapperClassName,
  tableWidth = "auto",
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
  const sectionDividerClass =
    "border-l-[3px] border-cyan-500 dark:border-cyan-400";

  const tableClass =
    tableWidth === "stretch"
      ? "w-full min-w-0 max-w-full border-collapse text-sm text-gray-700 dark:text-gray-200 table-auto"
      : "w-full min-w-max border-collapse text-sm text-gray-700 dark:text-gray-200 table-auto";

  return (
    <div
      className={`max-w-full min-w-0 w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-200 bg-white shadow-md dark:border-slate-600/80 dark:bg-slate-900/90 dark:shadow-black/30 ${wrapperClassName ?? ""}`}
    >
      <table className={tableClass}>
        <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm dark:bg-slate-800/95 dark:shadow-slate-950/50">
          {groupsValid ? (
            <>
              <tr className="border-b border-gray-200 bg-gray-100 dark:border-slate-600 dark:bg-slate-800">
                {rowSelection && (
                  <th
                    rowSpan={2}
                    className="w-12 border-b border-gray-200 bg-gray-100 px-3 py-3 align-middle dark:border-slate-600 dark:bg-slate-800"
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
                    key={`hg-${gi}-${group.colSpan}`}
                    colSpan={group.colSpan}
                    scope="colgroup"
                    title={group.label.trim() ? group.label : undefined}
                    className={`overflow-hidden text-ellipsis whitespace-nowrap border-b border-gray-200 px-5 py-3 text-center text-sm font-semibold tracking-wide text-gray-800 dark:border-slate-600 dark:text-gray-100 ${
                      gi > 0 ? sectionDividerClass : ""
                    } ${group.headerClassName ?? ""}`}
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50 dark:bg-slate-800/90">
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
                      className={`px-5 py-4 align-top text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400 ${
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
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-800/95">
              {rowSelection && (
                <th className="w-12 px-3 py-4 align-middle">
                  <input
                    ref={headerSelectRef}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-900"
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
                    className={`px-5 py-4 align-top text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400 ${
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

        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
                className="bg-white py-6 text-center italic text-gray-400 dark:bg-slate-900 dark:text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                className={`transition-colors duration-200 ${
                  rowIndex % 2 === 0
                    ? "bg-white dark:bg-slate-900/40"
                    : "bg-gray-50 dark:bg-slate-800/40"
                } hover:bg-blue-50 dark:hover:bg-slate-700/50`}
              >
                {rowSelection && (
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-900"
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
