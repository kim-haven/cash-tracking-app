/** Display `date` field as locale date when value is `YYYY-MM-DD`. */
export function formatBlazeSummaryDate(ymd: string): string {
  const s = ymd?.trim() ?? "";
  if (!s) return "";
  const core = s.length >= 10 ? s.slice(0, 10) : s;
  const d = new Date(`${core}T12:00:00`);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

/** Blaze pivot / accounting export — one row per date·shop·company·queue slice. */
export type BlazeSummaryItem = {
  id: number;
  date: string;
  shop: string;
  company: string;
  queueType: string;
  adultRetailValueOfSales: number;
  medicalRetailValueOfSales: number;
  nonCannabisRetailValueOfSales: number;
  retailValueOfSales: number;
  preAlExciseTax: number;
  preNalExciseTax: number;
  preCityTax: number;
  preCountyTax: number;
  preStateTax: number;
  preFederalTax: number;
  adultGrossSales: number;
  medicalGrossSales: number;
  nonCannabisGrossSales: number;
  grossSales: number;
  deliveryFee: number;
  achFee: number;
  blazepayFee: number;
  aeropayFee: number;
  blazepayAchFee: number;
  cashlessAtmFee: number;
  cashFee: number;
  creditDebitFee: number;
  strongholdFee: number;
  preTaxDiscount: number;
  adultNetSales: number;
  adultNetSalesWoFees: number;
  medicalNetSales: number;
  medicalNetSalesWoFees: number;
  nonCannabisNetSales: number;
  nonCannabisNetSalesWoFees: number;
  netSales: number;
  netSalesWoFees: number;
  postAlExciseTax: number;
  postNalExciseTax: number;
  postCityTax: number;
  postCountyTax: number;
  postStateTax: number;
  postFederalTax: number;
  deliveryFeeExciseTax: number;
  cityDeliveryFeeTax: number;
  countyDeliveryFeeTax: number;
  stateDeliveryFeeTax: number;
  federalDeliveryFeeTax: number;
  adultTotalTax: number;
  medicalTotalTax: number;
  nonCannabisTotalTax: number;
  totalTax: number;
  afterTaxDiscount: number;
  rounding: number;
  adjustments: number;
  adultTotalDue: number;
  medicalTotalDue: number;
  nonCannabisTotalDue: number;
  totalDue: number;
  tips: number;
  blazepayTips: number;
  aeropayTips: number;
  blazepayAchTips: number;
  numberOfTransactions: number;
  countOfCompletedSales: number;
  countOfRefunds: number;
  newMembers: number;
  returningMembers: number;
  adultCogs: number;
  medicalCogs: number;
  nonCannabisCogs: number;
  achTendered: number;
  blazepayTendered: number;
  aeropayTendered: number;
  blazepayAchTendered: number;
  cashlessAtmTendered: number;
  cashTendered: number;
  checkTendered: number;
  creditDebitTendered: number;
  giftCardTendered: number;
  birchmountTendered: number;
  storeCreditTendered: number;
  strongholdTendered: number;
  paymentTendered: number;
  achChangeDue: number;
  blazepayChangeDue: number;
  aeropayChangeDue: number;
  blazepayAchChangeDue: number;
  cashlessAtmChangeDue: number;
  cashChangeDue: number;
  checkChangeDue: number;
  creditDebitChangeDue: number;
  giftCardChangeDue: number;
  storeCreditChangeDue: number;
  strongholdChangeDue: number;
  changeDue: number;
  itemsSold: number;
  itemsRefunded: number;
  refundTotalDue: number;
  surchargeFeeTax: number;
  blazepayCashback: number;
  aeropayCashback: number;
  blazepayAchCashback: number;
  cashlessAtmCashback: number;
  untaxedFee: number;
};

export type BlazeSummaryColumnKind = "text" | "money" | "int";

export type BlazeSummaryColumnSpec = {
  header: string;
  accessor: keyof BlazeSummaryItem;
  kind: BlazeSummaryColumnKind;
};

/** Column order and labels match Blaze accounting export. */
export const blazeSummaryColumnSpecs: BlazeSummaryColumnSpec[] = [
  { header: "Date", accessor: "date", kind: "text" },
  { header: "Shop", accessor: "shop", kind: "text" },
  { header: "Company", accessor: "company", kind: "text" },
  { header: "Queue Type", accessor: "queueType", kind: "text" },
  {
    header: "Adult Retail Value of Sales",
    accessor: "adultRetailValueOfSales",
    kind: "money",
  },
  {
    header: "Medical Retail Value of Sales",
    accessor: "medicalRetailValueOfSales",
    kind: "money",
  },
  {
    header: "Non-Cannabis Retail Value of Sales",
    accessor: "nonCannabisRetailValueOfSales",
    kind: "money",
  },
  { header: "Retail Value of Sales", accessor: "retailValueOfSales", kind: "money" },
  { header: "Pre AL Excise Tax", accessor: "preAlExciseTax", kind: "money" },
  { header: "Pre NAL Excise Tax", accessor: "preNalExciseTax", kind: "money" },
  { header: "Pre City Tax", accessor: "preCityTax", kind: "money" },
  { header: "Pre County Tax", accessor: "preCountyTax", kind: "money" },
  { header: "Pre State Tax", accessor: "preStateTax", kind: "money" },
  { header: "Pre Federal Tax", accessor: "preFederalTax", kind: "money" },
  { header: "Adult Gross Sales", accessor: "adultGrossSales", kind: "money" },
  { header: "Medical Gross Sales", accessor: "medicalGrossSales", kind: "money" },
  {
    header: "Non-Cannabis Gross Sales",
    accessor: "nonCannabisGrossSales",
    kind: "money",
  },
  { header: "Gross Sales", accessor: "grossSales", kind: "money" },
  { header: "Delivery Fee", accessor: "deliveryFee", kind: "money" },
  { header: "ACH Fee", accessor: "achFee", kind: "money" },
  { header: "BLAZEPay Fee", accessor: "blazepayFee", kind: "money" },
  { header: "Aeropay Fee", accessor: "aeropayFee", kind: "money" },
  { header: "BLAZEPAY ACH Fee", accessor: "blazepayAchFee", kind: "money" },
  { header: "CashlessATM Fee", accessor: "cashlessAtmFee", kind: "money" },
  { header: "Cash Fee", accessor: "cashFee", kind: "money" },
  { header: "Credit/Debit Fee", accessor: "creditDebitFee", kind: "money" },
  { header: "Stronghold Fee", accessor: "strongholdFee", kind: "money" },
  { header: "Pre-Tax Discount", accessor: "preTaxDiscount", kind: "money" },
  { header: "Adult Net Sales", accessor: "adultNetSales", kind: "money" },
  {
    header: "Adult Net Sales w/o Fees",
    accessor: "adultNetSalesWoFees",
    kind: "money",
  },
  { header: "Medical Net Sales", accessor: "medicalNetSales", kind: "money" },
  {
    header: "Medical Net Sales w/o Fees",
    accessor: "medicalNetSalesWoFees",
    kind: "money",
  },
  {
    header: "Non-Cannabis Net Sales",
    accessor: "nonCannabisNetSales",
    kind: "money",
  },
  {
    header: "Non-Cannabis Net Sales w/o Fees",
    accessor: "nonCannabisNetSalesWoFees",
    kind: "money",
  },
  { header: "Net Sales", accessor: "netSales", kind: "money" },
  { header: "Net Sales w/o Fees", accessor: "netSalesWoFees", kind: "money" },
  { header: "Post AL Excise Tax", accessor: "postAlExciseTax", kind: "money" },
  { header: "Post NAL Excise Tax", accessor: "postNalExciseTax", kind: "money" },
  { header: "Post City Tax", accessor: "postCityTax", kind: "money" },
  { header: "Post County Tax", accessor: "postCountyTax", kind: "money" },
  { header: "Post State Tax", accessor: "postStateTax", kind: "money" },
  { header: "Post Federal Tax", accessor: "postFederalTax", kind: "money" },
  {
    header: "Delivery Fee Excise Tax",
    accessor: "deliveryFeeExciseTax",
    kind: "money",
  },
  {
    header: "City Delivery Fee Tax",
    accessor: "cityDeliveryFeeTax",
    kind: "money",
  },
  {
    header: "County Delivery Fee Tax",
    accessor: "countyDeliveryFeeTax",
    kind: "money",
  },
  {
    header: "State Delivery Fee Tax",
    accessor: "stateDeliveryFeeTax",
    kind: "money",
  },
  {
    header: "Federal Delivery Fee Tax",
    accessor: "federalDeliveryFeeTax",
    kind: "money",
  },
  { header: "Adult Total Tax", accessor: "adultTotalTax", kind: "money" },
  { header: "Medical Total Tax", accessor: "medicalTotalTax", kind: "money" },
  {
    header: "Non-Cannabis Total Tax",
    accessor: "nonCannabisTotalTax",
    kind: "money",
  },
  { header: "Total Tax", accessor: "totalTax", kind: "money" },
  { header: "After Tax Discount", accessor: "afterTaxDiscount", kind: "money" },
  { header: "Rounding", accessor: "rounding", kind: "money" },
  { header: "Adjustments", accessor: "adjustments", kind: "money" },
  { header: "Adult Total Due", accessor: "adultTotalDue", kind: "money" },
  { header: "Medical Total Due", accessor: "medicalTotalDue", kind: "money" },
  {
    header: "Non-Cannabis Total Due",
    accessor: "nonCannabisTotalDue",
    kind: "money",
  },
  { header: "Total Due", accessor: "totalDue", kind: "money" },
  { header: "Tips", accessor: "tips", kind: "money" },
  { header: "BLAZEPAY Tips", accessor: "blazepayTips", kind: "money" },
  { header: "Aeropay Tips", accessor: "aeropayTips", kind: "money" },
  { header: "BLAZEPAY ACH Tips", accessor: "blazepayAchTips", kind: "money" },
  {
    header: "Number of Transactions",
    accessor: "numberOfTransactions",
    kind: "int",
  },
  {
    header: "Count of Completed Sales",
    accessor: "countOfCompletedSales",
    kind: "int",
  },
  { header: "Count of Refunds", accessor: "countOfRefunds", kind: "int" },
  { header: "New Members", accessor: "newMembers", kind: "int" },
  { header: "Returning Members", accessor: "returningMembers", kind: "int" },
  { header: "Adult COGS", accessor: "adultCogs", kind: "money" },
  { header: "Medical COGS", accessor: "medicalCogs", kind: "money" },
  { header: "Non-Cannabis COGS", accessor: "nonCannabisCogs", kind: "money" },
  { header: "ACH Tendered", accessor: "achTendered", kind: "money" },
  { header: "BLAZEPay Tendered", accessor: "blazepayTendered", kind: "money" },
  { header: "Aeropay Tendered", accessor: "aeropayTendered", kind: "money" },
  {
    header: "BLAZEPAY ACH Tendered",
    accessor: "blazepayAchTendered",
    kind: "money",
  },
  {
    header: "CashlessATM Tendered",
    accessor: "cashlessAtmTendered",
    kind: "money",
  },
  { header: "Cash Tendered", accessor: "cashTendered", kind: "money" },
  { header: "Check Tendered", accessor: "checkTendered", kind: "money" },
  {
    header: "Credit/Debit Tendered",
    accessor: "creditDebitTendered",
    kind: "money",
  },
  { header: "Gift Card Tendered", accessor: "giftCardTendered", kind: "money" },
  {
    header: "Birchmount Tendered",
    accessor: "birchmountTendered",
    kind: "money",
  },
  {
    header: "Store Credit Tendered",
    accessor: "storeCreditTendered",
    kind: "money",
  },
  {
    header: "Stronghold Tendered",
    accessor: "strongholdTendered",
    kind: "money",
  },
  { header: "Payment Tendered", accessor: "paymentTendered", kind: "money" },
  { header: "ACH Change Due", accessor: "achChangeDue", kind: "money" },
  {
    header: "BLAZEPay Change Due",
    accessor: "blazepayChangeDue",
    kind: "money",
  },
  {
    header: "Aeropay Change Due",
    accessor: "aeropayChangeDue",
    kind: "money",
  },
  {
    header: "BLAZEPAY ACH Change Due",
    accessor: "blazepayAchChangeDue",
    kind: "money",
  },
  {
    header: "CashlessATM Change Due",
    accessor: "cashlessAtmChangeDue",
    kind: "money",
  },
  { header: "Cash Change Due", accessor: "cashChangeDue", kind: "money" },
  { header: "Check Change Due", accessor: "checkChangeDue", kind: "money" },
  {
    header: "Credit/Debit Change Due",
    accessor: "creditDebitChangeDue",
    kind: "money",
  },
  {
    header: "Gift Card Change Due",
    accessor: "giftCardChangeDue",
    kind: "money",
  },
  {
    header: "Store Credit Change Due",
    accessor: "storeCreditChangeDue",
    kind: "money",
  },
  {
    header: "Stronghold Change Due",
    accessor: "strongholdChangeDue",
    kind: "money",
  },
  { header: "Change Due", accessor: "changeDue", kind: "money" },
  { header: "Items Sold", accessor: "itemsSold", kind: "int" },
  { header: "Items Refunded", accessor: "itemsRefunded", kind: "int" },
  { header: "Refund Total Due", accessor: "refundTotalDue", kind: "money" },
  { header: "Surcharge Fee Tax", accessor: "surchargeFeeTax", kind: "money" },
  {
    header: "BLAZEPay Cashback",
    accessor: "blazepayCashback",
    kind: "money",
  },
  { header: "Aeropay Cashback", accessor: "aeropayCashback", kind: "money" },
  {
    header: "BLAZEPAY ACH Cashback",
    accessor: "blazepayAchCashback",
    kind: "money",
  },
  {
    header: "CashlessATM Cashback",
    accessor: "cashlessAtmCashback",
    kind: "money",
  },
  { header: "Untaxed Fee", accessor: "untaxedFee", kind: "money" },
];

const Z = 0;

export const blazeSummaryData: BlazeSummaryItem[] = [
  {
    id: 1,
    date: "2026-03-28",
    shop: "Belmont",
    company: "Acme Retail",
    queueType: "In-store",
    adultRetailValueOfSales: 12_400,
    medicalRetailValueOfSales: 2_100,
    nonCannabisRetailValueOfSales: 890,
    retailValueOfSales: 15_390,
    preAlExciseTax: 1_240,
    preNalExciseTax: 420,
    preCityTax: 180,
    preCountyTax: 95,
    preStateTax: 1_100,
    preFederalTax: Z,
    adultGrossSales: 11_200,
    medicalGrossSales: 1_900,
    nonCannabisGrossSales: 800,
    grossSales: 13_900,
    deliveryFee: 45,
    achFee: 12,
    blazepayFee: 28,
    aeropayFee: Z,
    blazepayAchFee: 6,
    cashlessAtmFee: 35,
    cashFee: Z,
    creditDebitFee: 142,
    strongholdFee: Z,
    preTaxDiscount: 220,
    adultNetSales: 10_980,
    adultNetSalesWoFees: 11_050,
    medicalNetSales: 1_860,
    medicalNetSalesWoFees: 1_875,
    nonCannabisNetSales: 785,
    nonCannabisNetSalesWoFees: 790,
    netSales: 13_625,
    netSalesWoFees: 13_715,
    postAlExciseTax: 1_180,
    postNalExciseTax: 400,
    postCityTax: 175,
    postCountyTax: 92,
    postStateTax: 1_050,
    postFederalTax: Z,
    deliveryFeeExciseTax: 2,
    cityDeliveryFeeTax: 1,
    countyDeliveryFeeTax: Z,
    stateDeliveryFeeTax: 3,
    federalDeliveryFeeTax: Z,
    adultTotalTax: 1_050,
    medicalTotalTax: 355,
    nonCannabisTotalTax: 148,
    totalTax: 1_553,
    afterTaxDiscount: Z,
    rounding: 0.02,
    adjustments: Z,
    adultTotalDue: 12_030,
    medicalTotalDue: 2_215,
    nonCannabisTotalDue: 933,
    totalDue: 15_178,
    tips: 412,
    blazepayTips: 88,
    aeropayTips: Z,
    blazepayAchTips: 15,
    numberOfTransactions: 284,
    countOfCompletedSales: 276,
    countOfRefunds: 8,
    newMembers: 12,
    returningMembers: 198,
    adultCogs: 6_200,
    medicalCogs: 980,
    nonCannabisCogs: 410,
    achTendered: 2_400,
    blazepayTendered: 5_100,
    aeropayTendered: Z,
    blazepayAchTendered: 800,
    cashlessAtmTendered: 3_200,
    cashTendered: 2_950,
    checkTendered: Z,
    creditDebitTendered: 6_800,
    giftCardTendered: 120,
    birchmountTendered: Z,
    storeCreditTendered: 45,
    strongholdTendered: Z,
    paymentTendered: 21_415,
    achChangeDue: 12,
    blazepayChangeDue: 8,
    aeropayChangeDue: Z,
    blazepayAchChangeDue: 2,
    cashlessAtmChangeDue: 48,
    cashChangeDue: 35,
    checkChangeDue: Z,
    creditDebitChangeDue: 22,
    giftCardChangeDue: Z,
    storeCreditChangeDue: Z,
    strongholdChangeDue: Z,
    changeDue: 127,
    itemsSold: 942,
    itemsRefunded: 11,
    refundTotalDue: 186,
    surchargeFeeTax: 4,
    blazepayCashback: Z,
    aeropayCashback: Z,
    blazepayAchCashback: Z,
    cashlessAtmCashback: 112,
    untaxedFee: 9,
  },
  {
    id: 2,
    date: "2026-03-29",
    shop: "DTLB",
    company: "Acme Retail",
    queueType: "Delivery",
    adultRetailValueOfSales: 9_800,
    medicalRetailValueOfSales: 1_450,
    nonCannabisRetailValueOfSales: 620,
    retailValueOfSales: 11_870,
    preAlExciseTax: 980,
    preNalExciseTax: 290,
    preCityTax: 140,
    preCountyTax: 72,
    preStateTax: 920,
    preFederalTax: Z,
    adultGrossSales: 8_900,
    medicalGrossSales: 1_320,
    nonCannabisGrossSales: 560,
    grossSales: 10_780,
    deliveryFee: 120,
    achFee: 8,
    blazepayFee: 22,
    aeropayFee: 5,
    blazepayAchFee: 4,
    cashlessAtmFee: 28,
    cashFee: Z,
    creditDebitFee: 118,
    strongholdFee: Z,
    preTaxDiscount: 180,
    adultNetSales: 8_720,
    adultNetSalesWoFees: 8_790,
    medicalNetSales: 1_295,
    medicalNetSalesWoFees: 1_305,
    nonCannabisNetSales: 548,
    nonCannabisNetSalesWoFees: 552,
    netSales: 10_563,
    netSalesWoFees: 10_647,
    postAlExciseTax: 930,
    postNalExciseTax: 275,
    postCityTax: 135,
    postCountyTax: 68,
    postStateTax: 880,
    postFederalTax: Z,
    deliveryFeeExciseTax: 5,
    cityDeliveryFeeTax: 2,
    countyDeliveryFeeTax: Z,
    stateDeliveryFeeTax: 4,
    federalDeliveryFeeTax: Z,
    adultTotalTax: 828,
    medicalTotalTax: 262,
    nonCannabisTotalTax: 110,
    totalTax: 1_200,
    afterTaxDiscount: Z,
    rounding: -0.01,
    adjustments: 15,
    adultTotalDue: 9_548,
    medicalTotalDue: 1_557,
    nonCannabisTotalDue: 658,
    totalDue: 11_763,
    tips: 338,
    blazepayTips: 64,
    aeropayTips: 12,
    blazepayAchTips: 8,
    numberOfTransactions: 221,
    countOfCompletedSales: 215,
    countOfRefunds: 6,
    newMembers: 8,
    returningMembers: 156,
    adultCogs: 4_900,
    medicalCogs: 720,
    nonCannabisCogs: 305,
    achTendered: 1_900,
    blazepayTendered: 4_200,
    aeropayTendered: 350,
    blazepayAchTendered: 620,
    cashlessAtmTendered: 2_650,
    cashTendered: 2_100,
    checkTendered: Z,
    creditDebitTendered: 5_400,
    giftCardTendered: 90,
    birchmountTendered: Z,
    storeCreditTendered: 30,
    strongholdTendered: Z,
    paymentTendered: 17_340,
    achChangeDue: 8,
    blazepayChangeDue: 5,
    aeropayChangeDue: 1,
    blazepayAchChangeDue: Z,
    cashlessAtmChangeDue: 39,
    cashChangeDue: 28,
    checkChangeDue: Z,
    creditDebitChangeDue: 18,
    giftCardChangeDue: Z,
    storeCreditChangeDue: Z,
    strongholdChangeDue: Z,
    changeDue: 99,
    itemsSold: 721,
    itemsRefunded: 9,
    refundTotalDue: 142,
    surchargeFeeTax: 3,
    blazepayCashback: Z,
    aeropayCashback: 20,
    blazepayAchCashback: Z,
    cashlessAtmCashback: 95,
    untaxedFee: 6,
  },
];
