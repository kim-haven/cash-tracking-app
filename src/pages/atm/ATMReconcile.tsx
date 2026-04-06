import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CashlessAtmReconciliationItem } from "../../data/ATMReconcileData";
import { formatATMReconcileDate } from "../../data/ATMReconcileData";
import { fetchCashlessAtmReconciliation } from "../../api/cashlessAtmReconciliationApi";
import {
  aggregateDebitTotalSalesByDate,
  fetchAllCashlessAtmEntries,
} from "../../api/cashlessAtmApi";
import {
  aggregateCashlessAtmBasByDate,
  fetchAllBlazeAccountingSummaries,
  type BasCashlessAtmDailyTotals,
} from "../../api/blazeAccountingSummaryApi";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const PER_PAGE = 50;

type BasPivotRow = {
  date: string;
  sumTendered: number;
  sumChangeDue: number;
  sumCashback: number;
};

/** Σ cashless_atm_tendered − Σ cashless_atm_change_due for the date (BAS pivot). */
function blazeNetSalesFromPivot(
  date: string,
  basByDate: Map<string, BasCashlessAtmDailyTotals>
): number {
  const b = basByDate.get(date);
  if (!b) return 0;
  return b.sumTendered - b.sumChangeDue;
}

function variancePercentBlazeVsDebit(
  debit: number,
  blazeNet: number
): string | null {
  if (blazeNet === 0) return null;
  const pct = ((blazeNet - debit) / blazeNet) * 100;
  return pct.toFixed(2);
}

function differenceDebitMinusBlaze(debit: number, blazeNet: number): number {
  return debit - blazeNet;
}

/** Σ debit_total_sales on cashless_atm_entries for the date (entry lines summed). */
function debitTotalSalesFromPivot(
  date: string,
  debitByDate: Map<string, number>
): number {
  return debitByDate.get(date) ?? 0;
}

function rowMatchesSearch(
  item: CashlessAtmReconciliationItem,
  term: string,
  basByDate: Map<string, BasCashlessAtmDailyTotals>,
  basReady: boolean,
  debitByDate: Map<string, number>,
  debitReady: boolean
): boolean {
  if (!term) return true;
  const t = term.toLowerCase();
  const debit = debitReady
    ? debitTotalSalesFromPivot(item.date, debitByDate)
    : item.sumDebitTotalSales;
  const blazeNet = basReady
    ? blazeNetSalesFromPivot(item.date, basByDate)
    : item.sumBlazeSales;
  const varianceStr = variancePercentBlazeVsDebit(debit, blazeNet);
  const diffVal = differenceDebitMinusBlaze(debit, blazeNet);

  if (
    item.date.toLowerCase().includes(t) ||
    formatATMReconcileDate(item.date).toLowerCase().includes(t) ||
    String(debit).includes(t) ||
    String(blazeNet).includes(t) ||
    (varianceStr != null && varianceStr.toLowerCase().includes(t)) ||
    String(diffVal).includes(t)
  ) {
    return true;
  }
  const b = basByDate.get(item.date);
  if (!b) return false;
  return (
    String(b.sumTendered).includes(t) ||
    String(b.sumChangeDue).includes(t) ||
    String(b.sumCashback).includes(t)
  );
}

