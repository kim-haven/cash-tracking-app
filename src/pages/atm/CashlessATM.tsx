import React, { useState } from "react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { cashlessATMData } from "../../data/CashlessATMData";

const CashlessATM: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredData = cashlessATMData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.editedDate.toLowerCase().includes(term) ||
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

  type CashlessATMItem = typeof cashlessATMData[0];

  const columns: Column<CashlessATMItem>[] = [
    { header: "Date Column C edited", accessor: "editedDate" },
    { header: "Date", accessor: "date" },
    { header: "Terminal", accessor: "terminal" },
    {
      header: "Debit Terminal: Total Dispensed",
      accessor: "debitTotalDispensed",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total Tips",
      accessor: "totalTips",
      render: (value) => <span className="text-green-600 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Debit: Total Sales",
      accessor: "debitTotalSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total cash back (On Receipt)",
      accessor: "totalCashBack",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Blaze: Total Cashless Sales",
      accessor: "blazeCashlessSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total Cashless ATM Change (ON BLAZE)",
      accessor: "totalCashlessATMChange",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Total Sales Difference",
      accessor: "totalSalesDifference",
      render: (value) => <span className="text-blue-600 font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Cashback Difference",
      accessor: "cashbackDifference",
      render: (value) => <span className="text-purple-600 font-medium">${value}</span>,
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

      <h2 className="text-lg font-semibold text-gray-700">Cashless ATM Summary</h2>

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

export default CashlessATM;