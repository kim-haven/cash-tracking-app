export type RegisterDropItem = {
    date: string;
    register: string;
    timeStart: string;
    timeEnd: string;
    action: string;
    cashIn: number;
    initials: string;
    notes: string;
  };
  
  export const registerDropsData: RegisterDropItem[] = [
    {
      date: "2026-03-28",
      register: "Register 1",
      timeStart: "09:00",
      timeEnd: "17:00",
      action: "REG OPEN",
      cashIn: 500,
      initials: "AB",
      notes: "Routine drop",
    },
    {
      date: "2026-03-28",
      register: "Register 2",
      timeStart: "10:00",
      timeEnd: "18:00",
      action: "REG CLOSE",
      cashIn: 300,
      initials: "CD",
      notes: "Short shift",
    },
    {
      date: "2026-03-28",
      register: "Register 3",
      timeStart: "11:00",
      timeEnd: "19:00",
      action: "REG OPEN",
      cashIn: -100,
      initials: "EF",
      notes: "Overnight prep",
    },
  ];