import { createSlice } from "@reduxjs/toolkit";

const positionSlice = createSlice({
  name: "position",
  initialState: {
    list: [],
    totalValue: 0,
    totalProfit: 0,
    isLoading: false,
  },
  reducers: {
    setPositions(state, action) {
      state.list = action.payload;
    },
    setTotalValue(state, action) {
      state.totalValue = action.payload;
    },
    setTotalProfit(state, action) {
      state.totalProfit = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
  },
});

export const { setPositions, setTotalValue, setTotalProfit, setLoading } =
  positionSlice.actions;
export default positionSlice.reducer;
