export type ATMReconcileItem = {
  date: string;
  terminal: string;
  debitTerminalTotalDispensed: number;
  totalTips: number;
  debitTotalSales: number;
  totalCashbackOnReceipt: number;
  blazeTotalCashlessSales: number;
  cashlessATMChangeOnBlaze: number;
  totalSalesDifference: number;
  cashbackDifference: number;
  notes: string;
};

export const ATMReconcileData: ATMReconcileItem[] = [
    {
      date: "2026-03-28",
      terminal: "Terminal 1",
      debitTerminalTotalDispensed: 1000,
      totalTips: 50,
      debitTotalSales: 1500,
      totalCashbackOnReceipt: 100,
      blazeTotalCashlessSales: 1100,
      cashlessATMChangeOnBlaze: 200,
      totalSalesDifference: -200, // Negative means more in Blaze than on Debit Terminal
      cashbackDifference: 100,
      notes: "Reconcile issue with terminal 1"
    },
    {
      date: "2026-03-29",
      terminal: "Terminal 2",
      debitTerminalTotalDispensed: 1200,
      totalTips: 60,
      debitTotalSales: 1700,
      totalCashbackOnReceipt: 120,
      blazeTotalCashlessSales: 1300,
      cashlessATMChangeOnBlaze: 250,
      totalSalesDifference: -100,
      cashbackDifference: 150,
      notes: "Discrepancy found in cash amount"
    },
    // More rows can be added
  ];