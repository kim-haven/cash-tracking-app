import React, { useEffect, useMemo, useState } from "react";
import { fetchDailySummaries } from "../../api/cashTrackApi";
import {
  filterCashTrackBySummaryScope,
  type SummaryScope,
} from "../../utils/cashOnHandShared";
import { useStore } from "../../context/StoreContext";

type Props = {
  summaryScope?: SummaryScope;
};

const DepositWidget: React.FC<Props> = ({ summaryScope = "all" }) => {
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
    fetchDailySummaries(selectedPhysicalStoreId)
      .then((rows) => {
        const scoped = filterCashTrackBySummaryScope(rows, summaryScope);
        const sum = scoped.reduce(
          (acc, r) => acc + Number(r.deposit ?? 0),
          0
        );
        setTotal(sum);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [summaryScope, selectedPhysicalStoreId]);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-sm text-gray-500">Deposit</h3>
      {error ? (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      ) : loading ? (
        <p className="mt-2 text-3xl font-bold text-gray-400">…</p>
      ) : (
        <p className="mt-2 text-3xl font-bold text-green-600">
          {cashFmt.format(total ?? 0)}
        </p>
      )}
      <p className="text-xs text-green-600 mt-2">
        Total deposit (daily summaries)
      </p>
    </div>
  );
};

export default DepositWidget;