const CashlessATMReconcile: React.FC = () => {
  const [rows, setRows] = useState<CashlessAtmReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastPage, setLastPage] = useState(1);

  const [basByDate, setBasByDate] = useState<
    Map<string, BasCashlessAtmDailyTotals>
  >(() => new Map());
  const [basLoadError, setBasLoadError] = useState<string | null>(null);
  const [basReady, setBasReady] = useState(false);

  const [debitByDate, setDebitByDate] = useState<Map<string, number>>(
    () => new Map()
  );
  const [debitLoadError, setDebitLoadError] = useState<string | null>(null);
  const [debitReady, setDebitReady] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setBasLoadError(null);
    setDebitLoadError(null);
    setBasReady(false);
    setDebitReady(false);

    void (async () => {
      const results = await Promise.allSettled([
        fetchAllBlazeAccountingSummaries(),
        fetchAllCashlessAtmEntries(),
      ]);
      if (cancelled) return;

      const blazeResult = results[0];
      if (blazeResult.status === "fulfilled") {
        setBasByDate(aggregateCashlessAtmBasByDate(blazeResult.value));
        setBasLoadError(null);
      } else {
        setBasByDate(new Map());
        setBasLoadError(
          blazeResult.reason instanceof Error
            ? blazeResult.reason.message
            : "Failed to load Blaze accounting summaries"
        );
      }

      const cashlessResult = results[1];
      if (cashlessResult.status === "fulfilled") {
        setDebitByDate(aggregateDebitTotalSalesByDate(cashlessResult.value));
        setDebitLoadError(null);
      } else {
        setDebitByDate(new Map());
        setDebitLoadError(
          cashlessResult.reason instanceof Error
            ? cashlessResult.reason.message
            : "Failed to load cashless ATM entries"
        );
      }

      setBasReady(true);
      setDebitReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadPage = useCallback(async (page: number) => {
    setLoadError(null);
    try {
      const { rows: data, meta } = await fetchCashlessAtmReconciliation(
        page,
        PER_PAGE
      );
      setRows(data);
      setLastPage(meta.last_page);
      setCurrentPage(meta.current_page);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load cashless ATM reconciliation"
      );
      setRows([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPage(1).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const onPageChange = useCallback(
    (page: number) => {
      setLoading(true);
      loadPage(page).finally(() => setLoading(false));
    },
    [loadPage]
  );

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return rows;
    return rows.filter((item) =>
      rowMatchesSearch(item, term, basByDate, basReady, debitByDate, debitReady)
    );
  }, [rows, searchTerm, basByDate, basReady, debitByDate, debitReady]);

  const basPivotRows: BasPivotRow[] = useMemo(() => {
    return filteredRows.map((r) => {
      const b = basByDate.get(r.date) ?? {
        sumTendered: 0,
        sumChangeDue: 0,
        sumCashback: 0,
      };
      return {
        date: r.date,
        sumTendered: b.sumTendered,
        sumChangeDue: b.sumChangeDue,
        sumCashback: b.sumCashback,
      };
    });
  }, [filteredRows, basByDate]);

  const moneyFmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const reconcileColumns: Column<CashlessAtmReconciliationItem>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "date",
        render: (value) => (
          <span className="tabular-nums">
            {formatATMReconcileDate(String(value ?? ""))}
          </span>
        ),
      },
      {
        header: "SUM of Debit: Total Sales",
        accessor: "sumDebitTotalSales",
        render: (_value, row) => {
          const debit = debitReady
            ? debitTotalSalesFromPivot(row.date, debitByDate)
            : row.sumDebitTotalSales;
          return (
            <span
              className="font-medium tabular-nums"
              title={
                debitReady
                  ? "Σ debit_total_sales on cashless_atm_entries for this date"
                  : undefined
              }
            >
              {moneyFmt.format(debit)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "SUM of Blaze: Sales",
        accessor: "sumBlazeSales",
        render: (_value, row) => {
          const blazeNet = basReady
            ? blazeNetSalesFromPivot(row.date, basByDate)
            : row.sumBlazeSales;
          return (
            <span
              className="font-medium tabular-nums"
              title={
                basReady
                  ? "Σ cashless ATM tendered − Σ cashless ATM change due (blaze_accounting_summary by date)"
                  : undefined
              }
            >
              {moneyFmt.format(blazeNet)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Variance (%)",
        accessor: "variancePercent",
        render: (_value, row) => {
          const debit = debitReady
            ? debitTotalSalesFromPivot(row.date, debitByDate)
            : row.sumDebitTotalSales;
          const blazeNet = basReady
            ? blazeNetSalesFromPivot(row.date, basByDate)
            : row.sumBlazeSales;
          const vp = variancePercentBlazeVsDebit(debit, blazeNet);
          return vp == null ? (
            <span className="text-gray-400">—</span>
          ) : (
            <span className="font-medium tabular-nums">{vp}%</span>
          );
        },
        align: "right",
      },
      {
        header: "Difference ($)",
        accessor: "difference",
        render: (_value, row) => {
          const debit = debitReady
            ? debitTotalSalesFromPivot(row.date, debitByDate)
            : row.sumDebitTotalSales;
          const blazeNet = basReady
            ? blazeNetSalesFromPivot(row.date, basByDate)
            : row.sumBlazeSales;
          const n = differenceDebitMinusBlaze(debit, blazeNet);
          const neg = n < 0;
          return (
            <span
              className={`font-medium tabular-nums ${
                neg ? "text-red-600" : n > 0 ? "text-green-600" : "text-gray-700"
              }`}
              title={
                debitReady && basReady
                  ? "Σ debit_total_sales (entries) − (Blaze tendered − Blaze change due); positive = debit higher"
                  : "Uses API totals until both pivots finish loading"
              }
            >
              {moneyFmt.format(n)}
            </span>
          );
        },
        align: "right",
      },
    ],
    [moneyFmt, basByDate, basReady, debitByDate, debitReady]
  );

  const basPivotColumns: Column<BasPivotRow>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "date",
        render: (value) => (
          <span className="tabular-nums">
            {formatATMReconcileDate(String(value ?? ""))}
          </span>
        ),
      },
      {
        header: "Tendered: Cashless ATM",
        accessor: "sumTendered",
        render: (value) => (
          <span className="font-medium tabular-nums">
            {moneyFmt.format(Number(value))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Change due: Cashless ATM",
        accessor: "sumChangeDue",
        render: (value) => (
          <span className="font-medium tabular-nums">
            {moneyFmt.format(Number(value))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Cashback: Cashless ATM",
        accessor: "sumCashback",
        render: (value) => (
          <span className="font-medium tabular-nums">
            {moneyFmt.format(Number(value))}
          </span>
        ),
        align: "right",
      },
    ],
    [moneyFmt]
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-gray-700">
          Cashless ATM Reconciliation
        </h2>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
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
          Loading reconciliation…
        </div>
      ) : (
        <>
          {(basLoadError || debitLoadError) && (
            <div
              className="mb-2 space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              role="status"
            >
              {basLoadError && <p>{basLoadError}</p>}
              {debitLoadError && <p>{debitLoadError}</p>}
            </div>
          )}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
            <div className="flex min-w-0 flex-col lg:flex-row lg:items-stretch">
              <div className="min-w-0 flex-1 basis-0 lg:flex-[1.15]">
                <TableLayout
                  className="rounded-none border-0 shadow-none"
                  tableWidth="stretch"
                  data={filteredRows}
                  columns={reconcileColumns}
                  emptyMessage="No records found"
                  getRowKey={(row) => row.date}
                  headerGroups={[
                    {
                      label: "Cashless vs Blaze",
                      colSpan: 5,
                      headerClassName: "bg-gray-100",
                    },
                  ]}
                />
              </div>

              <div
                className="hidden w-1 shrink-0 self-stretch bg-gray-900 lg:block"
                aria-hidden
              />

              <div className="min-w-0 flex-1 basis-0 border-t border-gray-200 lg:flex-[0.85] lg:border-t-0">
                <TableLayout
                  className="rounded-none border-0 shadow-none"
                  tableWidth="stretch"
                  data={basPivotRows}
                  columns={basPivotColumns}
                  emptyMessage="No rows"
                  getRowKey={(row) => row.date}
                  headerGroups={[
                    {
                      label: "Blaze Accounting Summary Pivot",
                      colSpan: 4,
                      headerClassName: "bg-sky-100",
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && lastPage > 0 && (
        <Pagination
          totalPages={lastPage}
          currentPage={currentPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default CashlessATMReconcile;
