import React, { useState } from "react";
import { trackedData } from "../data/trackedData";
import { Search } from "lucide-react";


const CashTrack: React.FC = () => {
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // ✅ Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = trackedData.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(trackedData.length / rowsPerPage);

  return (
    <div className="space-y-6">
      {/* 🔥 Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-gray-500 text-sm">Total Drops</h3>
          <p className="text-2xl font-bold">
            ₱{trackedData.reduce((sum, item) => sum + item.registerDrops, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-gray-500 text-sm">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-500">
            ₱{trackedData.reduce((sum, item) => sum + item.expenses, 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-gray-500 text-sm">Total Deposit</h3>
          <p className="text-2xl font-bold text-green-600">
            ₱{trackedData.reduce((sum, item) => sum + item.deposit, 0)}
          </p>
        </div>
      </div>

    <div className="w-full flex justify-between items-center py-4 sticky top-0 z-20">
    {/* Search */}
      <div className="hidden md:flex items-center bg-white px-3 py-2 rounded-lg w-80">
        <Search size={16} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent outline-none ml-2 text-sm w-full"
        />
      </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Add
        </button>
    </div>

      {/* 🔥 Title */}
      <h2 className="text-lg font-semibold text-gray-700">
        Daily Financial Summary
      </h2>

      {/* 🔥 Table */}
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
                <td className="p-3 font-medium">₱{item.registerDrops}</td>
                <td className="p-3 text-red-500 font-medium">
                  ₱{item.expenses}
                </td>
                <td className="p-3">₱{item.balance}</td>
                <td className="p-3 text-green-600 font-medium">
                  ₱{item.deposit}
                </td>
                <td className="p-3">₱{item.courier}</td>
                <td className="p-3 font-bold text-blue-600">
                  ₱{item.finalBalance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    {/* 🔥 Pagination Controls (Centered & Compact) */}
    <div className="flex justify-center">
    <div className="flex items-center gap-2 flex-wrap">
        
        {/* First */}
        <button
        onClick={() => setCurrentPage(1)}
        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
        >
        &#9198;
        </button>

        {/* Prev */}
        <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
        >
        Prev
        </button>

        {/* Page Numbers */}
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
                className={`px-3 py-1 rounded-lg cursor-pointer ${
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

        {/* Next */}
        <button
        onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
        }
        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
        >
        Next
        </button>

        {/* Last */}
        <button
        onClick={() => setCurrentPage(totalPages)}
        className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
        >
        &#9197;
        </button>

    </div>
    </div>
    </div>
  );
};

export default CashTrack;