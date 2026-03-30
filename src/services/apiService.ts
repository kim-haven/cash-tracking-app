import { endpoints } from "../api/endpoints";
import {
  addRegisterDropTimeOut,
  bulkRegisterDropTimeOut,
  createRegisterDrop,
  fetchAllRegisterDrops,
  fetchRegisterDropsPage,
} from "../api/registerDropsApi";

export const apiService = {
  getUsers: async () => {
    const res = await fetch(endpoints.users);
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(endpoints.stats);
    return res.json();
  },
  getRegisterDropsPage: fetchRegisterDropsPage,
  getRegisterDropsAll: fetchAllRegisterDrops,
  createRegisterDrop,
  addRegisterDropTimeOut,
  bulkRegisterDropTimeOut,
};