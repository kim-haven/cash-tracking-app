import React, { useState } from "react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { posData } from "../../data/POSReconcileData";
import type { POSReconcileItem } from "../../data/POSReconcileData";

const POSReconcile: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter data
  const filteredData = posData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.controller.toLowerCase().includes(term) ||
      item.notes.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const columns: Column<POSReconcileItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Controller", accessor: "controller" },
    {
      header: "Cash In",
      accessor: "cashIn",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cash Refunds",
      accessor: "cashRefunds",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cashless ATM Cash Back",
      accessor: "cashlessAtmCashBack",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Reported Cash Collected",
      accessor: "reportedCashCollected",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cash Collected",
      accessor: "cashCollected",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cash Difference",
      accessor: "cashDifference",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Credit Difference",
      accessor: "creditDifference",
      render: (value) => <span className="text-blue-600 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cashless ATM Difference",
      accessor: "cashlessAtmDifference",
      render: (value) => <span className="text-purple-600 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cash vs Cashless ATM Difference",
      accessor: "cashVsCashlessAtmDifference",
      render: (value) => <span className="font-bold text-gray-700">${value}</span>,
      align: "right",
    },
    { header: "Reason/Notes", accessor: "notes" },
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

      <h2 className="text-lg font-semibold text-gray-700">POS Reconciliation</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No records found" />

      {/* Pagination */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default POSReconcile;