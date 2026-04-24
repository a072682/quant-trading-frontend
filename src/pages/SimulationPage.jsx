import { useState, useEffect } from "react";
import {
  getSimulationPositions,
  getSimulationTrades,
  getSimulationSummary,
} from "../api/simulation";
import { getStockName } from "../utils/watchList";

const cardStyle = {
  background: "#0d1b2e",
  border: "1px solid #1e3a5f",
  borderRadius: 8,
  padding: "20px 24px",
};

const labelStyle = { color: "#8ab4d4", fontSize: 13, marginBottom: 4 };
const valueStyle = { color: "#e0f0ff", fontSize: 22, fontWeight: 700 };

const tableHeaderStyle = {
  background: "#0a1520",
  color: "#8ab4d4",
  fontSize: 12,
  padding: "8px 12px",
  borderBottom: "1px solid #1e3a5f",
  whiteSpace: "nowrap",
};

const tableCellStyle = {
  color: "#c8dff0",
  fontSize: 13,
  padding: "10px 12px",
  borderBottom: "1px solid #12243a",
  whiteSpace: "nowrap",
};

function SummaryCard({ label, value }) {
  return (
    <div className="col-6 col-md-3">
      <div style={cardStyle}>
        <div style={labelStyle}>{label}</div>
        <div style={valueStyle}>{value ?? "—"}</div>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const [summary, setSummary] = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sumRes, posRes, tradeRes] = await Promise.all([
          getSimulationSummary(),
          getSimulationPositions(),
          getSimulationTrades(),
        ]);
        setSummary(sumRes.data?.data ?? sumRes.data ?? null);
        setPositions(posRes.data?.data ?? posRes.data ?? []);
        setTrades(tradeRes.data?.data ?? tradeRes.data ?? []);
      } catch (err) {
        console.error("模擬交易資料載入失敗", err);
        setError("資料載入失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <h5 className="section-title">模擬交易</h5>
        <p className="text-info">載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <h5 className="section-title">模擬交易</h5>
        <p style={{ color: "#ef5350" }}>{error}</p>
      </div>
    );
  }

  const totalPnl = summary?.total_profit ?? summary?.total_pnl ?? null;
  const winRate = summary?.win_rate ?? null;
  const totalTrades = summary?.total_trades ?? trades.length;
  const openPositions = summary?.open_positions ?? positions.length;

  return (
    <div className="container-fluid py-4">
      <h5 className="section-title">模擬交易</h5>

      {/* 區塊一：統計摘要 */}
      <div className="row g-3 mb-4">
        <SummaryCard
          label="總損益（元）"
          value={
            totalPnl !== null ? (
              <span style={{ color: totalPnl > 0 ? "#26a69a" : totalPnl < 0 ? "#ef5350" : "#e0f0ff" }}>
                {totalPnl > 0 ? "+" : ""}
                {Number(totalPnl).toLocaleString()} 元
              </span>
            ) : (
              "—"
            )
          }
        />
        <SummaryCard
          label="勝率（%）"
          value={
            winRate !== null ? `${Number(winRate).toFixed(1)}%` : "—"
          }
        />
        <SummaryCard label="總交易次數" value={totalTrades} />
        <SummaryCard label="目前持倉數" value={openPositions} />
      </div>

      {/* 區塊二：目前模擬持倉 */}
      <h6 className="section-title mb-3">目前模擬持倉</h6>
      <div style={{ ...cardStyle, padding: 0, marginBottom: 32, overflowX: "auto" }}>
        {positions.length === 0 ? (
          <p style={{ color: "#8ab4d4", padding: 16, margin: 0 }}>目前無持倉</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["股票代號", "股票名稱", "買進日期", "買進價", "目前股數", "買進金額", "狀態"].map(
                  (col) => (
                    <th key={col} style={tableHeaderStyle}>
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, idx) => {
                const code = pos.stock_code ?? "—";
                const buyDate =
                  pos.buy_date ??
                  (pos.created_at ? pos.created_at.slice(0, 10) : null) ??
                  pos.date ??
                  "—";
                const buyAmount = pos.total_amount ?? pos.buy_amount ?? null;
                return (
                <tr key={pos.id ?? pos.stock_code ?? idx}>
                  <td style={tableCellStyle}>{code}</td>
                  <td style={tableCellStyle}>{getStockName(code)}</td>
                  <td style={tableCellStyle}>{buyDate}</td>
                  <td style={tableCellStyle}>
                    {pos.buy_price != null
                      ? Number(pos.buy_price).toLocaleString()
                      : pos.price != null
                      ? Number(pos.price).toLocaleString()
                      : "—"}
                  </td>
                  <td style={tableCellStyle}>
                    {pos.shares ?? pos.quantity ?? "—"}
                  </td>
                  <td style={tableCellStyle}>
                    {buyAmount != null
                      ? `${Number(buyAmount).toLocaleString()} 元`
                      : "—"}
                  </td>
                  <td style={tableCellStyle}>
                    <span
                      style={{
                        color: "#26a69a",
                        background: "#0d2b1a",
                        border: "1px solid #26a69a",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 12,
                      }}
                    >
                      持有中
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 區塊三：歷史模擬交易紀錄 */}
      <h6 className="section-title mb-3">歷史模擬交易紀錄</h6>
      <div style={{ ...cardStyle, padding: 0, overflowX: "auto" }}>
        {trades.length === 0 ? (
          <p style={{ color: "#8ab4d4", padding: 16, margin: 0 }}>目前無交易紀錄</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["日期", "股票", "動作", "價格", "股數", "金額", "損益", "損益%", "結果"].map(
                  (col) => (
                    <th key={col} style={tableHeaderStyle}>
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, idx) => {
                const pnl = trade.profit ?? null;
                const pnlPct = trade.profit_pct ?? null;
                const isProfit = pnl !== null && Number(pnl) >= 0;
                const pnlColor =
                  pnl === null ? "#8ab4d4" : isProfit ? "#26a69a" : "#ef5350";
                const action = trade.action ?? "—";
                const isBuy =
                  action === "buy" || action === "買進" || action === "BUY";
                const tradeCode = trade.stock_code ?? "—";
                const tradeAmount = trade.total_amount ?? trade.amount ?? null;
                const tradeDate =
                  trade.date ??
                  (trade.created_at ? trade.created_at.slice(0, 10) : null) ??
                  "—";

                return (
                  <tr key={trade.id ?? idx}>
                    <td style={tableCellStyle}>{tradeDate}</td>
                    <td style={tableCellStyle}>
                      {tradeCode}
                      <span style={{ color: "#8ab4d4", marginLeft: 4 }}>
                        {getStockName(tradeCode)}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          color: isBuy ? "#4fc3f7" : "#ffa726",
                          background: isBuy ? "#0d1e2e" : "#2b1a00",
                          border: `1px solid ${isBuy ? "#4fc3f7" : "#ffa726"}`,
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 12,
                        }}
                      >
                        {isBuy ? "買進" : "賣出"}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {trade.price != null
                        ? Number(trade.price).toLocaleString()
                        : "—"}
                    </td>
                    <td style={tableCellStyle}>
                      {trade.shares ?? trade.quantity ?? "—"}
                    </td>
                    <td style={tableCellStyle}>
                      {tradeAmount != null
                        ? `${Number(tradeAmount).toLocaleString()} 元`
                        : "—"}
                    </td>
                    <td style={{ ...tableCellStyle, color: pnlColor }}>
                      {pnl !== null
                        ? `${Number(pnl) > 0 ? "+" : ""}${Number(pnl).toLocaleString()}`
                        : "—"}
                    </td>
                    <td style={{ ...tableCellStyle, color: pnlColor }}>
                      {pnlPct !== null
                        ? `${Number(pnlPct) > 0 ? "+" : ""}${Number(pnlPct).toFixed(2)}%`
                        : "—"}
                    </td>
                    <td style={tableCellStyle}>
                      {pnl === null ? (
                        "—"
                      ) : (
                        <span style={{ color: pnlColor }}>
                          {isProfit ? "獲利" : "虧損"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
