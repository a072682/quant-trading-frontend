import { createSlice } from "@reduxjs/toolkit";

// stocksSlice：管理股票池清單與篩選任務狀態
const stocksSlice = createSlice({
  name: "stocks",

  // 初始狀態：尚未載入任何股票資料
  initialState: {
    stockPool: [],       // 目前股票池的完整清單 [{ stock_code, stock_name, yield_pct, market_cap }]
    filterStatus: null,  // 篩選任務狀態物件 { status, stock_count, error_message, started_at, completed_at }，null 表示尚未查詢
    isLoading: false,    // 是否正在向後端請求股票池資料
    error: null,         // 請求失敗時的錯誤訊息，null 表示無錯誤
  },

  reducers: {
    // 更新股票池清單
    // action.payload 格式：股票物件陣列 [{ stock_code, stock_name, yield_pct, market_cap }]
    setStockPool(state, action) {
      state.stockPool = action.payload;
    },

    // 更新篩選任務的最新狀態
    // action.payload 格式：{ status, stock_count, error_message, started_at, completed_at }
    setFilterStatus(state, action) {
      state.filterStatus = action.payload;
    },

    // 切換載入中狀態
    // action.payload 格式：boolean
    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    // 設定錯誤訊息（null 表示清除錯誤）
    // action.payload 格式：string | null
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

// 匯出 action creators，供各頁面 dispatch 使用
export const { setStockPool, setFilterStatus, setLoading, setError } = stocksSlice.actions;

// 匯出 reducer，供 store/index.js 註冊使用
export default stocksSlice.reducer;
