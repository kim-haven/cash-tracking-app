import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildApiUrl } from "../config/apiBase";
import { authorizedFetch } from "../api/authorizedFetch";
import { CANONICAL_STORE_NAMES } from "../constants/stores";

const STORAGE_KEY = "cash_track_selected_physical_store_id_v1";

export type ApiStore = {
  id: number;
  name: string;
  is_all_stores?: boolean;
};

type StoreContextValue = {
  stores: ApiStore[];
  storesReady: boolean;
  storesError: string | null;
  /** `null` = All Stores (no `store_id` query param). */
  selectedPhysicalStoreId: number | null;
  setSelectedPhysicalStoreId: (id: number | null) => void;
  selectedStoreLabel: string;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function sortStoresLikeBackend(list: ApiStore[]): ApiStore[] {
  const order = new Map(
    CANONICAL_STORE_NAMES.map((name, i) => [name, i] as const)
  );
  return [...list].sort((a, b) => {
    const ia = order.get(a.name) ?? CANONICAL_STORE_NAMES.length;
    const ib = order.get(b.name) ?? CANONICAL_STORE_NAMES.length;
    return ia - ib;
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<ApiStore[]>([]);
  const [storesReady, setStoresReady] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedPhysicalStoreId, setSelectedPhysicalStoreIdState] = useState<
    number | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    setStoresError(null);
    (async () => {
      try {
        const res = await authorizedFetch(buildApiUrl("/api/stores"), {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error(`Stores request failed (${res.status})`);
        }
        const body = (await res.json()) as { data?: ApiStore[] };
        const rows = Array.isArray(body.data) ? body.data : [];
        if (!cancelled) {
          setStores(sortStoresLikeBackend(rows));
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setStoresError(
            e instanceof Error ? e.message : "Failed to load stores"
          );
        }
      } finally {
        if (!cancelled) setStoresReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stores.length) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
    if (raw === "all" || raw === null) {
      setSelectedPhysicalStoreIdState(null);
      return;
    }
    const id = Number.parseInt(raw, 10);
    if (!Number.isFinite(id)) {
      setSelectedPhysicalStoreIdState(null);
      return;
    }
    const physical = stores.filter((s) => !s.is_all_stores);
    const exists = physical.some((s) => s.id === id);
    setSelectedPhysicalStoreIdState(exists ? id : null);
  }, [stores]);

  const setSelectedPhysicalStoreId = useCallback((id: number | null) => {
    setSelectedPhysicalStoreIdState(id);
    try {
      if (id === null) {
        localStorage.setItem(STORAGE_KEY, "all");
      } else {
        localStorage.setItem(STORAGE_KEY, String(id));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectedStoreLabel = useMemo(() => {
    if (selectedPhysicalStoreId === null) return "All Stores";
    const row = stores.find((s) => s.id === selectedPhysicalStoreId);
    return row?.name ?? "All Stores";
  }, [stores, selectedPhysicalStoreId]);

  const value = useMemo(
    () => ({
      stores,
      storesReady,
      storesError,
      selectedPhysicalStoreId,
      setSelectedPhysicalStoreId,
      selectedStoreLabel,
    }),
    [
      stores,
      storesReady,
      storesError,
      selectedPhysicalStoreId,
      setSelectedPhysicalStoreId,
      selectedStoreLabel,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}
