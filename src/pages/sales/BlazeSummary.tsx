// src/pages/BlazeSummary.tsx
import React, { useState } from "react";
import { blazeSummaryData } from "../../data/BlazeSummaryData";
import type { BlazeSummaryItem } from "../../data/BlazeSummaryData";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const BlazeSummary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  // Filter data
  const filteredData = blazeSummaryData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.shop.toLowerCase().includes(term) ||
      item.company.toLowerCase().includes(term) ||
      item.queueType.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const columns: Column<BlazeSummaryItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Shop", accessor: "shop" },
    { header: "Company", accessor: "company" },
    { header: "Queue Type", accessor: "queueType" },
    {
      header: "Adult Retail Value of Sales",
      accessor: "adultRetailValueOfSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Medical Retail Value of Sales",
      accessor: "medicalRetailValueOfSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Non-Cannabis Retail Value of Sales",
      accessor: "nonCannabisRetailValueOfSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Retail Value of Sales",
      accessor: "retailValueOfSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Adult Gross Sales",
      accessor: "adultGrossSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Medical Gross Sales",
      accessor: "medicalGrossSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Non-Cannabis Gross Sales",
      accessor: "nonCannabisGrossSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Gross Sales",
      accessor: "grossSales",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Action",
      accessor: "action",
      render: () => (
        <button
          onClick={() => alert("View Details")}
          className="text-blue-600 hover:underline"
        >
          View Details
        </button>
      ),
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

      <h2 className="text-lg font-semibold text-gray-700">Blaze Sales Summary</h2>

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

export default BlazeSummary;