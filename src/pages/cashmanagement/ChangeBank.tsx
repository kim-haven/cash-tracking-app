// src/pages/ChangeBank.tsx
import React, { useState } from "react";
import { changeBankData } from "../../data/ChangeBankData";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const ChangeBank: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Filter data
  const filteredData = changeBankData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.notes.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  type ChangeBankItem = typeof changeBankData[0];

  const columns: Column<ChangeBankItem>[] = [
    { header: "Date", accessor: "date" },
    {
      header: "Count Amount",
      accessor: "countAmount",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Change In",
      accessor: "changeIn",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Change Out",
      accessor: "changeOut",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    { header: "Description", accessor: "description" },
    {
      header: "Deposit",
      accessor: "deposit",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Picked Up",
      accessor: "pickedUp",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Sum of Pickups",
      accessor: "sumOfPickups",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Balance",
      accessor: "balance",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Difference",
      accessor: "difference",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
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

      <h2 className="text-lg font-semibold text-gray-700">Change Bank Summary</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No records found" />

      {/* Pagination */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default ChangeBank;