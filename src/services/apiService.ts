import { buildApiUrl } from "../config/apiBase";
import { endpoints } from "../api/endpoints";
import { authorizedFetch } from "../api/authorizedFetch";
import {
  createDropSafe,
  fetchDropSafes,
  patchDropSafeCourier,
} from "../api/dropSafeApi";
import {
  addRegisterDropTimeOut,
  bulkRegisterDropTimeOut,
  createRegisterDrop,
  fetchAllRegisterDrops,
  fetchRegisterDropsPage,
} from "../api/registerDropsApi";

export const apiService = {
  getUsers: async () => {
    const res = await authorizedFetch(buildApiUrl(endpoints.users));
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
  getDropSafes: fetchDropSafes,
  createDropSafe,
  patchDropSafeCourier,
};