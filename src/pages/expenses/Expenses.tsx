import React, { useState } from "react";
import { expensesData } from "../../data/ExpensesData";
import TableLayout from "../../components/TableLayout";  // Reusable Table Component
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const Expenses: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Filter data based on the search term
  const filteredData = expensesData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.paidBy.toLowerCase().includes(term) ||
      item.payTo.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  type ExpenseItem = typeof expensesData[0];

  // Column Definitions for Expenses Table
  const columns: Column<ExpenseItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Paid By", accessor: "paidBy" },
    { header: "Pay To", accessor: "payTo" },
    { header: "Approved By", accessor: "approvedBy" },
    { header: "Receipt Uploaded?", accessor: "receiptUploaded" },
    { header: "Type", accessor: "type" },
    { header: "Description", accessor: "description" },
    {
      header: "Cash In",
      accessor: "cashIn",
      render: (value) => <span className="font-medium">${value}</span>,
    },
    {
      header: "Cash Out",
      accessor: "cashOut",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex justify-end py-4">
        <SearchBar
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-700">Expenses Summary</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No expenses found" />

      {/* Pagination */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Expenses;