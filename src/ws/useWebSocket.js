import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setConnected, updatePrice } from "../slice/wsSlice";

export default function useWebSocket() {
  const dispatch = useDispatch();
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch(setConnected(true));
      console.log("WebSocket 連線成功");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(updatePrice({ code: data.code, price: data.price }));
    };

    ws.onclose = () => {
      dispatch(setConnected(false));
      console.log("WebSocket 連線關閉");
    };

    return () => {
      ws.close();
    };
  }, []);
}
