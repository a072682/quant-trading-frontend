import api from "./index";

export const getTodaySignals = (stockCode = "0056") =>
  api.get("/api/v1/signals/today", { params: { stock_code: stockCode } });

export const runNow = () =>
  api.post("/api/v1/signals/run-now");

export const getSignalHistory = (stockCode) =>
  api.get(`/api/v1/signals/history/${stockCode}`);

export const getSignalsByDate = (date) =>
  api.get(`/api/v1/signals/by-date/${date}`);
