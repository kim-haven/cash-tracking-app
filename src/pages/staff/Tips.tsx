import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Download } from "lucide-react";
import TableLayout from "../../components/TableLayout";
import type { Column } from "../../components/TableLayout";
import SearchBar from "../../components/SearchBar";
import Pagination from "../../components/Pagination";
import {
  formatUsShortDate,
  todayDateInputMax,
  toDateInputValue,
} from "../../utils/usShortDate";
import {
  fetchAllTips,
  createTip,
  updateTip,
  deleteTip,
  downloadTipsTemplate,
  type TipItem,
} from "../../api/tipsApi";
import { useStore } from "../../context/StoreContext";
import { resolveStoreIdForWrite } from "../../utils/storeScope";

type TipFormState = {
  initials: string;
  cash_tip_amount: string;
  date: string;
  cash_tip: string;
  credit_tips: string;
  ach_tips: string;
  debit_tips: string;
  note: string;
};

function emptyTipForm(): TipFormState {
  return {
    initials: "",
    cash_tip_amount: "",
    date: "",
    cash_tip: "",
    credit_tips: "",
    ach_tips: "",
    debit_tips: "",
    note: "",
  };
}

function tipToForm(row: TipItem): TipFormState {
  return {
    initials: row.initials ?? "",
    cash_tip_amount: String(row.cash_tip_amount ?? ""),
    date: toDateInputValue(row.date ?? ""),
    cash_tip: String(row.cash_tip ?? ""),
    credit_tips: String(row.credit_tips ?? ""),
    ach_tips: String(row.ach_tips ?? ""),
    debit_tips: String(row.debit_tips ?? ""),
    note: row.note ?? "",
  };
}

function tipComponentsFromForm(form: TipFormState): number {
  return (
    Number(form.cash_tip || 0) +
    Number(form.credit_tips || 0) +
    Number(form.ach_tips || 0) +
    Number(form.debit_tips || 0)
  );
}

/** JSON number[] — tip row ids where payout was clicked; only those rows show $0 cash balance. */
const TIPS_PAYOUT_ZEROED_TIP_IDS_KEY = "tipsPayoutZeroedTipIds";
/** JSON Record<tipId, number> — full running balance transferred at payout (End of Pay snapshot for that row). */
const TIPS_PAYOUT_TRANSFERRED_BY_TIP_ID_KEY = "tipsPayoutTransferredByTipId";
/** JSON { afterDate, afterId } — tips strictly after this (date, id) restart cash balance from $0. */
const TIPS_PAYOUT_GLOBAL_CHECKPOINT_KEY = "tipsPayoutGlobalCheckpoint";

type PayoutGlobalCheckpoint = { afterDate: string; afterId: number };
/** @deprecated — cleared on load */
const TIPS_PAYOUT_CHECKPOINT_KEY_LEGACY = "cashTipsPayoutCheckpoint";
const TIPS_PAYOUT_COMPLETED_YMDS_KEY_LEGACY = "tipsPayoutCompletedYmds";
const TIPS_PAYOUT_CUTOFF_BY_YMD_KEY_LEGACY = "tipsPayoutCutoffByYmd";
const TIPS_PAYOUT_END_OF_PAY_BY_YMD_KEY_LEGACY = "tipsPayoutEndOfPayTransferredByYmd";

