// src/pages/DroptSafe.tsx
import React, { useState } from "react";
import { dropSafeData } from "../../data/DropSafeData";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const DroptSafe: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Filter records based on search term
  const filteredData = dropSafeData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.bagNumber.toLowerCase().includes(term) ||
      item.preparedBy.toLowerCase().includes(term) ||
      item.givenBy.toLowerCase().includes(term) ||
      item.receivedBy.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  type DroptSafeItem = typeof dropSafeData[0];

  const columns: Column<DroptSafeItem>[] = [
    { header: "Bag#", accessor: "bagNumber" },
    { header: "Date Prepared", accessor: "datePrepared" },
    { header: "Time Prepared", accessor: "timePrepared" },
    { header: "Prepared By", accessor: "preparedBy" },
    {
      header: "Amount Prepared",
      accessor: "amountPrepared",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    { header: "Date Given", accessor: "dateGiven" },
    { header: "Time Given", accessor: "timeGiven" },
    { header: "Given By", accessor: "givenBy" },
    { header: "Received By", accessor: "receivedBy" },
    {
      header: "Amount Received",
      accessor: "amountReceived",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
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

      <h2 className="text-lg font-semibold text-gray-700">Dropt Safe Summary</h2>

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

export default DroptSafe;