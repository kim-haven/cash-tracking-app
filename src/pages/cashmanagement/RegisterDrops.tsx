import React, { useState } from "react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { registerDropsData } from "../../data/RegisterDropsData";
import type { RegisterDropItem } from "../../data/RegisterDropsData";

const RegisterDrops: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Filter data
  const filteredData = registerDropsData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.register.toLowerCase().includes(term) ||
      item.initials.toLowerCase().includes(term) ||
      item.notes.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const columns: Column<RegisterDropItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Register", accessor: "register" },
    { header: "Time Start", accessor: "timeStart" },
    { header: "Time End", accessor: "timeEnd" },
    { header: "Action", accessor: "action" },
    {
      header: "Cash In",
      accessor: "cashIn",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    { header: "Initials", accessor: "initials" },
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

      <h2 className="text-lg font-semibold text-gray-700">Register Drops</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No register drops found" />

      {/* Pagination */}
      <Pagination
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default RegisterDrops;