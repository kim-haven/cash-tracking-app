import React, { useState } from "react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

// Example mock data
const tipsData = [
  {
    initials: "AB",
    cashTipAmount: 50,
    endOfPayPeriodTotal: 500,
    cashBalance: 150,
    date: "2026-03-28",
    cashTip: 20,
    creditTips: 10,
    achTips: 5,
    debitTips: 15,
    total: 50,
    note: "Great week",
  },
  {
    initials: "CD",
    cashTipAmount: 30,
    endOfPayPeriodTotal: 450,
    cashBalance: 120,
    date: "2026-03-28",
    cashTip: 10,
    creditTips: 10,
    achTips: 5,
    debitTips: 5,
    total: 30,
    note: "Regular tips",
  },
];

const Tips: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter
  const filteredData = tipsData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.initials.toLowerCase().includes(term) ||
      item.note.toLowerCase().includes(term) ||
      item.date.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  type TipItem = typeof tipsData[0];

  const columns: Column<TipItem>[] = [
    { header: "Initials", accessor: "initials" },
    {
      header: "Cash Tip Amount",
      accessor: "cashTipAmount",
      render: (value) => <span className="font-medium">${value}</span>,
    },
    {
      header: "End of Pay Period Total",
      accessor: "endOfPayPeriodTotal",
      render: (value) => <span className="font-medium">${value}</span>,
    },
    {
      header: "Cash Balance",
      accessor: "cashBalance",
      render: (value) => <span className="font-medium">${value}</span>,
    },
    { header: "Date", accessor: "date" },
    {
      header: "Cash tip",
      accessor: "cashTip",
      render: (value) => <span className="text-green-600 font-medium">${value}</span>,
    },
    {
      header: "Credit tips",
      accessor: "creditTips",
      render: (value) => <span className="text-blue-600 font-medium">${value}</span>,
    },
    {
      header: "Ach tips",
      accessor: "achTips",
      render: (value) => <span className="text-purple-600 font-medium">${value}</span>,
    },
    {
      header: "Debit tips",
      accessor: "debitTips",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
    },
    {
      header: "Total",
      accessor: "total",
      render: (value) => <span className="font-bold text-gray-700">${value}</span>,
    },
    { header: "NOTE", accessor: "note" },
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

      <h2 className="text-lg font-semibold text-gray-700">Tips Summary</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No tips found" />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Tips;