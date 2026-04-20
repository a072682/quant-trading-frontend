import { createSlice } from "@reduxjs/toolkit";

const signalSlice = createSlice({
  name: "signal",
  initialState: {
    today: null,
    list: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    setTodaySignal(state, action) {
      state.today = action.payload;
    },
    setSignalList(state, action) {
      state.list = action.payload;
    },
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setTodaySignal, setSignalList, setLoading, setError } =
  signalSlice.actions;
export default signalSlice.reducer;
