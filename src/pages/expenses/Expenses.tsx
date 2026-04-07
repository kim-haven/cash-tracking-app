import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import {
  fetchAllExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../api/expensesApi";
import {
  formatUsShortDate,
  todayDateInputMax,
  toDateInputValue,
} from "../../utils/usShortDate";
import { useStore } from "../../context/StoreContext";
import { resolveStoreIdForWrite } from "../../utils/storeScope";

interface ExpenseItem {
  id: number;
  store_id?: number;
  date: string;
  paid_by: string;
  pay_to: string;
  approved_by: string;
  receipt_uploaded: boolean;
  type: string;
  description: string;
  cash_in: number;
  cash_out: number;
}

function emptyExpenseForm() {
  return {
    date: "",
    paid_by: "",
    pay_to: "",
    approved_by: "",
    receipt_uploaded: false,
    type: "",
    description: "",
    cash_in: "",
    cash_out: "",
  };
}

const Expenses: React.FC = () => {
  const { selectedPhysicalStoreId } = useStore();
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyExpenseForm);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300";

  // FETCH DATA
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    fetchAllExpenses(selectedPhysicalStoreId)
      .then((rows) => {
        if (!cancelled) setItems(rows as ExpenseItem[]);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load expenses"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPhysicalStoreId]);

  // FILTER
  const filteredData = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      formatUsShortDate(item.date).toLowerCase().includes(term) ||
      item.paid_by.toLowerCase().includes(term) ||
      item.pay_to.toLowerCase().includes(term) ||
      (item.description || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const cashFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyExpenseForm());
    setSubmitError(null);
    setAddOpen(true);
  };

  const openEditModal = useCallback((row: ExpenseItem) => {
    setEditingId(row.id);
    setForm({
      date: toDateInputValue(row.date ?? ""),
      paid_by: row.paid_by ?? "",
      pay_to: row.pay_to ?? "",
      approved_by: row.approved_by ?? "",
      receipt_uploaded: Boolean(row.receipt_uploaded),
      type: row.type ?? "",
      description: row.description ?? "",
      cash_in: row.cash_in != null ? String(row.cash_in) : "",
      cash_out: row.cash_out != null ? String(row.cash_out) : "",
    });
    setSubmitError(null);
    setAddOpen(true);
  }, []);

  const openDeleteConfirm = useCallback((id: number) => {
    setDeleteError(null);
    setDeleteTargetId(id);
  }, []);

  const closeExpenseModal = () => {
    setAddOpen(false);
    setEditingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteExpense(deleteTargetId);
      setDeleteTargetId(null);
      const refreshed = await fetchAllExpenses(selectedPhysicalStoreId);
      setItems(refreshed);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete expense"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const iconBtn =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm";

  const columns: Column<ExpenseItem>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "date",
        render: (val) => formatUsShortDate(String(val ?? "")),
      },
      { header: "Paid By", accessor: "paid_by" },
      { header: "Pay To", accessor: "pay_to" },
      { header: "Approved By", accessor: "approved_by" },
      {
        header: "Receipt",
        accessor: "receipt_uploaded",
        render: (val) => (val ? "Yes" : "No"),
      },
      { header: "Type", accessor: "type" },
      { header: "Description", accessor: "description" },
      {
        header: "Cash In",
        accessor: "cash_in",
        render: (v) => (
          <span className="font-medium tabular-nums text-emerald-500">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Cash Out",
        accessor: "cash_out",
        render: (v) => (
          <span className="font-medium tabular-nums text-red-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "ACTIONS",
        accessor: "id",
        align: "center",
        render: (_id, row) => (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className={`${iconBtn} text-blue-600 hover:bg-blue-50`}
              aria-label="Edit expense"
              title="Edit"
            >
              <Pencil className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => openDeleteConfirm(row.id)}
              className={`${iconBtn} text-red-600 hover:bg-red-50`}
              aria-label="Delete expense"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ],
    [cashFmt, openEditModal, openDeleteConfirm]
  );

  // SUBMIT (create or update)
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.date) {
      setSubmitError("Date is required.");
      return;
    }

    const rowStore =
      editingId !== null
        ? items.find((r) => r.id === editingId)?.store_id
        : undefined;
    const storeId = resolveStoreIdForWrite(rowStore, selectedPhysicalStoreId);
    if (storeId === null) {
      setSubmitError(
        "Select a specific store in the header to add or edit expenses."
      );
      return;
    }

    const payload = {
      ...form,
      store_id: storeId,
      cash_in: Number(form.cash_in || 0),
      cash_out: Number(form.cash_out || 0),
    };

    try {
      setSubmitting(true);

      if (editingId !== null) {
        await updateExpense(editingId, payload);
      } else {
        await createExpense(payload);
      }

      closeExpenseModal();
      setForm(emptyExpenseForm());

      const refreshed = await fetchAllExpenses(selectedPhysicalStoreId);
      setItems(refreshed);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : editingId !== null
            ? "Failed to update expense"
            : "Failed to create expense"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-gray-700">
          Expenses
        </h2>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={openAddModal}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div
          className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white py-12 text-center text-gray-500">
          Loading expenses…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No expenses found"
        />
      )}

      {!loading && (
        <div className="mt-4">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-form-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="expense-form-title"
              className="text-lg font-semibold text-gray-800"
            >
              {editingId !== null ? "Edit Expense" : "Add Expense"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Values are sent as JSON to the expenses API.
            </p>

            <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-4">
              {submitError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Date
                  <input
                    type="date"
                    max={todayDateInputMax()}
                    className={inputClass}
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Paid By
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Paid by"
                    value={form.paid_by}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, paid_by: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Pay To
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Pay to"
                    value={form.pay_to}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pay_to: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Approved By
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Approved by"
                    value={form.approved_by}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, approved_by: e.target.value }))
                    }
                  />
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.receipt_uploaded}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        receipt_uploaded: e.target.checked,
                      }))
                    }
                  />
                  Receipt uploaded
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Type
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Type"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Description
                  <textarea
                    rows={2}
                    className={`${inputClass} resize-y`}
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Cash In
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="0"
                    value={form.cash_in}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cash_in: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Cash Out
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    placeholder="0"
                    value={form.cash_out}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cash_out: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeExpenseModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : editingId !== null ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-delete-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="expense-delete-title"
              className="text-lg font-semibold text-gray-800"
            >
              Delete expense
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              This cannot be undone. Remove this expense from the list?
            </p>
            {deleteError && (
              <div
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {deleteError}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteTargetId(null);
                  setDeleteError(null);
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
