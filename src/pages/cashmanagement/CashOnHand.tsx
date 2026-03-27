import React, { useState } from "react";
import { trackedData } from "../../data/trackedData";
import { Search } from "lucide-react";

const CashTrack: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // search state
  const rowsPerPage = 10;

  // ✅ Filter first, then paginate
  const filteredData = trackedData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.amController.toLowerCase().includes(term) ||
      item.pmController.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

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
      <div className="w-full flex justify-between items-center py-4 sticky top-0 z-20">
        <div className="hidden md:flex items-center bg-white px-3 py-2 rounded-lg w-80">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none ml-2 text-sm w-full"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // ✅ reset to first page on search
            }}
          />
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-700">
        Daily Financial Summary
      </h2>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">AM Controller</th>
              <th className="p-3 text-left">PM Controller</th>
              <th className="p-3 text-left">Register Drops</th>
              <th className="p-3 text-left">Expenses</th>
              <th className="p-3 text-left">Balance</th>
              <th className="p-3 text-left">Deposit</th>
              <th className="p-3 text-left">Courier</th>
              <th className="p-3 text-left">Final Balance</th>
            </tr>
          </thead>

          <tbody>
            {currentRows.map((item, index) => (
              <tr key={index} className="border-t hover:bg-gray-50">
                <td className="p-3">{item.date}</td>
                <td className="p-3">{item.amController}</td>
                <td className="p-3">{item.pmController}</td>
                <td className="p-3 font-medium">${item.registerDrops}</td>
                <td className="p-3 text-red-500 font-medium">${item.expenses}</td>
                <td className="p-3">${item.balance}</td>
                <td className="p-3 text-green-600 font-medium">${item.deposit}</td>
                <td className="p-3">{item.courier}</td>
                <td className="p-3 font-bold text-blue-600">${item.finalBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(1)}
            className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            &#9198;
          </button>

          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Prev
          </button>

          {(() => {
            const maxVisible = 5;
            let start = Math.max(currentPage - Math.floor(maxVisible / 2), 1);
            let end = start + maxVisible - 1;

            if (end > totalPages) {
              end = totalPages;
              start = Math.max(end - maxVisible + 1, 1);
            }

            return Array.from({ length: end - start + 1 }, (_, i) => {
              const page = start + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {page}
                </button>
              );
            });
          })()}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Next
          </button>

          <button
            onClick={() => setCurrentPage(totalPages)}
            className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            &#9197;
          </button>
        </div>
      </div>

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