import React, { useCallback, useEffect, useMemo, useState } from "react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import {
  cashReconciliationRowToPayload,
  createCashReconciliation,
  fetchAllCashReconciliations,
  updateCashReconciliation,
  type CashReconciliationItem,
  type CashReconciliationPayload,
} from "../../api/cashReconciliationsApi";
import {
  fetchDailySummaries,
  type CashTrackItem,
} from "../../api/cashTrackApi";
import { formatUsShortDate, todayDateInputMax } from "../../utils/usShortDate";
import { useStore } from "../../context/StoreContext";

/** Match daily-summary rows on calendar date (YYYY-MM-DD prefix). Same as Cash on Hand. */
function ymdKeyFromDateString(dateStr: string): string | null {
  const iso = String(dateStr ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

type POSReconcileFormState = {
  date: string;
  controller: string;
  cashIn: string;
  cashRefunds: string;
  cashlessAtmCashBack: string;
};

function emptyPOSReconcileForm(): POSReconcileFormState {
  return {
    date: "",
    controller: "",
    cashIn: "",
    cashRefunds: "",
    cashlessAtmCashBack: "",
  };
}

/** Cash In − Cash Refunds − Cashless ATM Cash Back */
function reportedCashCollectedComputed(
  row: Pick<
    CashReconciliationItem,
    "cashIn" | "cashRefunds" | "cashlessAtmCashBack"
  >
): number {
  return (
    Number(row.cashIn ?? 0) -
    Number(row.cashRefunds ?? 0) -
    Number(row.cashlessAtmCashBack ?? 0)
  );
}

/** Reported cash collected − cash collected (register drops for that date). */
function cashDifferenceComputed(
  row: CashReconciliationItem,
  registerDropsByDate: Map<string, number>
): number {
  const reported = reportedCashCollectedComputed(row);
  const key = ymdKeyFromDateString(row.date);
  const collected = key ? registerDropsByDate.get(key) ?? 0 : 0;
  return reported - collected;
}

/** Cash Difference (computed) − Cashless ATM Difference. */
function cashVsCashlessAtmDifferenceComputed(
  row: CashReconciliationItem,
  registerDropsByDate: Map<string, number>
): number {
  return (
    cashDifferenceComputed(row, registerDropsByDate) -
    Number(row.cashlessAtmDifference ?? 0)
  );
}

function formToCreatePayload(
  form: POSReconcileFormState,
  storeId: number
): CashReconciliationPayload {
  const cashIn = Number(form.cashIn || 0);
  const cashRefunds = Number(form.cashRefunds || 0);
  const cashlessAtmCashBack = Number(form.cashlessAtmCashBack || 0);
  return {
    storeId,
    date: form.date,
    controller: form.controller.trim(),
    cashIn,
    cashRefunds,
    cashlessAtmCashBack,
    reportedCashCollected: cashIn - cashRefunds - cashlessAtmCashBack,
    cashCollected: 0,
    cashDifference: 0,
    creditDifference: 0,
    cashlessAtmDifference: 0,
    cashVsCashlessAtmDifference: 0,
    notes: "",
  };
}

const POSReconcile: React.FC = () => {
  const { selectedPhysicalStoreId } = useStore();
  const [items, setItems] = useState<CashReconciliationItem[]>([]);
  const [dailySummaries, setDailySummaries] = useState<CashTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<POSReconcileFormState>(emptyPOSReconcileForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [notesRow, setNotesRow] = useState<CashReconciliationItem | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300";

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetchAllCashReconciliations(selectedPhysicalStoreId),
      fetchDailySummaries(selectedPhysicalStoreId).catch(
        () => [] as CashTrackItem[]
      ),
    ])
      .then(([rows, summaries]) => {
        if (!cancelled) {
          setItems(rows);
          setDailySummaries(summaries);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load reconciliations"
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

  /** Per calendar day: register drops from daily financial summary (cash on hand API). */
  const registerDropsByDate = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of dailySummaries) {
      const key = ymdKeyFromDateString(row.date);
      if (!key) continue;
      m.set(
        key,
        (m.get(key) ?? 0) + Number(row.registerDrops ?? 0)
      );
    }
    return m;
  }, [dailySummaries]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter((item) => {
      return (
        item.date.toLowerCase().includes(term) ||
        formatUsShortDate(item.date).toLowerCase().includes(term) ||
        item.controller.toLowerCase().includes(term) ||
        (item.notes || "").toLowerCase().includes(term)
      );
    });
  }, [searchTerm, items]);

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

  const openNotesModal = useCallback((row: CashReconciliationItem) => {
    setNotesRow(row);
    setNotesDraft(row.notes ?? "");
    setNotesError(null);
  }, []);

  const closeNotesModal = useCallback(() => {
    setNotesRow(null);
    setNotesDraft("");
    setNotesError(null);
  }, []);

  const handleNotesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesRow) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      await updateCashReconciliation(notesRow.id, {
        ...cashReconciliationRowToPayload(notesRow),
        notes: notesDraft.trim(),
      });
      closeNotesModal();
      const refreshed = await fetchAllCashReconciliations(selectedPhysicalStoreId);
      setItems(refreshed);
    } catch (err: unknown) {
      setNotesError(
        err instanceof Error ? err.message : "Failed to save notes"
      );
    } finally {
      setNotesSaving(false);
    }
  };

  const columns: Column<CashReconciliationItem>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "date",
        render: (val) => formatUsShortDate(String(val ?? "")),
      },
      { header: "Controller", accessor: "controller" },
      {
        header: "Cash In",
        accessor: "cashIn",
        render: (v) => (
          <span className="font-medium tabular-nums text-emerald-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Cash Refunds",
        accessor: "cashRefunds",
        render: (v) => (
          <span className="font-medium tabular-nums text-red-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Cashless ATM Cash Back",
        accessor: "cashlessAtmCashBack",
        render: (v) => (
          <span className="font-medium tabular-nums text-gray-800">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Reported Cash Collected",
        accessor: "reportedCashCollected",
        render: (_v, row) => {
          const computed = reportedCashCollectedComputed(row);
          return (
            <span
              className="font-medium tabular-nums text-gray-800"
              title="Cash In − Cash Refunds − Cashless ATM Cash Back"
            >
              {cashFmt.format(computed)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Cash Collected",
        accessor: "cashCollected",
        render: (_v, row) => {
          const key = ymdKeyFromDateString(row.date);
          const drops = key ? registerDropsByDate.get(key) ?? 0 : 0;
          return (
            <span
              className="font-medium tabular-nums text-gray-800"
              title="Register drops from daily summary (same date)"
            >
              {cashFmt.format(drops)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Cash Difference",
        accessor: "cashDifference",
        render: (_v, row) => {
          const diff = cashDifferenceComputed(row, registerDropsByDate);
          return (
            <span
              className={`font-medium tabular-nums ${
                diff < 0
                  ? "text-red-600"
                  : diff > 0
                    ? "text-emerald-600"
                    : "text-gray-800"
              }`}
              title="Reported cash collected − cash collected (register drops)"
            >
              {cashFmt.format(diff)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Credit Difference",
        accessor: "creditDifference",
        render: (v) => (
          <span className="font-medium tabular-nums text-blue-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Cashless ATM Difference",
        accessor: "cashlessAtmDifference",
        render: (v) => (
          <span className="font-medium tabular-nums text-purple-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Cash vs Cashless ATM Difference",
        accessor: "cashVsCashlessAtmDifference",
        render: (_v, row) => {
          const v = cashVsCashlessAtmDifferenceComputed(row, registerDropsByDate);
          return (
            <span
              className="font-bold tabular-nums text-gray-800"
              title="Cash Difference − Cashless ATM Difference"
            >
              {cashFmt.format(v)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Reason/Notes",
        accessor: "notes",
        render: (_v, row) => {
          const text = (row.notes ?? "").trim();
          if (text) {
            return (
              <button
                type="button"
                onClick={() => openNotesModal(row)}
                className="cursor-pointer whitespace-nowrap rounded-md border border-dashed border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-100"
                title={`${text} — click to edit`}
              >
                View Notes
              </button>
            );
          }
          return (
            <button
              type="button"
              onClick={() => openNotesModal(row)}
              className="cursor-pointer whitespace-nowrap rounded-md border border-dashed border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-100"
            >
              Add notes
            </button>
          );
        },
      },
    ],
    [cashFmt, registerDropsByDate, openNotesModal]
  );

  const openAddModal = () => {
    setForm(emptyPOSReconcileForm());
    setSubmitError(null);
    setAddOpen(true);
  };

  const closeAddModal = () => {
    setAddOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.date.trim()) {
      setSubmitError("Date is required.");
      return;
    }
    if (!form.controller.trim()) {
      setSubmitError("Controller is required.");
      return;
    }
    if (selectedPhysicalStoreId === null) {
      setSubmitError("Select a specific store in the header to add a reconciliation.");
      return;
    }
    try {
      setSubmitting(true);
      await createCashReconciliation(
        formToCreatePayload(form, selectedPhysicalStoreId)
      );
      closeAddModal();
      setForm(emptyPOSReconcileForm());
      const [refreshed, summaries] = await Promise.all([
        fetchAllCashReconciliations(selectedPhysicalStoreId),
        fetchDailySummaries(selectedPhysicalStoreId).catch(
          () => [] as CashTrackItem[]
        ),
      ]);
      setItems(refreshed);
      setDailySummaries(summaries);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to create cash reconciliation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex min-w-0 flex-col gap-3 pb-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <h2 className="min-w-0 max-w-full text-lg font-semibold text-gray-700 wrap-break-word">
          POS Reconciliation
        </h2>
        <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
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
              Add
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
          Loading…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No records found"
          getRowKey={(row) => String(row.id)}
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

      {notesRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pos-notes-modal-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="pos-notes-modal-title"
              className="text-lg font-semibold text-gray-800"
            >
              Reason / notes
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {formatUsShortDate(notesRow.date)} · {notesRow.controller}
            </p>
            <form onSubmit={handleNotesSave} className="mt-4 space-y-4">
              {notesError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {notesError}
                </div>
              )}
              <label className="block text-sm text-gray-700">
                Notes
                <textarea
                  rows={5}
                  className={`${inputClass} resize-y`}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Enter a reason or notes…"
                />
              </label>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={notesSaving}
                  onClick={closeNotesModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={notesSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {notesSaving ? "Saving…" : "Save"}
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
          aria-labelledby="pos-reconcile-form-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="pos-reconcile-form-title"
              className="text-lg font-semibold text-gray-800"
            >
              Add POS reconciliation
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the date, controller, and cash amounts. Reported cash
              collected is Cash In − Cash Refunds − Cashless ATM Cash Back.
              Other reconciliation fields stay at zero until updated elsewhere.
            </p>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
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
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Controller
                  <input
                    type="text"
                    className={inputClass}
                    value={form.controller}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, controller: e.target.value }))
                    }
                    autoComplete="off"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-3 sm:col-span-2">
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
                    Cash Refunds
                    <input
                      type="number"
                      step="any"
                      className={inputClass}
                      value={form.cashRefunds}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, cashRefunds: e.target.value }))
                      }
                    />
                  </label>
                  <label className="block text-sm text-gray-700">
                    Cashless ATM Cash Back
                    <input
                      type="number"
                      step="any"
                      className={inputClass}
                      value={form.cashlessAtmCashBack}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          cashlessAtmCashBack: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700 sm:col-span-2">
                  <span className="text-gray-600">Reported cash collected: </span>
                  <span className="font-semibold tabular-nums text-gray-900">
                    {cashFmt.format(
                      reportedCashCollectedComputed({
                        cashIn: Number(form.cashIn || 0),
                        cashRefunds: Number(form.cashRefunds || 0),
                        cashlessAtmCashBack: Number(
                          form.cashlessAtmCashBack || 0
                        ),
                      })
                    )}
                  </span>
                  <span className="ml-1 block text-xs text-gray-500 sm:inline sm:ml-2">
                    (Cash In − Cash Refunds − Cashless ATM Cash Back)
                  </span>
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeAddModal}
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

export default POSReconcile;
