import React, { useState, useEffect, useMemo } from "react";
import {
  fetchDailySummaries,
  type CashTrackItem,
} from "../../api/cashTrackApi";
import { fetchAllExpenses } from "../../api/expensesApi";
import { formatUsShortDate } from "../../utils/usShortDate";

function ymdKeyFromDateString(dateStr: string): string | null {
  const iso = String(dateStr ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

function expenseCashInPlusOut(e: Record<string, unknown>): number {
  const cin = Number(e.cash_in ?? e.cashIn ?? 0);
  const cout = Number(e.cash_out ?? e.cashOut ?? 0);
  return cin + cout;
}

function expenseRowDateKey(e: Record<string, unknown>): string | null {
  return ymdKeyFromDateString(String(e.date ?? ""));
}

function buildExpensesInOutSumByDate(
  expenseApiRows: Record<string, unknown>[]
): Map<string, number> {
  const m = new Map<string, number>();
  for (const raw of expenseApiRows) {
    const key = expenseRowDateKey(raw);
    if (!key) continue;
    m.set(key, (m.get(key) ?? 0) + expenseCashInPlusOut(raw));
  }
  return m;
}

function calendarKeyFromRowDate(dateStr: string): number | null {
  const trimmed = String(dateStr ?? "").trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return (
      Number(iso[1]) * 10_000 + Number(iso[2]) * 100 + Number(iso[3])
    );
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return (
    d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate()
  );
}

function compareRowDates(a: CashTrackItem, b: CashTrackItem): number {
  const ka = calendarKeyFromRowDate(a.date);
  const kb = calendarKeyFromRowDate(b.date);
  if (ka === null && kb === null) return 0;
  if (ka === null) return 1;
  if (kb === null) return -1;
  return ka - kb;
}

type DataItem = {
  label: string;
  expenses: number;
  deposit: number;
};

const GraphChart: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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
            return {
              label: formatUsShortDate(String(row.date ?? "")),
              expenses: exp,
              deposit: dep,
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

  const cashFmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const width = 500;
  const height = 240;
  const padding = 40;

  const maxValue = Math.max(
    1,
    ...data.flatMap((d) => [d.expenses, d.deposit])
  );

  const xSpan = Math.max(1, data.length - 1);

  const getPoints = (key: "expenses" | "deposit") =>
    data.map((d, i) => {
      const x = padding + (i * (width - padding * 2)) / xSpan;
      const v = d[key];
      const y =
        height -
        padding -
        (v / maxValue) * (height - padding * 2);

      return { x, y, value: v, label: d.label };
    });

  const pointsExpenses = getPoints("expenses");
  const pointsDeposit = getPoints("deposit");

  let gapFillPath = "";
  if (pointsExpenses.length > 0) {
    const n = pointsExpenses.length;
    const top = pointsExpenses.map((pe, i) =>
      Math.min(pe.y, pointsDeposit[i].y)
    );
    const bot = pointsExpenses.map((pe, i) =>
      Math.max(pe.y, pointsDeposit[i].y)
    );
    const xs = pointsExpenses.map((p) => p.x);
    gapFillPath = `M ${xs[0]} ${top[0]}`;
    for (let i = 1; i < n; i++) gapFillPath += ` L ${xs[i]} ${top[i]}`;
    for (let i = n - 1; i >= 0; i--) gapFillPath += ` L ${xs[i]} ${bot[i]}`;
    gapFillPath += " Z";
  }

  const createPath = (points: typeof pointsExpenses) =>
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

  if (loadError) {
    return (
      <div className="w-full h-full text-sm text-red-600">{loadError}</div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        No cash-on-hand data yet
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Expenses vs deposit
        </h2>
        <span className="text-xs text-gray-400">Daily</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Shaded band is the dollar gap; hover a day for deposit − expenses.
      </p>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BFDBFE" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FECACA" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((_, i) => {
          const y =
            padding + (i * (height - padding * 2)) / 4;
          return (
            <line
              key={i}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#E5E7EB"
            />
          );
        })}

        <path
          d={gapFillPath}
          fill="url(#gapGradient)"
          stroke="none"
          opacity={0.9}
        />

        <path
          d={createPath(pointsExpenses)}
          fill="none"
          stroke="#EF4444"
          strokeWidth={2.5}
        />

        <path
          d={createPath(pointsDeposit)}
          fill="none"
          stroke="#16A34A"
          strokeWidth={2.5}
        />

        {data.map((row, i) => {
          const pe = pointsExpenses[i];
          const pd = pointsDeposit[i];
          const diff = row.deposit - row.expenses;
          const cx = pe.x;
          const cy = Math.min(pe.y, pd.y) - 8;
          const active = hoveredIndex === i;

          return (
            <g key={i}>
              <rect
                x={cx - (width - padding * 2) / xSpan / 2}
                y={padding}
                width={Math.max(
                  12,
                  (width - padding * 2) / Math.max(1, data.length - 1)
                )}
                height={height - padding * 2}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              <circle
                cx={pe.x}
                cy={pe.y}
                r={active ? 5 : 3}
                fill="#EF4444"
                className="pointer-events-none"
              />
              <circle
                cx={pd.x}
                cy={pd.y}
                r={active ? 5 : 3}
                fill="#16A34A"
                className="pointer-events-none"
              />

              {active && (
                <g className="pointer-events-none">
                  <rect
                    x={Math.min(width - 160, Math.max(8, cx - 78))}
                    y={Math.max(6, cy - 52)}
                    width={156}
                    height={48}
                    rx={6}
                    fill="white"
                    stroke="#E5E7EB"
                    strokeWidth={1}
                  />
                  <text
                    x={Math.min(width - 160, Math.max(8, cx - 78)) + 8}
                    y={Math.max(6, cy - 52) + 14}
                    fontSize="9"
                    fill="#6B7280"
                  >
                    {row.label}
                  </text>
                  <text
                    x={Math.min(width - 160, Math.max(8, cx - 78)) + 8}
                    y={Math.max(6, cy - 52) + 28}
                    fontSize="9"
                    fill="#EF4444"
                  >
                    Exp {cashFmt.format(row.expenses)}
                  </text>
                  <text
                    x={Math.min(width - 160, Math.max(8, cx - 78)) + 8}
                    y={Math.max(6, cy - 52) + 40}
                    fontSize="9"
                    fill="#16A34A"
                  >
                    Dep {cashFmt.format(row.deposit)} · Δ{" "}
                    <tspan
                      fontWeight="600"
                      fill={diff >= 0 ? "#15803D" : "#B91C1C"}
                    >
                      {cashFmt.format(diff)}
                    </tspan>
                  </text>
                </g>
              )}

              <text
                x={pe.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#6B7280"
              >
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded-full" />
          Expenses
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-600 rounded-full" />
          Deposit
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-sm border border-gray-300"
            style={{
              background:
                "linear-gradient(180deg, rgba(191,219,254,0.8), rgba(254,202,202,0.7))",
            }}
          />
          Gap between lines
        </div>
      </div>
    </div>
  );
};

export default GraphChart;
