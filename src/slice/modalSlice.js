import { createSlice } from "@reduxjs/toolkit";

export const MODALS = {
  CONFIRM_BUY: "confirmBuy",
  CONFIRM_SELL: "confirmSell",
  ALERT: "alert",
};

const modalSlice = createSlice({
  name: "modal",
  initialState: {
    currentModal: null,
    payload: null,
  },
  reducers: {
    open(state, action) {
      state.currentModal = action.payload.modal;
      state.payload = action.payload.data || null;
    },
    close(state) {
      state.currentModal = null;
      state.payload = null;
    },
  },
});

export const { open, close } = modalSlice.actions;
export default modalSlice.reducer;
