import { endpoints } from "../api/endpoints";

export const apiService = {
  getUsers: async () => {
    const res = await fetch(endpoints.users);
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(endpoints.stats);
    return res.json();
  },
};