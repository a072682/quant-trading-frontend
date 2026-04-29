import api from "./index";

// TODO: 待重構後啟用
// export const getTodaySignals = (stockCode = "0056") =>
//   api.get("/api/signals/today", { params: { stock_code: stockCode } });

// TODO: 待重構後啟用
// export const runNow = () =>
//   api.post("/api/signals/run-now");

// TODO: 待重構後啟用
// export const runNowWithStocks = (stocks) =>
//   api.post("/api/signals/run-now", { stocks });

// TODO: 待重構後啟用
// export const runStock = (stockCode, stockName) =>
//   api.post("/api/signals/run-stock", { stock_code: stockCode, stock_name: stockName });

// TODO: 待重構後啟用
// export const getSignalHistory = (stockCode) =>
//   api.get(`/api/signals/history/${stockCode}`);

// TODO: 待重構後啟用
// export const getSignalsByDate = (date) =>
//   api.get(`/api/signals/by-date/${date}`);

export const getTopSignals = (limit = 10, minScore = 6) =>
  api.get("/api/signals/top", { params: { limit, min_score: minScore } });

export const getTodayAllSignals = () =>
  api.get("/api/signals/today");

export const runFull = () =>
  api.post("/api/signals/run");
