import { createSlice } from "@reduxjs/toolkit";

const tradeSlice = createSlice({
  name: "trade",
  initialState: {
    list: [],
    monthlyStats: null,
    isLoading: false,
  },
  reducers: {
    setTradeList(state, action) {
      state.list = action.payload;
    },
    setMonthlyStats(state, action) {
      state.monthlyStats = action.payload;
    },
    addTrade(state, action) {
      state.list.unshift(action.payload);
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const { setTradeList, setMonthlyStats, addTrade, setLoading } =
  tradeSlice.actions;
export default tradeSlice.reducer;
