import React from "react";

export type Column<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: "left" | "center" | "right"; // New: alignment for columns
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
};

function Table<T extends object>({
  data,
  columns,
  emptyMessage = "No data available",
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-md">
      <table className="w-full text-sm text-gray-700 border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
          <tr>
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
                colSpan={columns.length}
                className="text-center py-6 text-gray-400 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`transition-colors duration-200 ${
                  rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50`}
              >
                {columns.map((col) => {
                  const value = row[col.accessor as keyof T];
                  return (
                    <td
                      key={`${rowIndex}-${String(col.accessor)}`}
                      className={`px-5 py-3 align-middle ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left"
                      }`}
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