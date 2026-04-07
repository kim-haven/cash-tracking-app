// src/pages/BlazeSummary.tsx
import React, { useEffect, useMemo, useState } from "react";
import { blazeSummaryColumnSpecs, formatBlazeSummaryDate } from "../../data/BlazeSummaryData";
import type { BlazeSummaryItem } from "../../data/BlazeSummaryData";
import { fetchAllBlazeAccountingSummaries } from "../../api/blazeAccountingSummaryApi";
import { useStore } from "../../context/StoreContext";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

function rowMatchesSearch(item: BlazeSummaryItem, term: string): boolean {
  if (!term) return true;
  const t = term.toLowerCase();
  if (String(item.id).includes(t)) return true;
  for (const spec of blazeSummaryColumnSpecs) {
    const v = item[spec.accessor];
    if (v == null) continue;
    if (String(v).toLowerCase().includes(t)) return true;
    if (spec.accessor === "date" && item.date) {
      if (formatBlazeSummaryDate(item.date).toLowerCase().includes(t)) {
        return true;
      }
    }
  }
  return false;
}

const BlazeSummary: React.FC = () => {
  const { selectedPhysicalStoreId } = useStore();
  const [items, setItems] = useState<BlazeSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchAllBlazeAccountingSummaries(selectedPhysicalStoreId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Failed to load blaze accounting summaries"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPhysicalStoreId]);

  const filteredData = useMemo(
    () =>
      items.filter((item) =>
        rowMatchesSearch(item, searchTerm.toLowerCase().trim())
      ),
    [items, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const columns: Column<BlazeSummaryItem>[] = useMemo(() => {
    const moneyFmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return blazeSummaryColumnSpecs.map((spec) => {
      const { header, accessor, kind } = spec;
      if (kind === "text") {
        if (accessor === "date") {
          return {
            header,
            accessor,
            render: (value) => (
              <span className="tabular-nums">
                {formatBlazeSummaryDate(String(value ?? ""))}
              </span>
            ),
          } as Column<BlazeSummaryItem>;
        }
        return {
          header,
          accessor,
          render: (value) => (
            <span className="tabular-nums">{String(value ?? "")}</span>
          ),
        } as Column<BlazeSummaryItem>;
      }
      if (kind === "int") {
        return {
          header,
          accessor,
          align: "right" as const,
          render: (value) => (
            <span className="font-medium tabular-nums">
              {Math.round(Number(value)).toLocaleString("en-US")}
            </span>
          ),
        } as Column<BlazeSummaryItem>;
      }
      return {
        header,
        accessor,
        align: "right" as const,
        render: (value) => (
          <span className="font-medium tabular-nums">
            {moneyFmt.format(Number(value))}
          </span>
        ),
      } as Column<BlazeSummaryItem>;
    });
  }, []);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-gray-700">
          Blaze Accounting Summary
        </h2>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {loadError && (
        <div
          className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-gray-500">
          Loading blaze accounting summaries…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No records found"
          getRowKey={(row) => row.id}
        />
      )}

      {!loading && (
        <Pagination
          totalPages={totalPages}
          currentPage={safeCurrentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default BlazeSummary;
