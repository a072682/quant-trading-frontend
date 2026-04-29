import { createSlice } from "@reduxjs/toolkit";

// signalsSlice：管理今日評分資料的狀態
const signalsSlice = createSlice({
  name: "signals",

  // 初始狀態：尚未載入任何評分資料
  initialState: {
    todaySignals: [], // 今日所有股票的評分清單（完整股票池）
    topSignals: [],   // 今日推薦前三名（評分最高且達門檻）
    isLoading: false, // 是否正在向後端請求評分資料
    error: null,      // 請求失敗時的錯誤訊息，null 表示無錯誤
  },

  reducers: {
    // 更新今日所有評分清單
    // action.payload 格式：評分物件陣列 [{ stock_code, stock_name, total_score, ... }]
    setTodaySignals(state, action) {
      state.todaySignals = action.payload;
    },

    // 更新今日推薦前三名清單
    // action.payload 格式：評分物件陣列（最多 3 筆）
    setTopSignals(state, action) {
      state.topSignals = action.payload;
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
export const { setTodaySignals, setTopSignals, setLoading, setError } = signalsSlice.actions;

// 匯出 reducer，供 store/index.js 註冊使用
export default signalsSlice.reducer;
