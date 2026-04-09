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
    <div className="mt-4 flex justify-center">
      <div className="flex flex-wrap items-center gap-2">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          className="rounded-lg bg-gray-200 px-3 py-1 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
        >
          &#9198;
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(safeCurrentPage - 1, 1))}
          className="rounded-lg bg-gray-200 px-3 py-1 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
        >
          Prev
        </button>

        {/* Numeric Pages */}
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`rounded-lg px-3 py-1 ${
              safeCurrentPage === page
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeCurrentPage + 1, totalPages))}
          className="rounded-lg bg-gray-200 px-3 py-1 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
        >
          Next
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          className="rounded-lg bg-gray-200 px-3 py-1 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
        >
          &#9197;
        </button>
      </div>
    </div>
  );
};

export default Pagination;