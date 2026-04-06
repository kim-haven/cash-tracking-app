import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { fetchDailySummaries } from "../../api/cashTrackApi";
import { fetchAllExpenses } from "../../api/expensesApi";
import { formatUsShortDate } from "../../utils/usShortDate";
import {
  ymdKeyFromDateString,
  compareRowDates,
  buildExpensesInOutSumByDate,
} from "../../utils/cashOnHandShared";

type Row = {
  name: string;
  expenses: number;
  deposit: number;
  /** deposit − expenses */
  difference: number;
};

const BarChart: React.FC = () => {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);
    Promise.all([
      fetchDailySummaries(),
      fetchAllExpenses().catch(() => []),
    ])
      .then(([summaries, expenses]) => {
        const expenseRows = Array.isArray(expenses)
          ? (expenses as Record<string, unknown>[])
          : [];
        const sumByDate = buildExpensesInOutSumByDate(expenseRows);
        const sorted = [...summaries].sort(compareRowDates);
        setData(
          sorted.map((row) => {
            const key = ymdKeyFromDateString(row.date);
            const exp = key ? sumByDate.get(key) ?? 0 : 0;
            const dep = Number(row.deposit ?? 0);
            const diff = dep - exp;
            return {
              name: formatUsShortDate(String(row.date ?? "")),
              expenses: exp,
              deposit: dep,
              difference: diff,
            };
          })
        );
      })
      .catch((err: unknown) =>
        setLoadError(
          err instanceof Error ? err.message : "Failed to load chart data"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const yTickFormatter = (v: number) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "";
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return cashFmt.format(n);
  };

  if (loadError) {
    return (
      <div className="text-sm text-red-600">{loadError}</div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-gray-500">
        No cash-on-hand data yet
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div>
        <h2 className="text-sm font-semibold text-gray-700">
          Deposit − expenses (per day)
        </h2>
        <p className="text-xs text-gray-500">
          Bar shows net; hover for expenses, deposit, and net.
        </p>
      </div>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <RechartsBarChart
            data={data}
            margin={{ top: 8, right: 8, left: 4, bottom: data.length > 8 ? 48 : 16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              interval={0}
              angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? "end" : "middle"}
              height={data.length > 6 ? 56 : 28}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#6B7280" }}
              tickFormatter={yTickFormatter}
              width={52}
            />
            <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: "rgba(243, 244, 246, 0.6)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as Row;
                return (
                  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
                    <div className="mb-1 font-medium text-gray-700">
                      {String(label)}
                    </div>
                    <div className="text-red-600">
                      Expenses: {cashFmt.format(row.expenses)}
                    </div>
                    <div className="text-green-700">
                      Deposit: {cashFmt.format(row.deposit)}
                    </div>
                    <div
                      className={
                        row.difference >= 0
                          ? "mt-1 border-t border-gray-100 pt-1 font-semibold text-green-800"
                          : "mt-1 border-t border-gray-100 pt-1 font-semibold text-red-800"
                      }
                    >
                      Net (dep − exp): {cashFmt.format(row.difference)}
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="difference"
              name="Deposit − expenses"
              radius={[2, 2, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`net-${index}`}
                  fill={entry.difference >= 0 ? "#16A34A" : "#DC2626"}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChart;
