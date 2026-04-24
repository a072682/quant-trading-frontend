import axios from "axios";
import api from "./index";

export const getKlineData = (stockCode) =>
  api.get(`/api/v1/stocks/kline/${stockCode}`);

export const getStockPool = () =>
  api.get("/api/v1/stocks/pool");

export const getFilterStatus = () =>
  api.get("/api/v1/stocks/status");

export const runStockFilter = () =>
  axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/api/v1/stocks/filter`,
    {},
    {
      timeout: 900000,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
