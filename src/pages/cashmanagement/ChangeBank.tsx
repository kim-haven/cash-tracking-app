import React, { useCallback, useEffect, useMemo, useState } from "react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import { buildApiUrl } from "../../config/apiBase";
import { authorizedFetch } from "../../api/authorizedFetch";
import { applyStoreIdParam, toRequestUrl } from "../../api/storeQuery";
import { useStore } from "../../context/StoreContext";
import { resolveStoreIdForWrite } from "../../utils/storeScope";
import { formatUsShortDate, todayDateInputMax } from "../../utils/usShortDate";
import { matchesTableSearch } from "../../utils/tableSearch";

const API_PATH = "/api/change-banks";

export type ChangeBankItem = {
  id: number;
  date: string;
  countAmount: number;
  changeIn: number;
  changeOut: number;
  description: string;
  deposit: number;
  pickedUp: number;
  sumOfPickups: number;
  balance: number;
  difference: number;
  notes: string;
};

function num(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function normalizeChangeBankRow(raw: Record<string, unknown>): ChangeBankItem {
  return {
    id: Number(raw.id),
    date: String(raw.date ?? "").slice(0, 10),
    countAmount: num(raw.count_amount ?? raw.countAmount),
    changeIn: num(raw.change_in ?? raw.changeIn),
    changeOut: num(raw.change_out ?? raw.changeOut),
    description: String(raw.description ?? ""),
    deposit: num(raw.deposit),
    pickedUp: num(raw.picked_up ?? raw.pickedUp),
    sumOfPickups: num(raw.sum_of_pickups ?? raw.sumOfPickups),
    balance: num(raw.balance),
    difference: num(raw.difference),
    notes: String(raw.notes ?? ""),
  };
}

async function fetchChangeBanks(
  storeId?: number | null
): Promise<ChangeBankItem[]> {
  const url = toRequestUrl(buildApiUrl(API_PATH));
  applyStoreIdParam(url, storeId ?? null);
  const res = await authorizedFetch(url.toString(), {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to load change bank (${res.status})`);
  }
  const json = (await res.json()) as { data?: unknown[] };
  const rows = Array.isArray(json.data) ? json.data : [];
  return rows.map((r) =>
    normalizeChangeBankRow(r as Record<string, unknown>)
  );
}

async function createChangeBank(
  payload: Record<string, unknown>
): Promise<ChangeBankItem> {
  const url = new URL(buildApiUrl(API_PATH), window.location.origin);
  const res = await authorizedFetch(url.toString(), {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "Failed to create entry";
    try {
      const err = (await res.json()) as { message?: string };
      if (typeof err.message === "string") msg = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const json = (await res.json()) as { data?: Record<string, unknown> };
  const raw = json.data;
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid response");
  }
  return normalizeChangeBankRow(raw as Record<string, unknown>);
}

type FormState = {
  date: string;
  countAmount: string;
  changeIn: string;
  changeOut: string;
  description: string;
  deposit: string;
  pickedUp: string;
  sumOfPickups: string;
  balance: string;
  difference: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    date: "",
    countAmount: "",
    changeIn: "",
    changeOut: "",
    description: "",
    deposit: "",
    pickedUp: "",
    sumOfPickups: "",
    balance: "",
    difference: "",
    notes: "",
  };
}

function parseMoney(s: string): number {
  const n = Number.parseFloat(String(s).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

const ChangeBank: React.FC = () => {
  const { selectedPhysicalStoreId } = useStore();
  const [items, setItems] = useState<ChangeBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(null);
    const rows = await fetchChangeBanks(selectedPhysicalStoreId);
    setItems(rows);
  }, [selectedPhysicalStoreId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchChangeBanks(selectedPhysicalStoreId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load change bank"
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

  const filteredData = useMemo(() => {
    return items.filter((item) =>
      matchesTableSearch(
        searchTerm,
        item.date,
        formatUsShortDate(item.date),
        item.description,
        item.notes
      )
    );
  }, [items, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const indexOfLastRow = safeCurrentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const cashFmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );

  const columns: Column<ChangeBankItem>[] = useMemo(
    () => [
      {
        header: "Date",
        accessor: "date",
        render: (v) => formatUsShortDate(String(v ?? "")),
      },
      {
        header: "Count Amount",
        accessor: "countAmount",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      {
        header: "Change In",
        accessor: "changeIn",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      {
        header: "Change Out",
        accessor: "changeOut",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      { header: "Description", accessor: "description" },
      {
        header: "Deposit",
        accessor: "deposit",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      {
        header: "Picked Up",
        accessor: "pickedUp",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      {
        header: "Sum of Pickups",
        accessor: "sumOfPickups",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      {
        header: "Balance",
        accessor: "balance",
        render: (value) => (
          <span className="font-medium tabular-nums">{cashFmt.format(Number(value))}</span>
        ),
        align: "right",
      },
      {
        header: "Difference",
        accessor: "difference",
        render: (value) => (
          <span className="font-medium tabular-nums text-red-500">
            {cashFmt.format(Number(value))}
          </span>
        ),
        align: "right",
      },
      { header: "Notes", accessor: "notes" },
    ],
    [cashFmt]
  );

  const openAdd = () => {
    setForm(emptyForm());
    setSubmitError(null);
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.date.trim()) {
      setSubmitError("Date is required.");
      return;
    }
    const storeId = resolveStoreIdForWrite(null, selectedPhysicalStoreId);
    if (storeId == null) {
      setSubmitError("Select a physical store in the header before adding.");
      return;
    }
    setSubmitting(true);
    try {
      await createChangeBank({
        store_id: storeId,
        date: form.date,
        count_amount: parseMoney(form.countAmount),
        change_in: parseMoney(form.changeIn),
        change_out: parseMoney(form.changeOut),
        description: form.description.trim() || null,
        deposit: parseMoney(form.deposit),
        picked_up: parseMoney(form.pickedUp),
        sum_of_pickups: parseMoney(form.sumOfPickups),
        balance: parseMoney(form.balance),
        difference: parseMoney(form.difference),
        notes: form.notes.trim() || null,
      });
      closeAdd();
      await refresh();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save entry"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-100">
          Change Bank Summary
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SearchBar
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
          />
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {loadError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
          getRowKey={(row) => row.id}
        />
      )}

      {!loading && (
        <Pagination
          totalPages={totalPages}
          currentPage={safeCurrentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-bank-add-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="change-bank-add-title"
              className="text-lg font-semibold text-gray-800"
            >
              Add change bank entry
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter amounts for this row. Values default to 0 if left blank.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {submitError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <label className="block text-sm text-gray-700">
                Date *
                <input
                  type="date"
                  required
                  max={todayDateInputMax()}
                  className={inputClass}
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["countAmount", "Count amount"],
                    ["changeIn", "Change in"],
                    ["changeOut", "Change out"],
                    ["deposit", "Deposit"],
                    ["pickedUp", "Picked up"],
                    ["sumOfPickups", "Sum of pickups"],
                    ["balance", "Balance"],
                    ["difference", "Difference"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-sm text-gray-700">
                    {label}
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputClass}
                      value={form[key]}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>

              <label className="block text-sm text-gray-700">
                Description
                <input
                  type="text"
                  className={inputClass}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>

              <label className="block text-sm text-gray-700">
                Notes
                <textarea
                  rows={3}
                  className={inputClass}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
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

export default ChangeBank;
