import { buildApiUrl } from "../config/apiBase";
import { authorizedFetch } from "./authorizedFetch";
import { applyStoreIdParam } from "./storeQuery";
import type { BlazeSummaryItem } from "../data/BlazeSummaryData";

/** Row from GET /api/blaze-accounting-summaries (Laravel / MySQL snake_case). */
export type BlazeAccountingSummaryApiRow = {
  id: number;
  date: string | null;
  shop: string | null;
  company: string | null;
  queue_type: string | null;
  adult_retail_value_of_sales?: string | number | null;
  medical_retail_value_of_sales?: string | number | null;
  non_cannabis_retail_value_of_sales?: string | number | null;
  retail_value_of_sales?: string | number | null;
  pre_al_excise_tax?: string | number | null;
  pre_nal_excise_tax?: string | number | null;
  pre_city_tax?: string | number | null;
  pre_county_tax?: string | number | null;
  pre_state_tax?: string | number | null;
  pre_federal_tax?: string | number | null;
  adult_gross_sales?: string | number | null;
  medical_gross_sales?: string | number | null;
  non_cannabis_gross_sales?: string | number | null;
  gross_sales?: string | number | null;
  delivery_fee?: string | number | null;
  ach_fee?: string | number | null;
  blazepay_fee?: string | number | null;
  aeropay_fee?: string | number | null;
  blazepay_ach_fee?: string | number | null;
  cashless_atm_fee?: string | number | null;
  cash_fee?: string | number | null;
  credit_debit_fee?: string | number | null;
  stronghold_fee?: string | number | null;
  pre_tax_discount?: string | number | null;
  adult_net_sales?: string | number | null;
  adult_net_sales_wo_fees?: string | number | null;
  medical_net_sales?: string | number | null;
  medical_net_sales_wo_fees?: string | number | null;
  non_cannabis_net_sales?: string | number | null;
  non_cannabis_net_sales_wo_fees?: string | number | null;
  net_sales?: string | number | null;
  net_sales_wo_fees?: string | number | null;
  post_al_excise_tax?: string | number | null;
  post_nal_excise_tax?: string | number | null;
  post_city_tax?: string | number | null;
  post_county_tax?: string | number | null;
  post_state_tax?: string | number | null;
  post_federal_tax?: string | number | null;
  delivery_fee_excise_tax?: string | number | null;
  city_delivery_fee_tax?: string | number | null;
  county_delivery_fee_tax?: string | number | null;
  state_delivery_fee_tax?: string | number | null;
  federal_delivery_fee_tax?: string | number | null;
  adult_total_tax?: string | number | null;
  medical_total_tax?: string | number | null;
  non_cannabis_total_tax?: string | number | null;
  total_tax?: string | number | null;
  after_tax_discount?: string | number | null;
  rounding?: string | number | null;
  adjustments?: string | number | null;
  adult_total_due?: string | number | null;
  medical_total_due?: string | number | null;
  non_cannabis_total_due?: string | number | null;
  total_due?: string | number | null;
  tips?: string | number | null;
  blazepay_tips?: string | number | null;
  aeropay_tips?: string | number | null;
  blazepay_ach_tips?: string | number | null;
  number_of_transactions?: string | number | null;
  count_of_completed_sales?: string | number | null;
  count_of_refunds?: string | number | null;
  new_members?: string | number | null;
  returning_members?: string | number | null;
  adult_cogs?: string | number | null;
  medical_cogs?: string | number | null;
  non_cannabis_cogs?: string | number | null;
  ach_tendered?: string | number | null;
  blazepay_tendered?: string | number | null;
  aeropay_tendered?: string | number | null;
  blazepay_ach_tendered?: string | number | null;
  cashless_atm_tendered?: string | number | null;
  cash_tendered?: string | number | null;
  check_tendered?: string | number | null;
  credit_debit_tendered?: string | number | null;
  gift_card_tendered?: string | number | null;
  birchmount_tendered?: string | number | null;
  store_credit_tendered?: string | number | null;
  stronghold_tendered?: string | number | null;
  payment_tendered?: string | number | null;
  ach_change_due?: string | number | null;
  blazepay_change_due?: string | number | null;
  aeropay_change_due?: string | number | null;
  blazepay_ach_change_due?: string | number | null;
  cashless_atm_change_due?: string | number | null;
  cash_change_due?: string | number | null;
  check_change_due?: string | number | null;
  credit_debit_change_due?: string | number | null;
  gift_card_change_due?: string | number | null;
  store_credit_change_due?: string | number | null;
  stronghold_change_due?: string | number | null;
  change_due?: string | number | null;
  items_sold?: string | number | null;
  items_refunded?: string | number | null;
  refund_total_due?: string | number | null;
  surcharge_fee_tax?: string | number | null;
  blazepay_cashback?: string | number | null;
  aeropay_cashback?: string | number | null;
  blazepay_ach_cashback?: string | number | null;
  cashless_atm_cashback?: string | number | null;
  untaxed_fee?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BlazeAccountingSummariesPaginatedResponse = {
  current_page: number;
  data: BlazeAccountingSummaryApiRow[];
  last_page?: number;
  per_page?: number;
  total?: number;
};

function dec(v: unknown): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number.parseFloat(String(v));
  return Number.isNaN(n) ? 0 : n;
}

