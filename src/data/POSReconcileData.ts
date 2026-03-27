export interface POSReconcileItem {
    date: string;
    controller: string;
    cashIn: number;
    cashRefunds: number;
    cashlessAtmCashBack: number;
    reportedCashCollected: number;
    cashCollected: number;
    cashDifference: number;
    creditDifference: number;
    cashlessAtmDifference: number;
    cashVsCashlessAtmDifference: number;
    notes: string;
  }
  
  export const posData: POSReconcileItem[] = [
    {
      date: "2026-03-28",
      controller: "John D",
      cashIn: 1000,
      cashRefunds: 50,
      cashlessAtmCashBack: 20,
      reportedCashCollected: 920,
      cashCollected: 930,
      cashDifference: 10,
      creditDifference: 5,
      cashlessAtmDifference: 2,
      cashVsCashlessAtmDifference: 8,
      notes: "Balanced",
    },
    {
      date: "2026-03-28",
      controller: "Mary K",
      cashIn: 1500,
      cashRefunds: 100,
      cashlessAtmCashBack: 30,
      reportedCashCollected: 1370,
      cashCollected: 1365,
      cashDifference: 5,
      creditDifference: 0,
      cashlessAtmDifference: 1,
      cashVsCashlessAtmDifference: 4,
      notes: "Minor discrepancy",
    },
  ];