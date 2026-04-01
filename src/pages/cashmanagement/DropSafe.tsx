import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Van } from "lucide-react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import type { DropSafeItem } from "../../data/DropSafeData";
import {
  buildCourierUpdatePayload,
  buildDropSafePayloadFromForm,
  createDropSafe,
  fetchDropSafes,
  patchDropSafeCourier,
  deleteDropSafe,
  updateDropSafe,
} from "../../api/dropSafeApi";
import { todayDateInputMax } from "../../utils/usShortDate";

type AddFormState = {
  bagNo: string;
  preparedDate: string;
  preparedTime: string;
  preparedBy: string;
  preparedAmount: string;
  courierDate: string;
  courierTime: string;
  courierGivenBy: string;
  courierReceivedBy: string;
  courierAmount: string;
};

type CourierFormState = {
  courierDate: string;
  courierTime: string;
  courierGivenBy: string;
  courierReceivedBy: string;
  courierAmount: string;
};

function emptyCourierForm(): CourierFormState {
  return {
    courierDate: "",
    courierTime: "",
    courierGivenBy: "",
    courierReceivedBy: "",
    courierAmount: "",
  };
}

function emptyAddForm(): AddFormState {
  return {
    bagNo: "",
    preparedDate: "",
    preparedTime: "",
    preparedBy: "",
    preparedAmount: "",
    courierDate: "",
    courierTime: "",
    courierGivenBy: "",
    courierReceivedBy: "",
    courierAmount: "",
  };
}

type ToastState = { variant: "success" | "error"; message: string } | null;