function int(v: unknown): number {
  return Math.round(dec(v));
}

function str(v: string | null | undefined): string {
  return v?.trim() ?? "";
}

export function mapBlazeAccountingSummaryApiRow(
  row: BlazeAccountingSummaryApiRow
): BlazeSummaryItem {
  const rawDate = str(row.date);
  const dateYmd =
    rawDate.length >= 10 ? rawDate.slice(0, 10) : rawDate;
  return {
    id: row.id,
    date: dateYmd,
    shop: str(row.shop),
    company: str(row.company),
    queueType: str(row.queue_type),
    adultRetailValueOfSales: dec(row.adult_retail_value_of_sales),
    medicalRetailValueOfSales: dec(row.medical_retail_value_of_sales),
    nonCannabisRetailValueOfSales: dec(row.non_cannabis_retail_value_of_sales),
    retailValueOfSales: dec(row.retail_value_of_sales),
    preAlExciseTax: dec(row.pre_al_excise_tax),
    preNalExciseTax: dec(row.pre_nal_excise_tax),
    preCityTax: dec(row.pre_city_tax),
    preCountyTax: dec(row.pre_county_tax),
    preStateTax: dec(row.pre_state_tax),
    preFederalTax: dec(row.pre_federal_tax),
    adultGrossSales: dec(row.adult_gross_sales),
    medicalGrossSales: dec(row.medical_gross_sales),
    nonCannabisGrossSales: dec(row.non_cannabis_gross_sales),
    grossSales: dec(row.gross_sales),
    deliveryFee: dec(row.delivery_fee),
    achFee: dec(row.ach_fee),
    blazepayFee: dec(row.blazepay_fee),
    aeropayFee: dec(row.aeropay_fee),
    blazepayAchFee: dec(row.blazepay_ach_fee),
    cashlessAtmFee: dec(row.cashless_atm_fee),
    cashFee: dec(row.cash_fee),
    creditDebitFee: dec(row.credit_debit_fee),
    strongholdFee: dec(row.stronghold_fee),
    preTaxDiscount: dec(row.pre_tax_discount),
    adultNetSales: dec(row.adult_net_sales),
    adultNetSalesWoFees: dec(row.adult_net_sales_wo_fees),
    medicalNetSales: dec(row.medical_net_sales),
    medicalNetSalesWoFees: dec(row.medical_net_sales_wo_fees),
    nonCannabisNetSales: dec(row.non_cannabis_net_sales),
    nonCannabisNetSalesWoFees: dec(row.non_cannabis_net_sales_wo_fees),
    netSales: dec(row.net_sales),
    netSalesWoFees: dec(row.net_sales_wo_fees),
    postAlExciseTax: dec(row.post_al_excise_tax),
    postNalExciseTax: dec(row.post_nal_excise_tax),
    postCityTax: dec(row.post_city_tax),
    postCountyTax: dec(row.post_county_tax),
    postStateTax: dec(row.post_state_tax),
    postFederalTax: dec(row.post_federal_tax),
    deliveryFeeExciseTax: dec(row.delivery_fee_excise_tax),
    cityDeliveryFeeTax: dec(row.city_delivery_fee_tax),
    countyDeliveryFeeTax: dec(row.county_delivery_fee_tax),
    stateDeliveryFeeTax: dec(row.state_delivery_fee_tax),
    federalDeliveryFeeTax: dec(row.federal_delivery_fee_tax),
    adultTotalTax: dec(row.adult_total_tax),
    medicalTotalTax: dec(row.medical_total_tax),
    nonCannabisTotalTax: dec(row.non_cannabis_total_tax),
    totalTax: dec(row.total_tax),
    afterTaxDiscount: dec(row.after_tax_discount),
    rounding: dec(row.rounding),
    adjustments: dec(row.adjustments),
    adultTotalDue: dec(row.adult_total_due),
    medicalTotalDue: dec(row.medical_total_due),
    nonCannabisTotalDue: dec(row.non_cannabis_total_due),
    totalDue: dec(row.total_due),
    tips: dec(row.tips),
    blazepayTips: dec(row.blazepay_tips),
    aeropayTips: dec(row.aeropay_tips),
    blazepayAchTips: dec(row.blazepay_ach_tips),
    numberOfTransactions: int(row.number_of_transactions),
    countOfCompletedSales: int(row.count_of_completed_sales),
    countOfRefunds: int(row.count_of_refunds),
    newMembers: int(row.new_members),
    returningMembers: int(row.returning_members),
    adultCogs: dec(row.adult_cogs),
    medicalCogs: dec(row.medical_cogs),
    nonCannabisCogs: dec(row.non_cannabis_cogs),
    achTendered: dec(row.ach_tendered),
    blazepayTendered: dec(row.blazepay_tendered),
    aeropayTendered: dec(row.aeropay_tendered),
    blazepayAchTendered: dec(row.blazepay_ach_tendered),
    cashlessAtmTendered: dec(row.cashless_atm_tendered),
    cashTendered: dec(row.cash_tendered),
    checkTendered: dec(row.check_tendered),
    creditDebitTendered: dec(row.credit_debit_tendered),
    giftCardTendered: dec(row.gift_card_tendered),
    birchmountTendered: dec(row.birchmount_tendered),
    storeCreditTendered: dec(row.store_credit_tendered),
    strongholdTendered: dec(row.stronghold_tendered),
    paymentTendered: dec(row.payment_tendered),
    achChangeDue: dec(row.ach_change_due),
    blazepayChangeDue: dec(row.blazepay_change_due),
    aeropayChangeDue: dec(row.aeropay_change_due),
    blazepayAchChangeDue: dec(row.blazepay_ach_change_due),
    cashlessAtmChangeDue: dec(row.cashless_atm_change_due),
    cashChangeDue: dec(row.cash_change_due),
    checkChangeDue: dec(row.check_change_due),
    creditDebitChangeDue: dec(row.credit_debit_change_due),
    giftCardChangeDue: dec(row.gift_card_change_due),
    storeCreditChangeDue: dec(row.store_credit_change_due),
    strongholdChangeDue: dec(row.stronghold_change_due),
    changeDue: dec(row.change_due),
    itemsSold: int(row.items_sold),
    itemsRefunded: int(row.items_refunded),
    refundTotalDue: dec(row.refund_total_due),
    surchargeFeeTax: dec(row.surcharge_fee_tax),
    blazepayCashback: dec(row.blazepay_cashback),
    aeropayCashback: dec(row.aeropay_cashback),
    blazepayAchCashback: dec(row.blazepay_ach_cashback),
    cashlessAtmCashback: dec(row.cashless_atm_cashback),
    untaxedFee: dec(row.untaxed_fee),
  };
}

