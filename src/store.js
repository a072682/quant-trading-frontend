import { configureStore } from "@reduxjs/toolkit";
import signalReducer from "./slice/signalSlice";
import positionReducer from "./slice/positionSlice";
import tradeReducer from "./slice/tradeSlice";
import modalReducer from "./slice/modalSlice";
import wsReducer from "./slice/wsSlice";

const store = configureStore({
  reducer: {
    signal: signalReducer,
    position: positionReducer,
    trade: tradeReducer,
    modal: modalReducer,
    ws: wsReducer,
  },
});

export default store;