const DropSafe: React.FC = () => {
  const [items, setItems] = useState<DropSafeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(emptyAddForm);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set()
  );

  const [courierOpen, setCourierOpen] = useState(false);
  const [courierRow, setCourierRow] = useState<DropSafeItem | null>(null);
  const [courierForm, setCourierForm] = useState<CourierFormState>(
    emptyCourierForm
  );
  const [courierError, setCourierError] = useState<string | null>(null);
  const [courierSaving, setCourierSaving] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<DropSafeItem | null>(null);
  const [editForm, setEditForm] = useState<AddFormState>(emptyAddForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<DropSafeItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  const refreshList = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchDropSafes();
      setItems(rows);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load drop safes"
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchDropSafes()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load drop safes"
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
    setAddForm(emptyAddForm());
    setAddError(null);
    setAddOpen(true);
  };

  const openEditModal = (row: DropSafeItem) => {
    setEditRow(row);
    setEditError(null);
    setEditForm({
      bagNo: row.bagNumber,
      preparedDate: row.preparedDateValue,
      preparedTime: row.preparedTimeValue,
      preparedBy: row.preparedBy,
      preparedAmount: row.preparedAmountRaw,
      courierDate: row.courierDateValue,
      courierTime: row.courierTimeValue,
      courierGivenBy: row.givenBy,
      courierReceivedBy: row.receivedBy,
      courierAmount:
        row.courierAmountRaw != null && row.courierAmountRaw !== ""
          ? row.courierAmountRaw
          : "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRow) return;
    setEditError(null);

    if (!editForm.bagNo.trim()) {
      setEditError("Bag number is required.");
      return;
    }
    if (!editForm.preparedDate) {
      setEditError("Date prepared is required.");
      return;
    }
    if (!editForm.preparedTime.trim()) {
      setEditError("Time prepared is required.");
      return;
    }
    if (!editForm.preparedBy.trim()) {
      setEditError("Prepared by is required.");
      return;
    }
    const amt = Number.parseFloat(editForm.preparedAmount);
    if (editForm.preparedAmount.trim() === "" || Number.isNaN(amt)) {
      setEditError("Amount prepared must be a valid number.");
      return;
    }

    const payload = buildDropSafePayloadFromForm(editForm);
    setEditSubmitting(true);
    try {
      await updateDropSafe(editRow.id, payload);
      setToast({ variant: "success", message: "Entry updated successfully." });
      setEditOpen(false);
      setEditRow(null);
      await refreshList();
    } catch (err: unknown) {
      setToast({ variant: "error", message: "Failed to update entry." });
      setEditError(err instanceof Error ? err.message : "Could not update entry.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const openDeleteModal = (row: DropSafeItem) => {
    setDeleteRow(row);
    setDeleteError(null);
    setDeleteReason("");
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDropSafe(deleteRow.id, deleteReason);
      setToast({ variant: "success", message: "Entry deleted successfully." });
      setDeleteOpen(false);
      setDeleteRow(null);
      setDeleteReason("");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteRow.id);
        return next;
      });
      await refreshList();
    } catch (err: unknown) {
      setToast({ variant: "error", message: "Failed to delete entry." });
      setDeleteError(err instanceof Error ? err.message : "Could not delete entry.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addForm.bagNo.trim()) {
      setAddError("Bag number is required.");
      return;
    }
    if (!addForm.preparedDate) {
      setAddError("Date prepared is required.");
      return;
    }
    if (!addForm.preparedTime.trim()) {
      setAddError("Time prepared is required.");
      return;
    }
    if (!addForm.preparedBy.trim()) {
      setAddError("Prepared by is required.");
      return;
    }
    const amt = Number.parseFloat(addForm.preparedAmount);
    if (addForm.preparedAmount.trim() === "" || Number.isNaN(amt)) {
      setAddError("Amount prepared must be a valid number.");
      return;
    }

    const payload = buildDropSafePayloadFromForm(addForm);
    setAddSubmitting(true);
    try {
      await createDropSafe(payload);
      setAddOpen(false);
      setAddForm(emptyAddForm());
      setSelectedIds(new Set());
      await refreshList();
    } catch (err: unknown) {
      setAddError(
        err instanceof Error ? err.message : "Could not save drop safe."
      );
    } finally {
      setAddSubmitting(false);
    }
  };

  const openCourierForRow = useCallback((row: DropSafeItem) => {
    setCourierRow(row);
    setCourierForm({
      courierDate: row.courierDateValue,
      courierTime: row.courierTimeValue,
      courierGivenBy: row.givenBy,
      courierReceivedBy: row.receivedBy,
      courierAmount:
        row.courierAmountRaw != null && row.courierAmountRaw !== ""
          ? row.courierAmountRaw
          : "",
    });
    setCourierError(null);
    setCourierOpen(true);
  }, []);

  const handleCourierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierRow) return;
    setCourierError(null);
    setCourierSaving(true);
    try {
      const payload = buildCourierUpdatePayload(courierForm);
      await patchDropSafeCourier(courierRow.id, payload);
      setCourierOpen(false);
      setCourierRow(null);
      setCourierForm(emptyCourierForm());
      await refreshList();
    } catch (err: unknown) {
      setCourierError(
        err instanceof Error ? err.message : "Could not update courier."
      );
    } finally {
      setCourierSaving(false);
    }
  };

  const filteredData = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.bagNumber.toLowerCase().includes(term) ||
      item.datePrepared.toLowerCase().includes(term) ||
      item.timePrepared.toLowerCase().includes(term) ||
      item.preparedBy.toLowerCase().includes(term) ||
      item.givenBy.toLowerCase().includes(term) ||
      item.receivedBy.toLowerCase().includes(term) ||
      item.dateGiven.toLowerCase().includes(term) ||
      item.timeGiven.toLowerCase().includes(term) ||
      String(item.amountPrepared).includes(term) ||
      String(item.amountReceived).includes(term) ||
      String(item.id).includes(term)
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

  const columns: Column<DropSafeItem>[] = [
    { header: "Bag#", accessor: "bagNumber" },
    { header: "Date Prepared", accessor: "datePrepared" },
    { header: "Time Prepared", accessor: "timePrepared" },
    { header: "Prepared By", accessor: "preparedBy" },
    {
      header: "Amount Prepared",
      accessor: "amountPrepared",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    { header: "Date Given", accessor: "dateGiven" },
    { header: "Time Given", accessor: "timeGiven" },
    { header: "Given By", accessor: "givenBy" },
    { header: "Received By", accessor: "receivedBy" },
    {
      header: "Amount Received",
      accessor: "amountReceived",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {moneyFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    {
      header: "ACTIONS",
      accessor: "id",
      align: "center",
      render: (_id, row) => (
        <div className="inline-flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => openCourierForRow(row)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-blue-700 shadow-sm hover:bg-blue-50"
            aria-label="Update courier"
            title="Update courier"
          >
            <Van className="h-5 w-5" strokeWidth={2} />
          </button>
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

  const pageIds = useMemo(
    () => currentRows.map((r) => r.id),
    [currentRows]
  );
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allPageSelected;

  const onToggleSelectRow = useCallback((row: DropSafeItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  }, []);

  const onToggleSelectAllPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allOn =
        pageIds.length > 0 && pageIds.every((id) => next.has(id));
      if (allOn) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  }, [pageIds]);

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300";

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
          Drop Safe
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
          Loading drop safes…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No records found"
          getRowKey={(row) => row.id}
          rowSelection={{
            isRowSelected: (row) => selectedIds.has(row.id),
            onToggleRow: onToggleSelectRow,
            headerChecked: allPageSelected,
            headerIndeterminate: somePageSelected,
            onToggleHeader: onToggleSelectAllPage,
          }}
        />
      )}

      {!loading && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {courierOpen && courierRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drop-safe-courier-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center gap-2">
              <Van className="h-6 w-6 text-blue-600" strokeWidth={2} />
              <h2
                id="drop-safe-courier-title"
                className="text-lg font-semibold text-gray-800"
              >
                Update courier
              </h2>
            </div>

            <form onSubmit={handleCourierSubmit} className="mt-4 space-y-4">
              {courierError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {courierError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Courier date
                  <input
                    type="date"
                    max={todayDateInputMax()}
                    className={inputClass}
                    value={courierForm.courierDate}
                    onChange={(e) =>
                      setCourierForm((f) => ({
                        ...f,
                        courierDate: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Courier time
                  <input
                    type="time"
                    className={inputClass}
                    value={courierForm.courierTime}
                    onChange={(e) =>
                      setCourierForm((f) => ({
                        ...f,
                        courierTime: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Given by
                  <input
                    type="text"
                    className={inputClass}
                    value={courierForm.courierGivenBy}
                    onChange={(e) =>
                      setCourierForm((f) => ({
                        ...f,
                        courierGivenBy: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Received by
                  <input
                    type="text"
                    className={inputClass}
                    value={courierForm.courierReceivedBy}
                    onChange={(e) =>
                      setCourierForm((f) => ({
                        ...f,
                        courierReceivedBy: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Courier amount
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={courierForm.courierAmount}
                    onChange={(e) =>
                      setCourierForm((f) => ({
                        ...f,
                        courierAmount: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={courierSaving}
                  onClick={() => {
                    setCourierOpen(false);
                    setCourierRow(null);
                    setCourierError(null);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courierSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {courierSaving ? "Saving…" : "Save"}
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
          aria-labelledby="drop-safe-edit-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="drop-safe-edit-title"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Bag #
                  <input
                    type="text"
                    className={inputClass}
                    value={editForm.bagNo}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, bagNo: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Date prepared
                  <input
                    type="date"
                    max={todayDateInputMax()}
                    className={inputClass}
                    value={editForm.preparedDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        preparedDate: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Time prepared
                  <input
                    type="time"
                    className={inputClass}
                    value={editForm.preparedTime}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        preparedTime: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Prepared by
                  <input
                    type="text"
                    className={inputClass}
                    value={editForm.preparedBy}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, preparedBy: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Amount prepared
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={editForm.preparedAmount}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        preparedAmount: e.target.value,
                      }))
                    }
                  />
                </label>

                <p className="text-xs text-gray-500 sm:col-span-2">
                  Courier fields are optional; leave blank to send null.
                </p>

                <label className="block text-sm text-gray-700">
                  Courier date
                  <input
                    type="date"
                    className={inputClass}
                    value={editForm.courierDate}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        courierDate: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Courier time
                  <input
                    type="time"
                    className={inputClass}
                    value={editForm.courierTime}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        courierTime: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Given by
                  <input
                    type="text"
                    className={inputClass}
                    value={editForm.courierGivenBy}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        courierGivenBy: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Received by
                  <input
                    type="text"
                    className={inputClass}
                    value={editForm.courierReceivedBy}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        courierReceivedBy: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Courier amount
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={editForm.courierAmount}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        courierAmount: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

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
          aria-labelledby="drop-safe-delete-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="drop-safe-delete-title"
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

            <p className="mt-3 text-sm text-gray-600">
              Reason is optional.
            </p>

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

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drop-safe-add-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="drop-safe-add-title"
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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Bag #
                  <input
                    type="text"
                    className={inputClass}
                    value={addForm.bagNo}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, bagNo: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Date prepared
                  <input
                    type="date"
                    max={todayDateInputMax()}
                    className={inputClass}
                    value={addForm.preparedDate}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        preparedDate: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Time prepared
                  <input
                    type="time"
                    className={inputClass}
                    value={addForm.preparedTime}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        preparedTime: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Prepared by
                  <input
                    type="text"
                    className={inputClass}
                    value={addForm.preparedBy}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, preparedBy: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Amount prepared
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={addForm.preparedAmount}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        preparedAmount: e.target.value,
                      }))
                    }
                  />
                </label>

                <p className="text-xs text-gray-500 sm:col-span-2">
                  Courier fields are optional; leave blank to send null.
                </p>

                <label className="block text-sm text-gray-700">
                  Courier date
                  <input
                    type="date"
                    max={todayDateInputMax()}
                    className={inputClass}
                    value={addForm.courierDate}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, courierDate: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Courier time
                  <input
                    type="time"
                    className={inputClass}
                    value={addForm.courierTime}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, courierTime: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Given by
                  <input
                    type="text"
                    className={inputClass}
                    value={addForm.courierGivenBy}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        courierGivenBy: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Received by
                  <input
                    type="text"
                    className={inputClass}
                    value={addForm.courierReceivedBy}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        courierReceivedBy: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Courier amount
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={addForm.courierAmount}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        courierAmount: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

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
    </div>
  );
};

export default DropSafe;
  