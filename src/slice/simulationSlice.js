// simulationSlice.js：模擬交易的 Redux 狀態管理
import { createSlice } from "@reduxjs/toolkit";

// 初始狀態定義
const initialState = {
  // 目前進行中的持倉（pending + holding + selling）
  activeTrades: [],
  // 所有已賣出的歷史記錄
  historyTrades: [],
  // 整體績效摘要
  summary: null,
  // 資料載入中的狀態
  isLoading: false,
  // 錯誤訊息
  error: null,
};

// 建立模擬交易的 Redux slice
const simulationSlice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    // 開始載入資料：設定 isLoading 為 true，清除錯誤訊息
    setLoading(state) {
      state.isLoading = true;
      state.error = null;
    },
    // 設定進行中的持倉資料
    setActiveTrades(state, action) {
      state.activeTrades = action.payload;
      state.isLoading = false;
    },
    // 設定歷史記錄資料
    setHistoryTrades(state, action) {
      state.historyTrades = action.payload;
      state.isLoading = false;
    },
    // 設定績效摘要資料
    setSummary(state, action) {
      state.summary = action.payload;
      state.isLoading = false;
    },
    // 設定錯誤訊息
    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

// 匯出 action creators
export const {
  setLoading,
  setActiveTrades,
  setHistoryTrades,
  setSummary,
  setError,
} = simulationSlice.actions;

// 匯出 reducer
export default simulationSlice.reducer;