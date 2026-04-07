/** UI model for Cashless ATM Summary (mapped from API). */
export type CashlessATMItem = {
  id: number;
  storeId?: number;
  /** Display date (locale). */
  date: string;
  /** YYYY-MM-DD from API for filtering/search. */
  dateValue: string;
  employee: string;
  terminal: string;
  debitTotalDispensed: number;
  totalTips: number;
  debitTotalSales: number;
  totalCashBack: number;
  blazeCashlessSales: number;
  totalCashlessATMChange: number;
  /** Blaze cashless sales − debit total sales (computed for table only). */
  totalSalesDifference: number;
  /** Total cashless ATM change on Blaze − total cash back on receipt (computed). */
  cashbackDifference: number;
  notes: string;
};
