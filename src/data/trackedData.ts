import { controllers } from "./controllers";

type DayData = {
  date: string;
  amController: string;
  pmController: string;
  registerDrops: number;
  expenses: number;
  balance: number;
  deposit: number;
  courier: number;
  finalBalance: number;
};

export const trackedData: DayData[] = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(2025, 0, i + 1);

  return {
    date: date.toISOString().split("T")[0],

    amController: controllers[i % controllers.length],
    pmController: controllers[(i + 1) % controllers.length],

    registerDrops: 0,
    expenses: 0,
    balance: 0,
    deposit: 0,
    courier: 0,
    finalBalance: 0,
  };
});