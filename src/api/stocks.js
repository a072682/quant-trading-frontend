import api from "./index";

// TODO: 待重構後啟用
// export const getKlineData = (stockCode) =>
//   api.get(`/api/stocks/kline/${stockCode}`);

export const getStockPool = () =>
  api.get("/api/stocks/pool");

export const getFilterStatus = () =>
  api.get("/api/stocks/status");

export const runStockFilter = () =>
  api.post("/api/stocks/filter", {}, { timeout: 900000 });
