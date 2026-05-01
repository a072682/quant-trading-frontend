// simulation.js：模擬交易相關 API
import api from "./index";

// 取得目前所有進行中的持倉（pending + holding + selling）
// 輸入：無（token 由 api 實例自動附加）
// 輸出：{ success, message, data: [ SimulationTradeOut... ] }
export const getActiveTrades = () => api.get("/api/simulation/active");

// 取得所有已賣出的歷史記錄
// 輸入：無
// 輸出：{ success, message, data: [ SimulationTradeOut... ] }
export const getHistoryTrades = () => api.get("/api/simulation/history");

// 取得整體績效摘要
// 輸入：無
// 輸出：{ success, message, data: SimulationSummaryOut }
export const getSummary = () => api.get("/api/simulation/summary");