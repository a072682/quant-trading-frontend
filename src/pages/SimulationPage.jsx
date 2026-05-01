// SimulationPage.jsx：模擬交易頁面
// 顯示目前持倉、績效摘要、歷史記錄三個區塊
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setActiveTrades,
  setHistoryTrades,
  setSummary,
  setError,
} from "../slice/simulationSlice";
import {
  getActiveTrades,
  getHistoryTrades,
  getSummary,
} from "../slice/api/simulation";

// 狀態標籤的中文對照與顏色設定
const STATUS_LABEL = {
  pending: { text: "待買入", color: "#f59e0b" },
  holding: { text: "持有中", color: "#3b82f6" },
  selling: { text: "待賣出", color: "#8b5cf6" },
  sold: { text: "已賣出", color: "#6b7280" },
};

const SimulationPage = () => {
  const dispatch = useDispatch();

  // 從 Redux store 取得模擬交易資料
  const { activeTrades, historyTrades, summary, isLoading, error } =
    useSelector((state) => state.simulation);

  // 頁面載入時取得所有資料
  useEffect(() => {
    const loadData = async () => {
      dispatch(setLoading());
      try {
        // 同時取得三種資料
        const [activeRes, historyRes, summaryRes] = await Promise.all([
          getActiveTrades(),
          getHistoryTrades(),
          getSummary(),
        ]);
        dispatch(setActiveTrades(activeRes.data?.data || []));
        dispatch(setHistoryTrades(historyRes.data?.data || []));
        dispatch(setSummary(summaryRes.data?.data || null));
      } catch (err) {
        dispatch(setError("資料載入失敗，請稍後再試"));
      }
    };
    loadData();
  }, [dispatch]);

  return (
    <div style={{ padding: "24px", maxWidth: "960px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}>
        模擬交易
      </h1>

      {/* 錯誤訊息 */}
      {error && (
        <div style={{ color: "red", marginBottom: "16px" }}>{error}</div>
      )}

      {/* 載入中 */}
      {isLoading && (
        <div style={{ color: "#6b7280", marginBottom: "16px" }}>載入中...</div>
      )}

      {/* 區塊一：績效摘要 */}
      {summary && (
        <div
          style={{
            background: "#1e293b",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: "14px" }}>總交易次數</div>
            <div style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "bold" }}>
              {summary.total_trades}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: "14px" }}>勝率</div>
            <div style={{ color: "#22c55e", fontSize: "28px", fontWeight: "bold" }}>
              {summary.win_rate}%
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: "14px" }}>平均損益</div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: summary.avg_profit_pct >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {summary.avg_profit_pct}%
            </div>
          </div>
        </div>
      )}

      {/* 區塊二：目前持倉 */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ color: "#f1f5f9", fontSize: "18px", marginBottom: "16px" }}>
          目前持倉（{activeTrades.length} 筆）
        </h2>

        {activeTrades.length === 0 ? (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>
            目前無進行中的持倉
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#94a3b8", fontSize: "14px" }}>
                <th style={{ textAlign: "left", paddingBottom: "8px" }}>股票</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>狀態</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>買入價</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>現價</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>損益</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>推薦日</th>
              </tr>
            </thead>
            <tbody>
              {activeTrades.map((trade) => (
                <tr
                  key={trade.id}
                  style={{ borderTop: "1px solid #334155", color: "#f1f5f9" }}
                >
                  <td style={{ padding: "12px 0" }}>
                    <div style={{ fontWeight: "bold" }}>{trade.stock_code}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {trade.stock_name}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span
                      style={{
                        background: STATUS_LABEL[trade.status]?.color,
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        fontSize: "12px",
                      }}
                    >
                      {STATUS_LABEL[trade.status]?.text}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {trade.buy_price ? `${trade.buy_price}` : "-"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {trade.current_price ? `${trade.current_price}` : "-"}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color:
                        trade.profit_pct === null
                          ? "#94a3b8"
                          : trade.profit_pct >= 0
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {trade.profit_pct !== null ? `${trade.profit_pct}%` : "-"}
                  </td>
                  <td style={{ textAlign: "right", color: "#94a3b8", fontSize: "12px" }}>
                    {trade.signal_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 區塊三：歷史記錄 */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#f1f5f9", fontSize: "18px", marginBottom: "16px" }}>
          歷史記錄（{historyTrades.length} 筆）
        </h2>

        {historyTrades.length === 0 ? (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>
            目前無歷史記錄
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#94a3b8", fontSize: "14px" }}>
                <th style={{ textAlign: "left", paddingBottom: "8px" }}>股票</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>買入價</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>賣出價</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>損益</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>原因</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>買入日</th>
                <th style={{ textAlign: "right", paddingBottom: "8px" }}>賣出日</th>
              </tr>
            </thead>
            <tbody>
              {historyTrades.map((trade) => (
                <tr
                  key={trade.id}
                  style={{ borderTop: "1px solid #334155", color: "#f1f5f9" }}
                >
                  <td style={{ padding: "12px 0" }}>
                    <div style={{ fontWeight: "bold" }}>{trade.stock_code}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {trade.stock_name}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>{trade.buy_price}</td>
                  <td style={{ textAlign: "right" }}>{trade.sell_price}</td>
                  <td
                    style={{
                      textAlign: "right",
                      color: trade.profit_pct >= 0 ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {trade.profit_pct}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      color: trade.sell_reason === "停利" ? "#22c55e" : "#ef4444",
                    }}
                  >
                    {trade.sell_reason}
                  </td>
                  <td style={{ textAlign: "right", color: "#94a3b8", fontSize: "12px" }}>
                    {trade.buy_date}
                  </td>
                  <td style={{ textAlign: "right", color: "#94a3b8", fontSize: "12px" }}>
                    {trade.sell_date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SimulationPage;