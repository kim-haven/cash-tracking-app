import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { SummaryScope } from "../utils/cashOnHandShared";

export const SUMMARY_OPTIONS: { scope: SummaryScope; label: string }[] = [
  { scope: "daily", label: "Daily summaries" },
  { scope: "weekly", label: "Weekly summaries" },
  { scope: "monthly", label: "Monthly summaries" },
  { scope: "all", label: "All data summaries" },
];

type SummaryScopeContextValue = {
  summaryScope: SummaryScope;
  setSummaryScope: (scope: SummaryScope) => void;
};

const SummaryScopeContext = createContext<SummaryScopeContextValue | null>(
  null
);

export function SummaryScopeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [summaryScope, setSummaryScopeState] =
    useState<SummaryScope>("all");

  const setSummaryScope = useCallback((scope: SummaryScope) => {
    setSummaryScopeState(scope);
  }, []);

  const value = useMemo(
    () => ({ summaryScope, setSummaryScope }),
    [summaryScope, setSummaryScope]
  );

  return (
    <SummaryScopeContext.Provider value={value}>
      {children}
    </SummaryScopeContext.Provider>
  );
}

export function useSummaryScope(): SummaryScopeContextValue {
  const ctx = useContext(SummaryScopeContext);
  if (!ctx) {
    throw new Error(
      "useSummaryScope must be used within SummaryScopeProvider"
    );
  }
  return ctx;
}