/** YYYY-MM-DD prefix for matching rows. */
function ymdKeyFromDateString(dateStr: string): string | null {
  const iso = String(dateStr ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : null;
}

function todayYmdLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readPayoutZeroedTipIds(): Set<number> {
  try {
    const raw = localStorage.getItem(TIPS_PAYOUT_ZEROED_TIP_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(
      arr.filter(
        (x): x is number =>
          typeof x === "number" && Number.isFinite(x)
      )
    );
  } catch {
    return new Set();
  }
}

function readPayoutTransferredByTipId(): Record<number, number> {
  try {
    const raw = localStorage.getItem(TIPS_PAYOUT_TRANSFERRED_BY_TIP_ID_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<number, number> = {};
    for (const [k, v] of Object.entries(j)) {
      const id = Number(k);
      if (Number.isFinite(id) && typeof v === "number" && Number.isFinite(v)) {
        out[id] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function readPayoutGlobalCheckpoint(): PayoutGlobalCheckpoint | null {
  try {
    const raw = localStorage.getItem(TIPS_PAYOUT_GLOBAL_CHECKPOINT_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as { afterDate?: string; afterId?: number };
    if (
      typeof j.afterDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(j.afterDate) &&
      typeof j.afterId === "number" &&
      Number.isFinite(j.afterId)
    ) {
      return { afterDate: j.afterDate, afterId: j.afterId };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function migrateLegacyPayoutStorage(): void {
  try {
    localStorage.removeItem("tipsPayoutCompletedYmd");
    localStorage.removeItem(TIPS_PAYOUT_COMPLETED_YMDS_KEY_LEGACY);
    localStorage.removeItem(TIPS_PAYOUT_CUTOFF_BY_YMD_KEY_LEGACY);
    localStorage.removeItem(TIPS_PAYOUT_END_OF_PAY_BY_YMD_KEY_LEGACY);
  } catch {
    /* ignore */
  }
}

/** Row is strictly after `cp` in global (date asc, id asc) order. */
function isStrictlyAfterCheckpoint(
  row: TipItem,
  cp: PayoutGlobalCheckpoint
): boolean {
  const dk = ymdKeyFromDateString(row.date);
  if (!dk) return false;
  if (dk > cp.afterDate) return true;
  if (dk < cp.afterDate) return false;
  return row.id > cp.afterId;
}

/**
 * Running total after the latest payout checkpoint — only `cash_tip_amount`
 * from rows strictly after the checkpoint, through `row`.
 */
function afterCheckpointRunningTotal(
  items: TipItem[],
  row: TipItem,
  cp: PayoutGlobalCheckpoint
): number {
  const targetY = ymdKeyFromDateString(row.date);
  if (!targetY) return Number(row.cash_tip_amount ?? 0);
  let sum = 0;
  for (const it of items) {
    if (!isStrictlyAfterCheckpoint(it, cp)) continue;
    const dk = ymdKeyFromDateString(it.date);
    if (!dk) continue;
    if (dk < targetY) {
      sum += Number(it.cash_tip_amount ?? 0);
    } else if (dk === targetY && it.id <= row.id) {
      sum += Number(it.cash_tip_amount ?? 0);
    }
  }
  return sum;
}

function afterCheckpointRunningTotalForPayload(
  form: TipFormState,
  items: TipItem[],
  editingId: number | null,
  cp: PayoutGlobalCheckpoint
): number {
  const targetY = ymdKeyFromDateString(form.date);
  const virtualAmount = Number(form.cash_tip_amount || 0);
  if (!targetY) return virtualAmount;

  let sum = 0;
  for (const it of items) {
    if (editingId != null && it.id === editingId) continue;
    if (!isStrictlyAfterCheckpoint(it, cp)) continue;
    const dk = ymdKeyFromDateString(it.date);
    if (!dk) continue;
    if (dk < targetY) {
      sum += Number(it.cash_tip_amount ?? 0);
    } else if (dk === targetY) {
      sum += Number(it.cash_tip_amount ?? 0);
    }
  }
  sum += virtualAmount;
  return sum;
}

/** Latest row when sorting by calendar date, then id. */
function findLastRowInOrder(items: TipItem[]): TipItem | null {
  if (items.length === 0) return null;
  let best = items[0];
  for (let i = 1; i < items.length; i++) {
    const it = items[i];
    const bd = ymdKeyFromDateString(best.date);
    const idk = ymdKeyFromDateString(it.date);
    if (!idk) continue;
    if (!bd) {
      best = it;
      continue;
    }
    if (idk > bd || (idk === bd && it.id > best.id)) best = it;
  }
  return best;
}

function addOneCalendarDayYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/**
 * Running total of every row’s `cash_tip_amount` in global order: calendar date
 * ascending, then `id` ascending.
 */
function globalRunningCashTipTotal(items: TipItem[], row: TipItem): number {
  const targetY = ymdKeyFromDateString(row.date);
  if (!targetY) return Number(row.cash_tip_amount ?? 0);
  let sum = 0;
  for (const it of items) {
    const dk = ymdKeyFromDateString(it.date);
    if (!dk) continue;
    if (dk < targetY) {
      sum += Number(it.cash_tip_amount ?? 0);
    } else if (dk === targetY && it.id <= row.id) {
      sum += Number(it.cash_tip_amount ?? 0);
    }
  }
  return sum;
}

/** Same running total when saving: all prior dates + same-day rows except the one being replaced, then form amount. */
function globalRunningCashTipTotalForPayload(
  form: TipFormState,
  items: TipItem[],
  editingId: number | null
): number {
  const targetY = ymdKeyFromDateString(form.date);
  const virtualAmount = Number(form.cash_tip_amount || 0);
  if (!targetY) return virtualAmount;

  let sum = 0;
  for (const it of items) {
    if (editingId != null && it.id === editingId) continue;
    const dk = ymdKeyFromDateString(it.date);
    if (!dk) continue;
    if (dk < targetY) {
      sum += Number(it.cash_tip_amount ?? 0);
    } else if (dk === targetY) {
      sum += Number(it.cash_tip_amount ?? 0);
    }
  }
  sum += virtualAmount;
  return sum;
}

function formIsStrictlyAfterCheckpoint(
  form: TipFormState,
  editingId: number | null,
  cp: PayoutGlobalCheckpoint
): boolean {
  const targetY = ymdKeyFromDateString(form.date);
  if (!targetY) return false;
  const virtualId = editingId ?? Number.MAX_SAFE_INTEGER;
  if (targetY > cp.afterDate) return true;
  if (targetY < cp.afterDate) return false;
  return virtualId > cp.afterId;
}

function displayCashBalance(
  items: TipItem[],
  row: TipItem,
  payoutZeroedTipIds: Set<number>,
  payoutGlobalCheckpoint: PayoutGlobalCheckpoint | null
): number {
  if (payoutZeroedTipIds.has(row.id)) return 0;
  if (
    payoutGlobalCheckpoint &&
    isStrictlyAfterCheckpoint(row, payoutGlobalCheckpoint)
  ) {
    return afterCheckpointRunningTotal(items, row, payoutGlobalCheckpoint);
  }
  return globalRunningCashTipTotal(items, row);
}

function buildTipPayload(
  form: TipFormState,
  items: TipItem[],
  editingId: number | null,
  payoutZeroedTipIds: Set<number>,
  payoutGlobalCheckpoint: PayoutGlobalCheckpoint | null
): Omit<TipItem, "id"> {
  const todayCashTipAmount = Number(form.cash_tip_amount || 0);
  const cashTip = Number(form.cash_tip || 0);
  let running: number;
  if (editingId !== null && payoutZeroedTipIds.has(editingId)) {
    running = 0;
  } else if (
    payoutGlobalCheckpoint &&
    formIsStrictlyAfterCheckpoint(form, editingId, payoutGlobalCheckpoint)
  ) {
    running = afterCheckpointRunningTotalForPayload(
      form,
      items,
      editingId,
      payoutGlobalCheckpoint
    );
  } else {
    running = globalRunningCashTipTotalForPayload(form, items, editingId);
  }
  const existing =
    editingId != null ? items.find((i) => i.id === editingId) : undefined;

  return {
    initials: form.initials.trim(),
    cash_tip_amount: todayCashTipAmount,
    end_of_pay_period_total: existing?.end_of_pay_period_total ?? 0,
    /** Running cash balance (0 if this tip row was payout-zeroed). */
    cash_balance: running,
    date: form.date,
    cash_tip: cashTip,
    credit_tips: Number(form.credit_tips || 0),
    ach_tips: Number(form.ach_tips || 0),
    debit_tips: Number(form.debit_tips || 0),
    total: tipComponentsFromForm(form),
    note: form.note.trim(),
  };
}

/** Sum of the four tip-type columns for one row (the “daily” tips total). */
function tipComponentsSum(row: TipItem): number {
  return (
    Number(row.cash_tip ?? 0) +
    Number(row.credit_tips ?? 0) +
    Number(row.ach_tips ?? 0) +
    Number(row.debit_tips ?? 0)
  );
}

const Tips: React.FC = () => {
  const { selectedPhysicalStoreId } = useStore();
  const [items, setItems] = useState<TipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TipFormState>(emptyTipForm);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [templateDownloading, setTemplateDownloading] = useState(false);

  /** Tip row ids that had payout clicked — only those rows show $0 cash balance. */
  const [payoutZeroedTipIds, setPayoutZeroedTipIds] = useState<Set<number>>(
    () => new Set()
  );
  /** Transferred amount at payout, keyed by tip row id (End of Pay snapshot for that row). */
  const [payoutTransferredByTipId, setPayoutTransferredByTipId] = useState<
    Record<number, number>
  >({});
  /** After payout, new tips after this (date, id) use a fresh running total from $0. */
  const [payoutGlobalCheckpoint, setPayoutGlobalCheckpoint] =
    useState<PayoutGlobalCheckpoint | null>(null);
  const [payoutResultOpen, setPayoutResultOpen] = useState(false);
  const [payoutClearedAmount, setPayoutClearedAmount] = useState(0);

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchAllTips(selectedPhysicalStoreId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load tips"
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

  useEffect(() => {
    migrateLegacyPayoutStorage();
    setPayoutZeroedTipIds(readPayoutZeroedTipIds());
    setPayoutTransferredByTipId(readPayoutTransferredByTipId());
    setPayoutGlobalCheckpoint(readPayoutGlobalCheckpoint());
    try {
      localStorage.removeItem(TIPS_PAYOUT_CHECKPOINT_KEY_LEGACY);
    } catch {
      /* ignore */
    }
  }, []);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.date.toLowerCase().includes(term) ||
        formatUsShortDate(item.date).toLowerCase().includes(term) ||
        item.initials.toLowerCase().includes(term) ||
        (item.note || "").toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  /** Lookup next calendar day’s row for the same initials (for Total column). */
  const tipsByInitialsAndDate = useMemo(() => {
    const m = new Map<string, TipItem>();
    for (const it of items) {
      const y = ymdKeyFromDateString(it.date);
      if (!y) continue;
      const key = `${it.initials.trim().toLowerCase()}|${y}`;
      m.set(key, it);
    }
    return m;
  }, [items]);

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
    setForm(emptyTipForm());
    setSubmitError(null);
    setAddOpen(true);
  };

  const openEditModal = useCallback((row: TipItem) => {
    setEditingId(row.id);
    setForm(tipToForm(row));
    setSubmitError(null);
    setAddOpen(true);
  }, []);

  const openDeleteConfirm = useCallback((id: number) => {
    setDeleteError(null);
    setDeleteTargetId(id);
  }, []);

  const closeTipModal = () => {
    setAddOpen(false);
    setEditingId(null);
  };

  const handlePayout = useCallback(() => {
    const last = findLastRowInOrder(items);
    if (!last) return;
    const dk = ymdKeyFromDateString(last.date);
    if (!dk || dk !== todayYmdLocal()) return;

    const cleared = displayCashBalance(
      items,
      last,
      payoutZeroedTipIds,
      payoutGlobalCheckpoint
    );

    setPayoutZeroedTipIds((prev) => {
      const next = new Set(prev);
      next.add(last.id);
      try {
        localStorage.setItem(
          TIPS_PAYOUT_ZEROED_TIP_IDS_KEY,
          JSON.stringify([...next])
        );
      } catch {
        /* ignore */
      }
      return next;
    });

    setPayoutTransferredByTipId((prev) => {
      const next = { ...prev, [last.id]: cleared };
      try {
        localStorage.setItem(
          TIPS_PAYOUT_TRANSFERRED_BY_TIP_ID_KEY,
          JSON.stringify(next)
        );
      } catch {
        /* ignore */
      }
      return next;
    });

    const cp: PayoutGlobalCheckpoint = { afterDate: dk, afterId: last.id };
    setPayoutGlobalCheckpoint(cp);
    try {
      localStorage.setItem(
        TIPS_PAYOUT_GLOBAL_CHECKPOINT_KEY,
        JSON.stringify(cp)
      );
    } catch {
      /* ignore */
    }

    setPayoutClearedAmount(cleared);
    setPayoutResultOpen(true);
  }, [items, payoutZeroedTipIds, payoutGlobalCheckpoint]);

  const handleDeleteConfirm = async () => {
    if (deleteTargetId === null) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const removedId = deleteTargetId;
      await deleteTip(deleteTargetId);
      setDeleteTargetId(null);
      setPayoutZeroedTipIds((prev) => {
        if (!prev.has(removedId)) return prev;
        const next = new Set(prev);
        next.delete(removedId);
        try {
          localStorage.setItem(
            TIPS_PAYOUT_ZEROED_TIP_IDS_KEY,
            JSON.stringify([...next])
          );
        } catch {
          /* ignore */
        }
        return next;
      });
      setPayoutTransferredByTipId((prev) => {
        if (!(removedId in prev)) return prev;
        const { [removedId]: _, ...rest } = prev;
        try {
          localStorage.setItem(
            TIPS_PAYOUT_TRANSFERRED_BY_TIP_ID_KEY,
            JSON.stringify(rest)
          );
        } catch {
          /* ignore */
        }
        return rest;
      });
      setPayoutGlobalCheckpoint((prev) => {
        if (!prev || prev.afterId !== removedId) return prev;
        try {
          localStorage.removeItem(TIPS_PAYOUT_GLOBAL_CHECKPOINT_KEY);
        } catch {
          /* ignore */
        }
        return null;
      });
      const refreshed = await fetchAllTips(selectedPhysicalStoreId);
      setItems(refreshed);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete tip"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!form.date.trim()) {
      setSubmitError("Date is required.");
      return;
    }
    if (!form.initials.trim()) {
      setSubmitError("Initials are required.");
      return;
    }

    const base = buildTipPayload(
      form,
      items,
      editingId,
      payoutZeroedTipIds,
      payoutGlobalCheckpoint
    );
    const rowStore =
      editingId !== null
        ? items.find((r) => r.id === editingId)?.storeId
        : undefined;
    const storeId = resolveStoreIdForWrite(rowStore, selectedPhysicalStoreId);
    if (storeId === null) {
      setSubmitError(
        "Select a specific store in the header to add or edit tips."
      );
      return;
    }
    try {
      setSubmitting(true);
      if (editingId !== null) {
        await updateTip(editingId, { ...base, store_id: storeId });
      } else {
        await createTip({ ...base, store_id: storeId });
      }
      closeTipModal();
      setForm(emptyTipForm());
      const refreshed = await fetchAllTips(selectedPhysicalStoreId);
      setItems(refreshed);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : editingId !== null
            ? "Failed to update tip"
            : "Failed to create tip"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setSubmitError(null);
    setTemplateDownloading(true);
    try {
      await downloadTipsTemplate();
    } catch (err: unknown) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to download template"
      );
    } finally {
      setTemplateDownloading(false);
    }
  };

  const iconBtn =
    "inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 shadow-sm";

  const columns: Column<TipItem>[] = useMemo(
    () => [
      { header: "Initials", accessor: "initials" },
      {
        header: "Cash Tip Amount",
        accessor: "cash_tip_amount",
        render: (v) => (
          <span className="font-medium tabular-nums">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "End of Pay Period Total",
        accessor: "end_of_pay_period_total",
        render: (_v, row) => {
          const today = todayYmdLocal();
          const last = findLastRowInOrder(items);
          const isLastRowToday =
            last != null &&
            row.id === last.id &&
            ymdKeyFromDateString(row.date) === today;

          const transferredForRow = payoutTransferredByTipId[row.id];
          if (transferredForRow !== undefined) {
            return (
              <span
                className="font-semibold tabular-nums text-gray-900"
                title="Amount transferred at payout for this row (kept for monitoring)"
              >
                {cashFmt.format(transferredForRow)}
              </span>
            );
          }

          if (isLastRowToday && !payoutZeroedTipIds.has(last.id)) {
            const amount = displayCashBalance(
              items,
              last,
              payoutZeroedTipIds,
              payoutGlobalCheckpoint
            );
            return (
              <button
                type="button"
                onClick={handlePayout}
                aria-label="Payout"
                title="Full running cash balance at payout (restarts after payout)"
                className="min-w-22 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold tabular-nums text-white shadow-sm hover:bg-emerald-700"
              >
                {cashFmt.format(amount)}
              </button>
            );
          }

          return (
            <span className="text-gray-300" aria-hidden>
              —
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Cash Balance",
        accessor: "cash_balance",
        render: (_v, row) => {
          const display = displayCashBalance(
            items,
            row,
            payoutZeroedTipIds,
            payoutGlobalCheckpoint
          );
          const zeroedRow = payoutZeroedTipIds.has(row.id);
          const afterCp =
            payoutGlobalCheckpoint &&
            isStrictlyAfterCheckpoint(row, payoutGlobalCheckpoint);
          return (
            <span
              className="font-medium tabular-nums"
              title={
                zeroedRow
                  ? "Cash balance cleared for this payout row only"
                  : afterCp
                    ? "Running total after last payout (starts from $0 for new tips)"
                    : "Running total of cash tip amounts (by date, then id), including this row"
              }
            >
              {cashFmt.format(display)}
            </span>
          );
        },
        align: "right",
      },
      {
        header: "Date",
        accessor: "date",
        render: (val) => formatUsShortDate(String(val ?? "")),
      },
      {
        header: "Cash tip",
        accessor: "cash_tip",
        render: (v) => (
          <span className="font-medium tabular-nums text-green-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Credit tips",
        accessor: "credit_tips",
        render: (v) => (
          <span className="font-medium tabular-nums text-blue-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "ACH tips",
        accessor: "ach_tips",
        render: (v) => (
          <span className="font-medium tabular-nums text-purple-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Debit tips",
        accessor: "debit_tips",
        render: (v) => (
          <span className="font-medium tabular-nums text-red-600">
            {cashFmt.format(Number(v))}
          </span>
        ),
        align: "right",
      },
      {
        header: "Total",
        accessor: "total",
        render: (_v, row) => {
          const todaySum = tipComponentsSum(row);
          let tomorrowSum = 0;
          const y = ymdKeyFromDateString(row.date);
          if (y) {
            const nextYmd = addOneCalendarDayYmd(y);
            const nextRow = tipsByInitialsAndDate.get(
              `${row.initials.trim().toLowerCase()}|${nextYmd}`
            );
            if (nextRow) tomorrowSum = tipComponentsSum(nextRow);
          }
          const display = todaySum + tomorrowSum;
          return (
            <span
              className="font-bold tabular-nums text-gray-800"
              title="Cash + credit + ACH + debit for this date, plus the same for the next calendar day (same initials)"
            >
              {cashFmt.format(display)}
            </span>
          );
        },
        align: "right",
      },
      { header: "Note", accessor: "note" },
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
              aria-label="Edit tip"
              title="Edit"
            >
              <Pencil className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => openDeleteConfirm(row.id)}
              className={`${iconBtn} text-red-600 hover:bg-red-50`}
              aria-label="Delete tip"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ],
    [
      cashFmt,
      openEditModal,
      openDeleteConfirm,
      tipsByInitialsAndDate,
      items,
      payoutZeroedTipIds,
      payoutTransferredByTipId,
      payoutGlobalCheckpoint,
      handlePayout,
    ]
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="shrink-0 text-lg font-semibold text-gray-700">
          Tips Summary
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
              onClick={handleDownloadTemplate}
              disabled={templateDownloading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4 shrink-0" strokeWidth={2} />
              {templateDownloading ? "Downloading…" : "Template"}
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add Tip
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
          Loading tips…
        </div>
      ) : (
        <TableLayout
          data={currentRows}
          columns={columns}
          emptyMessage="No tips found"
          getRowKey={(row) => row.id}
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
          aria-labelledby="tip-form-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="tip-form-title"
              className="text-lg font-semibold text-gray-800"
            >
              {editingId !== null ? "Edit Tip" : "Add Tip"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cash balance is the running total of cash tip amounts in date order
              (then row id). After a payout, new tips restart from $0 for cash
              balance (only the payout row shows $0). Total is computed from the
              four tip columns.
            </p>

            <form onSubmit={handleTipSubmit} className="mt-4 space-y-4">
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
                  Initials
                  <input
                    type="text"
                    className={inputClass}
                    value={form.initials}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        initials: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Cash tip amount
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.cash_tip_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cash_tip_amount: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Cash tip
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.cash_tip}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cash_tip: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Credit tips
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.credit_tips}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        credit_tips: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  ACH tips
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.ach_tips}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, ach_tips: e.target.value }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Debit tips
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={form.debit_tips}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        debit_tips: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-sm text-gray-700 sm:col-span-2">
                  Note
                  <textarea
                    rows={2}
                    className={`${inputClass} resize-y`}
                    value={form.note}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, note: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={closeTipModal}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Saving…"
                    : editingId !== null
                      ? "Update"
                      : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payoutResultOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-result-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="payout-result-title"
              className="text-lg font-semibold text-gray-800"
            >
              Payout
            </h2>
            <p className="mt-3 text-sm text-gray-700">
              Cash balance cleared:{" "}
              <span className="font-semibold tabular-nums text-gray-900">
                {cashFmt.format(payoutClearedAmount)}
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              The End of Pay cell shows this transferred amount for that row.
              Only that row’s cash balance is $0. New tips after this payout
              build cash balance from $0 again. Add a tip and the payout button
              appears on the new last row.
            </p>
            <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setPayoutResultOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTargetId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tip-delete-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="tip-delete-title"
              className="text-lg font-semibold text-gray-800"
            >
              Delete tip
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              This cannot be undone. Remove this tip from the list?
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

export default Tips;
