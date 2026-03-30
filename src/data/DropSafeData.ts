export type DropSafeItem = {
  id: number;
  bagNumber: string;
  datePrepared: string;
  timePrepared: string;
  preparedBy: string;
  amountPrepared: number;
  dateGiven: string;
  timeGiven: string;
  givenBy: string;
  receivedBy: string;
  amountReceived: number;
  /** `YYYY-MM-DD` for edit forms; empty if no courier date */
  courierDateValue: string;
  /** `HH:mm` from API time for `<input type="time">` */
  courierTimeValue: string;
  /** Original `courier_amount` string from API for form prefill */
  courierAmountRaw: string | null;
};
