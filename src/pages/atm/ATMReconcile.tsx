// src/pages/CashlessATMReconcile.tsx
import React, { useState } from "react";
import { ATMReconcileData } from "../../data/ATMReconcileData";
import type { ATMReconcileItem } from "../../data/ATMReconcileData";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const CashlessATMReconcile: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Filter data
  const filteredData = ATMReconcileData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.terminal.toLowerCase().includes(term) ||
      item.notes.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const columns: Column<ATMReconcileItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Terminal", accessor: "terminal" },
    {
      header: "Debit Terminal Total Dispensed",
      accessor: "debitTerminalTotalDispensed",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total Tips",
      accessor: "totalTips",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Debit Total Sales",
      accessor: "debitTotalSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total Cashback (On Receipt)",
      accessor: "totalCashbackOnReceipt",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Blaze Total Cashless Sales",
      accessor: "blazeTotalCashlessSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cashless ATM Change (On Blaze)",
      accessor: "cashlessATMChangeOnBlaze",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total Sales Difference",
      accessor: "totalSalesDifference",
      render: (value) => (
        <span className={`font-medium ${Number(value) < 0 ? "text-red-500" : "text-green-600"}`}>
          {Number(value) < 0 ? `-${Math.abs(Number(value))}` : Number(value)}
        </span>
      ),
      align: "right",
    },
    {
      header: "Cashback Difference",
      accessor: "cashbackDifference",
      render: (value) => <span className="font-medium">{value}</span>,
      align: "right",
    },
    { header: "Notes", accessor: "notes" },
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex justify-end py-4">
        <SearchBar
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-700">Cashless ATM Reconciliation</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No records found" />

      {/* Pagination */}
      <Pagination
        totalPages={totalPages}
        currentPage={safeCurrentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default CashlessATMReconcile;