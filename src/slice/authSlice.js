import { createSlice } from "@reduxjs/toolkit";

// authSlice：管理使用者的登入認證狀態
const authSlice = createSlice({
  name: "auth",

  // 初始狀態：頁面剛載入時尚未登入
  initialState: {
    isLogin: false,      // 是否已完成登入驗證
    token: null,         // JWT access token，存入後由 api/index.js 自動附加到請求 Header
    username: null,      // 登入成功後的使用者名稱
    isConnected: false,  // 後端伺服器的連線狀態（由 checkHealth 結果更新）
  },

  reducers: {
    // 登入成功：將 token 和 username 存入 state，並標記為已登入
    // action.payload 格式：{ token: string, username: string }
    setLogin(state, action) {
      state.isLogin = true;
      state.token = action.payload.token;
      state.username = action.payload.username;
    },

    // 登出：清空所有認證資訊，回到未登入狀態
    // 呼叫後需同步清除 localStorage 中的 token
    setLogout(state) {
      state.isLogin = false;
      state.token = null;
      state.username = null;
      state.isConnected = false;
    },

    // 更新後端連線狀態（true = 連線正常，false = 連線失敗）
    // action.payload 格式：boolean
    setConnected(state, action) {
      state.isConnected = action.payload;
    },
  },
});

// 匯出 action creators，供各頁面 dispatch 使用
export const { setLogin, setLogout, setConnected } = authSlice.actions;

// 匯出 reducer，供 store/index.js 註冊使用
export default authSlice.reducer;
