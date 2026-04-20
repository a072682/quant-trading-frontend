import { createSlice } from "@reduxjs/toolkit";

const wsSlice = createSlice({
  name: "ws",
  initialState: {
    isConnected: false,
    lastPrice: {},
    lastUpdated: null,
  },
  reducers: {
    setConnected(state, action) {
      state.isConnected = action.payload;
    },
    updatePrice(state, action) {
      const { code, price } = action.payload;
      state.lastPrice[code] = price;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { setConnected, updatePrice } = wsSlice.actions;
export default wsSlice.reducer;
