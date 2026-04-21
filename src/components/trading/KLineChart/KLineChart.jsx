import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

export default function KLineChart({ data, stockCode }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  // 建立圖表（只執行一次）
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: "#0a0f1e" },
        textColor: "#8ab4d4",
      },
      grid: {
        vertLines: { color: "#1e3a5f" },
        horzLines: { color: "#1e3a5f" },
      },
    });

    seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
    });

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current.remove();
    };
  }, []);

  // 資料變更時更新圖表
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    console.log("[KLineChart] 收到 data，筆數：", data.length, "第一筆：", data[0]);

    // 轉換格式，確保欄位名稱符合 lightweight-charts 要求
    const formatted = data.map((item) => ({
      time: item.time ?? item.date,
      open: Number(item.open ?? item.open_price),
      high: Number(item.high ?? item.high_price),
      low: Number(item.low ?? item.low_price),
      close: Number(item.close ?? item.close_price),
    }));

    console.log("[KLineChart] 格式化後第一筆：", formatted[0]);
    seriesRef.current.setData(formatted);
  }, [data]);

  return (
    <div className="kline-chart">
      <div className="kline-chart__header">
        <span>{stockCode} K 線圖</span>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}
