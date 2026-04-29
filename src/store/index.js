import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import signalsReducer from "./signalsSlice";
import stocksReducer from "./stocksSlice";

// 整合所有 slice reducer，建立全域 Redux store
// main.jsx 中以 <Provider store={store}> 包住整個應用，讓所有元件都能存取
const store = configureStore({
  reducer: {
    auth: authReducer,       // 管理登入狀態、token、後端連線狀態
    signals: signalsReducer, // 管理今日評分清單與推薦前三名
    stocks: stocksReducer,   // 管理股票池清單與篩選任務狀態
  },
});

export default store;
