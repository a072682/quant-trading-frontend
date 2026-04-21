import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";

export default function KLineChart({ data, stockCode }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

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

    const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
    });

    candleSeries.setData(data);

    const handleResize = () => {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current.remove();
    };
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
