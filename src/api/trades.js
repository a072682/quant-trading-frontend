import api from "./index";

export const getTradeList = () =>
  api.get("/api/v1/trades");

export const getMonthlyStats = () =>
  api.get("/api/v1/trades/monthly-stats");

export const confirmBuy = (data) =>
  api.post("/api/v1/trades/buy", data);

export const confirmSell = (data) =>
  api.post("/api/v1/trades/sell", data);
