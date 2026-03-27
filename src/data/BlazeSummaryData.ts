export type BlazeSummaryItem = {
  date: string;
  shop: string;
  company: string;
  queueType: string;
  adultRetailValueOfSales: number;
  medicalRetailValueOfSales: number;
  nonCannabisRetailValueOfSales: number;
  retailValueOfSales: number;
  adultGrossSales: number;
  medicalGrossSales: number;
  nonCannabisGrossSales: number;
  grossSales: number;
  action: string;
};

export const blazeSummaryData: BlazeSummaryItem[] = [
    {
      date: "2026-03-28",
      shop: "Shop A",
      company: "Company A",
      queueType: "Queue 1",
      adultRetailValueOfSales: 5000,
      medicalRetailValueOfSales: 3000,
      nonCannabisRetailValueOfSales: 1000,
      retailValueOfSales: 9000,
      adultGrossSales: 4800,
      medicalGrossSales: 2800,
      nonCannabisGrossSales: 900,
      grossSales: 8500,
      action: "View Details",
    },
    {
      date: "2026-03-29",
      shop: "Shop B",
      company: "Company B",
      queueType: "Queue 2",
      adultRetailValueOfSales: 6000,
      medicalRetailValueOfSales: 3500,
      nonCannabisRetailValueOfSales: 1200,
      retailValueOfSales: 10700,
      adultGrossSales: 5600,
      medicalGrossSales: 3200,
      nonCannabisGrossSales: 1100,
      grossSales: 9900,
      action: "View Details",
    },
    // Add more records as necessary
  ];