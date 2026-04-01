import React, { useCallback, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import type { CashlessATMItem } from "../../data/CashlessATMData";
import {
  buildCashlessAtmPayloadFromForm,
  type CashlessAtmFormFields,
  createCashlessAtmEntry,
  deleteCashlessAtmEntry,
  fetchAllCashlessAtmEntries,
  updateCashlessAtmEntry,
} from "../../api/cashlessAtmApi";

function emptyForm(): CashlessAtmFormFields {
  return {
    date: "",
    employee: "",
    terminal: "",
    debitTotalDispensed: "",
    totalTips: "",
    debitTotalSales: "",
    totalCashBack: "",
    blazeCashlessSales: "",
    totalCashlessATMChange: "",
    notes: "",
  };
}

type ToastState = { variant: "success" | "error"; message: string } | null;

const CashlessATM: React.FC = () => {
  const [items, setItems] = useState<CashlessATMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<CashlessAtmFormFields>(emptyForm);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<CashlessATMItem | null>(null);
  const [editForm, setEditForm] = useState<CashlessAtmFormFields>(emptyForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<CashlessATMItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  const refreshList = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchAllCashlessAtmEntries();
      setItems(rows);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Failed to load cashless ATM entries"
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchAllCashlessAtmEntries()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Failed to load cashless ATM entries"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (toast === null) return;
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const openAddModal = () => {
    setForm(emptyForm());
    setAddError(null);
    setAddOpen(true);
  };

  const openEditModal = (row: CashlessATMItem) => {
    setEditRow(row);
    setEditError(null);
    setEditForm({
      date: row.dateValue,
      employee: row.employee,
      terminal: row.terminal,
      debitTotalDispensed: String(row.debitTotalDispensed),
      totalTips: String(row.totalTips),
      debitTotalSales: String(row.debitTotalSales),
      totalCashBack: String(row.totalCashBack),
      blazeCashlessSales: String(row.blazeCashlessSales),
      totalCashlessATMChange: String(row.totalCashlessATMChange),
      notes: row.notes ?? "",
    });
    setEditOpen(true);
  };

  const openDeleteModal = (row: CashlessATMItem) => {
    setDeleteRow(row);
    setDeleteError(null);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSubmitting(true);
    try {
      const payload = buildCashlessAtmPayloadFromForm(form);
      await createCashlessAtmEntry(payload);
      setToast({
        variant: "success",
        message: "Successfully added the new entry.",
      });
      setAddOpen(false);
      setForm(emptyForm());
      await refreshList();
    } catch (err: unknown) {
      setToast({ variant: "error", message: "Failed to add the new entry." });
      setAddError(
        err instanceof Error ? err.message : "Could not save entry."
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      const payload = buildCashlessAtmPayloadFromForm(editForm);
      await updateCashlessAtmEntry(editRow.id, payload);
      setToast({ variant: "success", message: "Entry updated successfully." });
      setEditOpen(false);
      setEditRow(null);
      await refreshList();
    } catch (err: unknown) {
      setToast({ variant: "error", message: "Failed to update entry." });
      setEditError(
        err instanceof Error ? err.message : "Could not update entry."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCashlessAtmEntry(deleteRow.id, deleteReason);
      setToast({ variant: "success", message: "Entry deleted successfully." });
      setDeleteOpen(false);
      setDeleteRow(null);
      setDeleteReason("");
      await refreshList();
    } catch (err: unknown) {
      setToast({ variant: "error", message: "Failed to delete entry." });
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete entry."
      );
    } finally {
      setDeleting(false);
    }
  };

  const filteredData = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.dateValue.toLowerCase().includes(term) ||
      item.employee.toLowerCase().includes(term) ||
      item.terminal.toLowerCase().includes(term) ||
      item.notes.toLowerCase().includes(term) ||
      String(item.id).includes(term) ||
      String(item.totalSalesDifference).includes(term) ||
      String(item.cashbackDifference).includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const moneyFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const columns: Column<CashlessATMItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Employee", accessor: "employee" },
    { header: "Terminal", accessor: "terminal" },
    {
      header: "Debit Terminal: Total Dispensed",
      accessor: "debitTotalDispensed",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Total Tips",
      accessor: "totalTips",
      render: (value) => (
        <span className="text-green-600 font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Debit: Total Sales",
      accessor: "debitTotalSales",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Total cash back (On Receipt)",
      accessor: "totalCashBack",
      render: (value) => (
        <span className="text-red-500 font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Blaze: Total Cashless Sales",
      accessor: "blazeCashlessSales",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Total Cashless ATM Change (ON BLAZE)",
      accessor: "totalCashlessATMChange",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Total Sales Difference",
      accessor: "totalSalesDifference",
      render: (value) => (
        <span className="text-blue-600 font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "Cashback Difference",
      accessor: "cashbackDifference",
      render: (value) => (
        <span className="text-purple-600 font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    { header: "Notes", accessor: "notes" },
    {
      header: "ACTIONS",
      accessor: "id",
      align: "center",
      render: (_id, row) => (
        <div className="inline-flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50"
            aria-label="Update entry"
            title="Update entry"
          >
            <Pencil className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white p-2 text-red-600 shadow-sm hover:bg-red-50"
            aria-label="Delete entry"
            title="Delete entry"
          >
            <Trash2 className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      ),
    },
  ];

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300";

  const renderFormFields = (
    state: CashlessAtmFormFields,
    setState: React.Dispatch<React.SetStateAction<CashlessAtmFormFields>>
  ) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm text-gray-700 sm:col-span-2">
        Date
        <input
          type="date"
          className={inputClass}
          value={state.date}
          onChange={(e) => setState((f) => ({ ...f, date: e.target.value }))}
        />
      </label>
      <label className="block text-sm text-gray-700">
        Employee
        <input
          type="text"
          className={inputClass}
          value={state.employee}
          onChange={(e) =>
            setState((f) => ({ ...f, employee: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Terminal
        <input
          type="text"
          className={inputClass}
          value={state.terminal}
          onChange={(e) =>
            setState((f) => ({ ...f, terminal: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Debit terminal — total dispensed
        <input
          type="number"
          step="any"
          className={inputClass}
          value={state.debitTotalDispensed}
          onChange={(e) =>
            setState((f) => ({ ...f, debitTotalDispensed: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Total tips
        <input
          type="number"
          step="any"
          className={inputClass}
          value={state.totalTips}
          onChange={(e) =>
            setState((f) => ({ ...f, totalTips: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Debit — total sales
        <input
          type="number"
          step="any"
          className={inputClass}
          value={state.debitTotalSales}
          onChange={(e) =>
            setState((f) => ({ ...f, debitTotalSales: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Total cash back (on receipt)
        <input
          type="number"
          step="any"
          className={inputClass}
          value={state.totalCashBack}
          onChange={(e) =>
            setState((f) => ({ ...f, totalCashBack: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Blaze — total cashless sales
        <input
          type="number"
          step="any"
          className={inputClass}
          value={state.blazeCashlessSales}
          onChange={(e) =>
            setState((f) => ({ ...f, blazeCashlessSales: e.target.value }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700">
        Total cashless ATM change (on Blaze)
        <input
          type="number"
          step="any"
          className={inputClass}
          value={state.totalCashlessATMChange}
          onChange={(e) =>
            setState((f) => ({
              ...f,
              totalCashlessATMChange: e.target.value,
            }))
          }
        />
      </label>
      <label className="block text-sm text-gray-700 sm:col-span-2">
        Notes
        <textarea
          rows={3}
          className={`${inputClass} resize-y`}
          value={state.notes}
          onChange={(e) =>
            setState((f) => ({ ...f, notes: e.target.value }))
          }
        />
      </label>
    </div>
  );

  return (
    <div className="flex flex-col">
      {toast !== null && (
        <div
          role="alert"
          className={`fixed top-4 left-1/2 z-[60] max-w-md -translate-x-1/2 rounded-lg px-4 py-3 text-center text-sm font-medium text-white shadow-lg ${
            toast.variant === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-gray-700">
          Cashless ATM Summary
        </h2>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />
          <button
            type="button"
            onClick={openAddModal}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Entry
          </button>
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
          Loading cashless ATM entries…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No records found"
          getRowKey={(row) => row.id}
        />
      )}

      {!loading && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashless-atm-add-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="cashless-atm-add-title"
              className="text-lg font-semibold text-gray-800"
            >
              Add Entry
            </h2>
            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              {addError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {addError}
                </div>
              )}
              {renderFormFields(form, setForm)}
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={addSubmitting}
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {addSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && editRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashless-atm-edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="cashless-atm-edit-title"
              className="text-lg font-semibold text-gray-800"
            >
              Update entry
            </h2>
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {editError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {editError}
                </div>
              )}
              {renderFormFields(editForm, setEditForm)}
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={editSubmitting}
                  onClick={() => {
                    setEditOpen(false);
                    setEditRow(null);
                    setEditError(null);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {editSubmitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && deleteRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cashless-atm-delete-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="cashless-atm-delete-title"
              className="text-lg font-semibold text-gray-800"
            >
              Delete entry
            </h2>
            {deleteError && (
              <div
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {deleteError}
              </div>
            )}
            <p className="mt-3 text-sm text-gray-600">Reason is optional.</p>
            <label className="mt-3 block text-sm text-gray-700">
              Reason
              <textarea
                rows={3}
                className={`${inputClass} resize-y`}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteRow(null);
                  setDeleteError(null);
                  setDeleteReason("");
                }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashlessATM;
