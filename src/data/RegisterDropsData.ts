export type RegisterDropItem = {
  id: number;
  storeId?: number;
  date: string;
  register: string;
  timeStart: string;
  timeEnd: string;
  action: string;
  cashIn: number;
  initials: string;
  notes: string;
  /** `YYYY-MM-DD` for edit forms */
  dateValue: string;
  /** `HH:mm` from API for `<input type="time">` */
  timeStartValue: string;
  /** `HH:mm` from API for `<input type="time">` (empty if null) */
  timeEndValue: string;
  /** Raw API cash string for edit prefill */
  cashInRaw: string;
};
