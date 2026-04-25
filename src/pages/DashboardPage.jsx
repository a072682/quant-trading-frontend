import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTopSignals, getTodayAllSignals } from "../api/signals";
import { getPositions } from "../api/positions";
import { setPositions } from "../slice/positionSlice";
import { open, MODALS } from "../slice/modalSlice";
import ScoreCard from "../components/trading/ScoreCard/ScoreCard";
import PositionCard from "../components/trading/PositionCard/PositionCard";
import { getStrategySettings } from "../utils/strategy";

const mapSignal = (d) => ({
  stockCode: d.stock_code,
  stockName: d.stock_name,
  totalScore: d.total_score,
  institutionalScore: d.institutional_score,
  maScore: d.ma_score,
  volumeScore: d.volume_score,
  yieldScore: d.yield_score ?? 0,
  futuresScore: d.futures_score ?? 0,
  aiAction: d.ai_action,
  aiReason: d.ai_reason,
});

const mapPosition = (d) => ({
  stockCode: d.stock_code,
  stockName: d.stock_name,
  quantity: d.quantity,
  avgCost: d.avg_cost,
  currentPrice: d.current_price,
  unrealizedProfit: d.unrealized_profit,
});

// Tab 樣式
const TAB_BASE = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 600,
  transition: "color 0.15s, border-color 0.15s",
};

const tabStyle = (active) => ({
  ...TAB_BASE,
  color: active ? "#4fc3f7" : "#4a6a8a",
  borderBottom: active ? "2px solid #4fc3f7" : "2px solid transparent",
});

export default function DashboardPage() {
  const dispatch = useDispatch();
  const positions = useSelector((state) => state.position.list);

  const [activeTab, setActiveTab] = useState("top"); // "top" | "all"
  const [topSignals, setTopSignals] = useState([]);
  const [allSignals, setAllSignals] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [topRes, allRes, posRes] = await Promise.allSettled([
        getTopSignals(3, 6),
        getTodayAllSignals(),
        getPositions(),
      ]);

      if (topRes.status === "fulfilled") {
        const raw = topRes.value.data?.data ?? topRes.value.data ?? [];
        setTopSignals(Array.isArray(raw) ? raw.map(mapSignal) : []);
      } else {
        setTopSignals([]);
      }

      if (allRes.status === "fulfilled") {
        const raw = allRes.value.data?.data ?? allRes.value.data ?? [];
        const sorted = Array.isArray(raw)
          ? [...raw].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
          : [];
        setAllSignals(sorted.map(mapSignal));
      } else {
        setAllSignals([]);
      }

      if (topRes.status === "rejected" || allRes.status === "rejected") {
        setLoadError("部分資料載入失敗（網路或伺服器錯誤），請稍後重新整理");
      }

      if (posRes.status === "fulfilled") {
        const posList = Array.isArray(posRes.value.data?.data)
          ? posRes.value.data.data.map(mapPosition)
          : [];
        dispatch(setPositions(posList));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBuyClick = (signal) => {
    dispatch(open({ modal: MODALS.CONFIRM_BUY, data: signal }));
  };

  const handleSellClick = (position) => {
    dispatch(open({ modal: MODALS.CONFIRM_SELL, data: position }));
  };

  const { buyThreshold } = getStrategySettings();

  const renderSignalCard = (signal) => (
    <div key={signal.stockCode} className="col-12 col-md-6 col-lg-4">
      {signal.error ? (
        <div
          style={{
            background: "#0d1b2e",
            border: "1px solid #1e3a5f",
            borderRadius: 8,
            padding: "20px 16px",
            textAlign: "center",
            color: "#8ab4d4",
          }}
        >
          <div style={{ fontWeight: 600, color: "#e0f0ff", marginBottom: 6 }}>
            {signal.stockCode}
          </div>
          <div style={{ fontSize: 13 }}>尚無今日評分，請按重新整理</div>
        </div>
      ) : (
        <>
          <ScoreCard signal={signal} />
          {signal.totalScore >= buyThreshold && (
            <button
              className="btn-buy w-100 mt-2"
              onClick={() => handleBuyClick(signal)}
            >
              確認買入
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <section className="mb-4">
        {/* 標題列 */}
        <div className="d-flex align-items-center gap-3 mb-0">
          <h5 className="section-title mb-0">今日訊號</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? "載入中..." : "重新整理"}
          </button>
        </div>

        {/* Tab 列 */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1e3a5f",
            marginBottom: 20,
            marginTop: 12,
          }}
        >
          <button style={tabStyle(activeTab === "top")} onClick={() => setActiveTab("top")}>
            今日推薦（最多3檔，已排除持倉中的股票）
          </button>
          <button style={tabStyle(activeTab === "all")} onClick={() => setActiveTab("all")}>
            全部評分
          </button>
        </div>

        {/* Tab 內容 */}
        {loading ? (
          <p className="text-info">載入中...</p>
        ) : loadError ? (
          <>
            <div style={{ color: "#ef5350", fontSize: 13, marginBottom: 16 }}>
              ⚠ {loadError}
            </div>
            {activeTab === "top" ? (
              topSignals.length > 0 && (
                <div className="row g-3">{topSignals.map(renderSignalCard)}</div>
              )
            ) : (
              allSignals.length > 0 && (
                <div className="row g-3" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
                  {allSignals.map(renderSignalCard)}
                </div>
              )
            )}
          </>
        ) : activeTab === "top" ? (
          topSignals.length === 0 ? (
            <div
              style={{
                background: "#0d1b2e",
                border: "1px solid #1e3a5f",
                borderRadius: 8,
                padding: "32px 24px",
                textAlign: "center",
                color: "#8ab4d4",
                fontSize: 14,
              }}
            >
              今日無推薦，市場整體偏空，建議觀望
            </div>
          ) : (
            <div className="row g-3">
              {topSignals.map(renderSignalCard)}
            </div>
          )
        ) : (
          <div
            className="row g-3"
            style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}
          >
            {allSignals.length === 0 ? (
              <p className="text-secondary">今日尚無評分資料，請等待每日 14:00 排程執行</p>
            ) : (
              allSignals.map(renderSignalCard)
            )}
          </div>
        )}
      </section>

      <section className="mb-4">
        <h5 className="section-title">目前持倉</h5>
        <div className="row g-3">
          {positions.map((pos) => (
            <div key={pos.stockCode} className="col-12 col-md-6">
              <PositionCard
                position={pos}
                onSell={() => handleSellClick(pos)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
