import React, { useEffect, useMemo, useState } from "react";
import { fetchDailySummaries } from "../../api/cashTrackApi";
import { fetchAllExpenses } from "../../api/expensesApi";
import {
  buildExpensesInOutSumByDate,
  filterCashTrackBySummaryScope,
  ymdKeyFromDateString,
  type SummaryScope,
} from "../../utils/cashOnHandShared";
import { useStore } from "../../context/StoreContext";

type Props = {
  summaryScope?: SummaryScope;
};

const ExpenseWidget: React.FC<Props> = ({ summaryScope = "all" }) => {
  const { selectedPhysicalStoreId } = useStore();
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cashFmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchDailySummaries(selectedPhysicalStoreId),
      fetchAllExpenses(selectedPhysicalStoreId).catch(() => []),
    ])
      .then(([rows, expenses]) => {
        const expenseRows = Array.isArray(expenses)
          ? (expenses as Record<string, unknown>[])
          : [];
        const byDate = buildExpensesInOutSumByDate(expenseRows);
        const scoped = filterCashTrackBySummaryScope(rows, summaryScope);
        const sum = scoped.reduce((acc, row) => {
          const key = ymdKeyFromDateString(row.date);
          const day = key ? (byDate.get(key) ?? 0) : 0;
          return acc + day;
        }, 0);
        setTotal(sum);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [summaryScope, selectedPhysicalStoreId]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
      <h3 className="text-sm text-gray-500 dark:text-gray-400">Expenses</h3>
      {error ? (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : loading ? (
        <p className="mt-2 text-3xl font-bold text-gray-400 dark:text-gray-500">
          …
        </p>
      ) : (
        <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
          {cashFmt.format(total ?? 0)}
        </p>
      )}
      <p className="mt-2 text-xs text-red-500 dark:text-red-400/90">
        Total Expenses
      </p>
    </div>
  );
};

export default ExpenseWidget;
