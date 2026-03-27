import React, { useState } from "react";
import { trackedData } from "../../data/trackedData";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";

const CashTrack: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const rowsPerPage = 10;

  // Filter first, then paginate
  const filteredData = trackedData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.amController.toLowerCase().includes(term) ||
      item.pmController.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  // Column Definition
  type CashItem = typeof trackedData[0];
  const columns: Column<CashItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "AM Controller", accessor: "amController" },
    { header: "PM Controller", accessor: "pmController" },
    {
      header: "Register Drops",
      accessor: "registerDrops",
      render: (value) => <span className="font-medium">${value}</span>,
      align: "right",
    },
    {
      header: "Expenses",
      accessor: "expenses",
      render: (value) => <span className="text-red-500 font-medium">${value}</span>,
      align: "right",
    },
    { header: "Balance", accessor: "balance", align: "right" },
    {
      header: "Deposit",
      accessor: "deposit",
      render: (value) => <span className="text-green-600 font-medium">${value}</span>,
      align: "right",
    },
    { header: "Courier", accessor: "courier" },
    {
      header: "Final Balance",
      accessor: "finalBalance",
      render: (value) => <span className="font-bold text-blue-600">${value}</span>,
      align: "right",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Drops</h3>
          <p className="text-2xl font-bold">
            ${filteredData.reduce((sum, item) => sum + item.registerDrops, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-500">
            ${filteredData.reduce((sum, item) => sum + item.expenses, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm">Total Deposit</h3>
          <p className="text-2xl font-bold text-green-600">
            ${filteredData.reduce((sum, item) => sum + item.deposit, 0)}
          </p>
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex justify-between items-center py-4">
        <SearchBar
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
        />
        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-700">Daily Financial Summary</h2>

      {/* Table */}
      <TableLayout data={currentRows} columns={columns} emptyMessage="No records found" />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Entry</h2>
            <p className="text-gray-500 text-sm mb-6">Coming soon 🚀</p>
            <div className="flex justify-end">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashTrack;