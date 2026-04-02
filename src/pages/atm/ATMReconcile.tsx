// src/pages/CashlessATMReconcile.tsx
import React, { useMemo, useState } from "react";
import { ATMReconcileData } from "../../data/ATMReconcileData";
import type { ATMReconcileItem } from "../../data/ATMReconcileData";
import { formatATMReconcileDate } from "../../data/ATMReconcileData";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const CashlessATMReconcile: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return ATMReconcileData;
    return ATMReconcileData.filter((item) => {
      const cashBackStr =
        item.sumAtmCashback == null ? "" : String(item.sumAtmCashback);
      return (
        item.dateColA.toLowerCase().includes(term) ||
        item.dateColH.toLowerCase().includes(term) ||
        formatATMReconcileDate(item.dateColA)
          .toLowerCase()
          .includes(term) ||
        formatATMReconcileDate(item.dateColH)
          .toLowerCase()
          .includes(term) ||
        String(item.sumDebitTotalSales).includes(term) ||
        String(item.sumBlazeSales).includes(term) ||
        String(item.variancePercent).includes(term) ||
        String(item.differenceDollars).includes(term) ||
        String(item.sumAtmTendered).includes(term) ||
        String(item.sumAtmChangeDue).includes(term) ||
        cashBackStr.includes(term) ||
        String(item.id).includes(term)
      );
    });
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const moneyFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const columns: Column<ATMReconcileItem>[] = [
    {
      header: "Date (Col A)",
      accessor: "dateColA",
      render: (_v, row) => (
        <span className="tabular-nums">{formatATMReconcileDate(row.dateColA)}</span>
      ),
    },
    {
      header: "SUM of Debit: Total Sales",
      accessor: "sumDebitTotalSales",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "SUM of Blaze: Sales",
      accessor: "sumBlazeSales",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Variance (%)",
      accessor: "variancePercent",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {Number(value).toFixed(2)}%
        </span>
      ),
      align: "right",
    },
    {
      header: "Difference ($)",
      accessor: "differenceDollars",
      render: (value) => {
        const n = Number(value);
        const neg = n < 0;
        return (
          <span
            className={`font-medium tabular-nums ${
              neg ? "text-red-600" : n > 0 ? "text-green-600" : "text-gray-700"
            }`}
          >
            {moneyFmt.format(n)}
          </span>
        );
      },
      align: "right",
    },
    {
      header: "Date (Col H)",
      accessor: "dateColH",
      render: (_v, row) => (
        <span className="tabular-nums">{formatATMReconcileDate(row.dateColH)}</span>
      ),
    },
    {
      header: "SUM of ATM Tendered",
      accessor: "sumAtmTendered",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "SUM of ATM Change Due",
      accessor: "sumAtmChangeDue",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "SUM of ATM Cashback",
      accessor: "sumAtmCashback",
      render: (value) =>
        value == null ? (
          <span className="text-gray-400">—</span>
        ) : (
          <span className="font-medium tabular-nums">
            {moneyFmt.format(Number(value))}
          </span>
        ),
      align: "right",
    },
  ];

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
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <TableLayout
        data={currentRows}
        columns={columns}
        emptyMessage="No records found"
        getRowKey={(row) => row.id}
        headerGroups={[
          { label: "Cashless ATM Summary", colSpan: 5 },
          { label: "Blaze Accounting Summary", colSpan: 4 },
        ]}
      />

      <Pagination
        totalPages={totalPages}
        currentPage={safeCurrentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CashlessATMReconcile;