export async function fetchBlazeAccountingSummariesPage(
  page: number,
  storeId?: number | null
): Promise<BlazeAccountingSummariesPaginatedResponse | BlazeAccountingSummaryApiRow[]> {
  const url = new URL(
    buildApiUrl("/api/blaze-accounting-summaries"),
    window.location.origin
  );
  url.searchParams.set("page", String(page));
  applyStoreIdParam(url, storeId ?? null);
  const res = await authorizedFetch(url.toString(), { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Blaze accounting summaries request failed (${res.status})`);
  }
  return res.json() as Promise<
    BlazeAccountingSummariesPaginatedResponse | BlazeAccountingSummaryApiRow[]
  >;
}

export async function fetchAllBlazeAccountingSummaries(
  storeId?: number | null
): Promise<BlazeSummaryItem[]> {
  const first = await fetchBlazeAccountingSummariesPage(1, storeId);
  if (Array.isArray(first)) {
    return first.map(mapBlazeAccountingSummaryApiRow);
  }
  const lastPage = first.last_page ?? 1;
  let rows = [...first.data];
  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        fetchBlazeAccountingSummariesPage(i + 2, storeId)
      )
    );
    for (const chunk of rest) {
      if (Array.isArray(chunk)) {
        rows = rows.concat(chunk);
      } else {
        rows = rows.concat(chunk.data);
      }
    }
  }
  return rows.map(mapBlazeAccountingSummaryApiRow);
}

/** Daily sums of Cashless ATM tendered / change / cashback (multiple BAS rows per day summed). */
export type BasCashlessAtmDailyTotals = {
  sumTendered: number;
  sumChangeDue: number;
  sumCashback: number;
};

export function aggregateCashlessAtmBasByDate(
  items: BlazeSummaryItem[]
): Map<string, BasCashlessAtmDailyTotals> {
  const map = new Map<string, BasCashlessAtmDailyTotals>();
  for (const row of items) {
    const raw = row.date?.trim() ?? "";
    if (!raw) continue;
    const key = raw.length >= 10 ? raw.slice(0, 10) : raw;
    const cur = map.get(key) ?? {
      sumTendered: 0,
      sumChangeDue: 0,
      sumCashback: 0,
    };
    cur.sumTendered += row.cashlessAtmTendered;
    cur.sumChangeDue += row.cashlessAtmChangeDue;
    cur.sumCashback += row.cashlessAtmCashback;
    map.set(key, cur);
  }
  return map;
}
