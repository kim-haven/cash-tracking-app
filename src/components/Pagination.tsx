import React from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number; // default: 5
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  const safeCurrentPage = Math.min(currentPage, totalPages);

  let start = Math.max(safeCurrentPage - Math.floor(maxVisiblePages / 2), 1);
  let end = start + maxVisiblePages - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(end - maxVisiblePages + 1, 1);
  }

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex justify-center mt-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          &#9198;
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(Math.max(safeCurrentPage - 1, 1))}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Prev
        </button>

        {/* Numeric Pages */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-lg ${
              safeCurrentPage === page
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Page */}
        <button
          onClick={() => onPageChange(Math.min(safeCurrentPage + 1, totalPages))}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Next
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          &#9197;
        </button>
      </div>
    </div>
  );
};

export default Pagination;