import api from "./index";

export const getKlineData = (stockCode) =>
  api.get(`/api/v1/stocks/kline/${stockCode}`);
