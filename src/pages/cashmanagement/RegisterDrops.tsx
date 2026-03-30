import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ClockPlus } from "lucide-react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import type { RegisterDropItem } from "../../data/RegisterDropsData";
import {
  addRegisterDropTimeOut,
  bulkRegisterDropTimeOut,
  createRegisterDrop,
  fetchAllRegisterDrops,
  formatTimeInputForBulkTimeOutApi,
} from "../../api/registerDropsApi";

type FormState = {
  date: string;
  register: string;
  timeStart: string;
  timeEnd: string;
  action: string;
  cashIn: string;
  initials: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    date: "",
    register: "",
    timeStart: "",
    timeEnd: "",
    action: "",
    cashIn: "",
    initials: "",
    notes: "",
  };
}

type ToastState = { variant: "success" | "error"; message: string } | null;

const RegisterDrops: React.FC = () => {
  const [items, setItems] = useState<RegisterDropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [timeOutOpen, setTimeOutOpen] = useState(false);
  const [timeOutRow, setTimeOutRow] = useState<RegisterDropItem | null>(null);
  const [timeOutValue, setTimeOutValue] = useState("");
  const [timeOutError, setTimeOutError] = useState<string | null>(null);
  const [timeOutSaving, setTimeOutSaving] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set()
  );
  const [bulkTimeOutOpen, setBulkTimeOutOpen] = useState(false);
  const [bulkTimeOutValue, setBulkTimeOutValue] = useState("");
  const [bulkTimeOutError, setBulkTimeOutError] = useState<string | null>(null);
  const [bulkTimeOutSaving, setBulkTimeOutSaving] = useState(false);

  const refreshList = useCallback(async () => {
    setLoadError(null);
    try {
      const rows = await fetchAllRegisterDrops();
      setItems(rows);
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load register drops"
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchAllRegisterDrops()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load register drops"
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

  const openTimeOutForRow = useCallback((row: RegisterDropItem) => {
    setTimeOutRow(row);
    setTimeOutValue("");
    setTimeOutError(null);
    setTimeOutOpen(true);
  }, []);

  const handleTimeOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeOutRow) return;
    if (!timeOutValue.trim()) {
      setTimeOutError("Time out is required.");
      return;
    }
    setTimeOutSaving(true);
    setTimeOutError(null);
    try {
      await addRegisterDropTimeOut(timeOutRow.id, timeOutValue.trim());
      setToast({ variant: "success", message: "Time out saved successfully." });
      setTimeOutOpen(false);
      setTimeOutRow(null);
      setTimeOutValue("");
      await refreshList();
    } catch (err: unknown) {
      setToast({
        variant: "error",
        message: "Failed to save time out.",
      });
      setTimeOutError(
        err instanceof Error ? err.message : "Could not save time out."
      );
    } finally {
      setTimeOutSaving(false);
    }
  };

  const openAddModal = () => {
    setForm(emptyForm());
    setSubmitError(null);
    setAddOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const register = form.register.trim();
    const action = form.action.trim();
    const initials = form.initials.trim();
    const cashParsed = Number.parseFloat(form.cashIn);

    if (!form.date) {
      setSubmitError("Date is required.");
      return;
    }
    if (!form.timeStart.trim()) {
      setSubmitError("Time start is required.");
      return;
    }
    if (!register) {
      setSubmitError("Register is required.");
      return;
    }
    if (!action) {
      setSubmitError("Action is required.");
      return;
    }
    if (!initials) {
      setSubmitError("Initials are required.");
      return;
    }
    if (form.cashIn.trim() === "" || Number.isNaN(cashParsed)) {
      setSubmitError("Cash In must be a valid number.");
      return;
    }

    const notesTrim = form.notes.trim();
    const payload = {
      date: form.date,
      register,
      time_start: form.timeStart,
      time_end: form.timeEnd.trim() === "" ? null : form.timeEnd,
      action,
      cash_in: cashParsed,
      initials,
      notes: notesTrim === "" ? null : notesTrim,
    };

    setSubmitting(true);
    try {
      await createRegisterDrop(payload);
      setToast({
        variant: "success",
        message: "Successfully added the new entry",
      });
      setAddOpen(false);
      setForm(emptyForm());
      await refreshList();
    } catch (err: unknown) {
      setToast({ variant: "error", message: "Failed to add the new entry" });
      setSubmitError(
        err instanceof Error ? err.message : "Could not save entry."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.date.toLowerCase().includes(term) ||
      item.register.toLowerCase().includes(term) ||
      item.timeStart.toLowerCase().includes(term) ||
      item.timeEnd.toLowerCase().includes(term) ||
      item.action.toLowerCase().includes(term) ||
      item.initials.toLowerCase().includes(term) ||
      item.notes.toLowerCase().includes(term) ||
      String(item.cashIn).includes(term) ||
      String(item.id).includes(term)
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

  const columns: Column<RegisterDropItem>[] = [
    { header: "Date", accessor: "date" },
    { header: "Register", accessor: "register" },
    { header: "Time Start", accessor: "timeStart" },
    {
      header: "Time End",
      accessor: "timeEnd",
      cellClassName: (value) =>
        !String(value ?? "").trim() ? "bg-gray-100" : undefined,
    },
    { header: "Action", accessor: "action" },
    {
      header: "Cash In",
      accessor: "cashIn",
      render: (value) => (
        <span className="font-medium tabular-nums">
          {cashFmt.format(Number(value))}
        </span>
      ),
      align: "right",
    },
    { header: "Initials", accessor: "initials" },
    { header: "Notes", accessor: "notes" },
    {
      header: "ACTIONS",
      accessor: "id",
      align: "center",
      render: (_id, row) => {
        const hasEnd = String(row.timeEnd ?? "").trim() !== "";
        if (hasEnd) {
          return (
            <span className="text-gray-300" aria-hidden>
              —
            </span>
          );
        }
        return (
          <button
            type="button"
            onClick={() => openTimeOutForRow(row)}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-blue-600 shadow-sm hover:bg-blue-50"
            aria-label="Add time out"
            title="Add time out"
          >
            <ClockPlus className="h-5 w-5" strokeWidth={2} />
          </button>
        );
      },
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

  const onToggleSelectRow = useCallback((row: RegisterDropItem) => {
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

  const openBulkTimeOutModal = () => {
    if (selectedIds.size === 0) return;
    setBulkTimeOutValue("");
    setBulkTimeOutError(null);
    setBulkTimeOutOpen(true);
  };

  const handleBulkTimeOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTimeOutValue.trim()) {
      setBulkTimeOutError("Time out is required.");
      return;
    }
    const ids = Array.from(selectedIds);
    setBulkTimeOutSaving(true);
    setBulkTimeOutError(null);
    try {
      const timeOutApi = formatTimeInputForBulkTimeOutApi(
        bulkTimeOutValue.trim()
      );
      await bulkRegisterDropTimeOut(ids, timeOutApi);
      setToast({
        variant: "success",
        message: "Time out updated for selected entries.",
      });
      setBulkTimeOutOpen(false);
      setBulkTimeOutValue("");
      setSelectedIds(new Set());
      await refreshList();
    } catch (err: unknown) {
      setToast({
        variant: "error",
        message: "Failed to update time out for selected entries.",
      });
      setBulkTimeOutError(
        err instanceof Error ? err.message : "Could not update time out."
      );
    } finally {
      setBulkTimeOutSaving(false);
    }
  };

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

      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-gray-700">
          Register Drops
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
              Add Entry
            </button>
            <button
              type="button"
              onClick={openBulkTimeOutModal}
              disabled={selectedIds.size === 0}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-45"
              title="Update time out for selected rows"
            >
              <ClockPlus className="h-4 w-4 shrink-0" strokeWidth={2} />
              Update time out
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
          Loading register drops…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No register drops found"
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
        <div className="mt-4">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {timeOutOpen && timeOutRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-drop-timeout-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="register-drop-timeout-title"
              className="text-lg font-semibold text-gray-800"
            >
              Add time out
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {timeOutRow.register} · {timeOutRow.date}
            </p>
            <form onSubmit={handleTimeOutSubmit} className="mt-4 space-y-4">
              {timeOutError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {timeOutError}
                </div>
              )}
              <label className="block text-sm text-gray-700">
                Time out
                <input
                  type="time"
                  className={inputClass}
                  value={timeOutValue}
                  onChange={(e) => setTimeOutValue(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={timeOutSaving}
                  onClick={() => {
                    setTimeOutOpen(false);
                    setTimeOutRow(null);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={timeOutSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {timeOutSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkTimeOutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-drop-bulk-timeout-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="register-drop-bulk-timeout-title"
              className="text-lg font-semibold text-gray-800"
            >
              Update time out
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {selectedIds.size} row
              {selectedIds.size === 1 ? "" : "s"} selected · sent as e.g.{" "}
              <span className="font-medium text-gray-600">8:00 PM</span> to the
              API
            </p>
            <form onSubmit={handleBulkTimeOutSubmit} className="mt-4 space-y-4">
              {bulkTimeOutError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {bulkTimeOutError}
                </div>
              )}
              <label className="block text-sm text-gray-700">
                Time out
                <input
                  type="time"
                  className={inputClass}
                  value={bulkTimeOutValue}
                  onChange={(e) => setBulkTimeOutValue(e.target.value)}
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={bulkTimeOutSaving}
                  onClick={() => {
                    setBulkTimeOutOpen(false);
                    setBulkTimeOutError(null);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkTimeOutSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {bulkTimeOutSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-drop-add-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="register-drop-add-title"
              className="text-lg font-semibold text-gray-800"
            >
              Add Entry
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Values are sent as JSON to the register-drops API.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
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
                    className={inputClass}
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Register
                  <input
                    type="text"
                    className={inputClass}
                    value={form.register}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, register: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Time start
                  <input
                    type="time"
                    className={inputClass}
                    value={form.timeStart}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, timeStart: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Time end
                  <input
                    type="time"
                    className={inputClass}
                    value={form.timeEnd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, timeEnd: e.target.value }))
                    }
                  />
                  <span className="mt-0.5 block text-xs text-gray-400">
                    Leave empty to send null
                  </span>
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Action
                  <input
                    type="text"
                    className={inputClass}
                    value={form.action}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, action: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Cash In
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.cashIn}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cashIn: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Initials
                  <input
                    type="text"
                    className={inputClass}
                    value={form.initials}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        initials: e.target.value.toLowerCase(),
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Notes
                  <textarea
                    rows={2}
                    className={`${inputClass} resize-y`}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                  />
                  <span className="mt-0.5 block text-xs text-gray-400">
                    Empty notes are sent as null
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterDrops;
