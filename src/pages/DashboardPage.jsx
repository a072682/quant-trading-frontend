import { useEffect, useState } from "react";
// TODO: 待 signalsSlice 建好後，改用 useSelector 從 store 取資料，dispatch thunk 觸發載入
// import { getTopSignals, getTodayAllSignals } from "../api/signals";
// TODO: 待 modalSlice 重新建立後啟用
// import { useDispatch } from "react-redux";
// import { open, MODALS } from "../slice/modalSlice";
import ScoreCard from "../components/trading/ScoreCard/ScoreCard";
import { getStrategySettings } from "../utils/strategy";

// 將後端回傳的評分原始物件轉換為前端統一格式
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
  // TODO: 待 signalsSlice 完成後，改為從 store 讀取資料
  // const dispatch = useDispatch();

  // activeTab：目前顯示的 Tab，"top" = 今日推薦，"all" = 全部評分
  const [activeTab, setActiveTab] = useState("top");
  // topSignals：今日推薦清單（最多 3 檔，評分 ≥ 門檻）
  const [topSignals, setTopSignals] = useState([]);
  // allSignals：今日所有股票評分（完整股票池，依分數由高到低排序）
  const [allSignals, setAllSignals] = useState([]);
  // isRefreshing：「重新整理」按鈕的 loading 狀態
  const [isRefreshing, setIsRefreshing] = useState(false);
  // loading：頁面初次載入時的全域 loading 狀態
  const [loading, setLoading] = useState(false);
  // loadError：部分 API 失敗時顯示的錯誤提示訊息
  const [loadError, setLoadError] = useState(null);

  // TODO: 待 signalsSlice 完成後，改為 dispatch(fetchTopSignals()) 與 dispatch(fetchTodayAllSignals())
  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // const [topRes, allRes] = await Promise.allSettled([
      //   getTopSignals(3, 6),
      //   getTodayAllSignals(),
      // ]);
      // if (topRes.status === "fulfilled") {
      //   const raw = topRes.value.data?.data ?? topRes.value.data ?? [];
      //   setTopSignals(Array.isArray(raw) ? raw.map(mapSignal) : []);
      // } else { setTopSignals([]); }
      // if (allRes.status === "fulfilled") {
      //   const raw = allRes.value.data?.data ?? allRes.value.data ?? [];
      //   const sorted = Array.isArray(raw)
      //     ? [...raw].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0)) : [];
      //   setAllSignals(sorted.map(mapSignal));
      // } else { setAllSignals([]); }
      // if (topRes.status === "rejected" || allRes.status === "rejected")
      //   setLoadError("部分資料載入失敗（網路或伺服器錯誤），請稍後重新整理");
      setLoadError("API 串接中，待 signalsSlice 完成後即可載入資料");
    } finally {
      setLoading(false);
    }
  };

  // 頁面掛載時自動載入一次資料
  useEffect(() => {
    loadData();
  }, []);

  // 使用者點擊「重新整理」時觸發
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // TODO: 待 modalSlice 重新建立後，恢復 dispatch(open({ modal: MODALS.CONFIRM_BUY, data: signal }))
  // const handleBuyClick = (signal) => {
  //   dispatch(open({ modal: MODALS.CONFIRM_BUY, data: signal }));
  // };

  // 從 localStorage 讀取使用者設定的買進門檻分數
  const { buyThreshold } = getStrategySettings();

  // 渲染單張評分卡片
  const renderSignalCard = (signal) => (
    <div key={signal.stockCode} className="col-12 col-md-6 col-lg-4">
      {signal.error ? (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "20px 16px", textAlign: "center", color: "#8ab4d4" }}>
          <div style={{ fontWeight: 600, color: "#e0f0ff", marginBottom: 6 }}>{signal.stockCode}</div>
          <div style={{ fontSize: 13 }}>尚無今日評分，請按重新整理</div>
        </div>
      ) : (
        <ScoreCard signal={signal} />
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
        <div style={{ display: "flex", borderBottom: "1px solid #1e3a5f", marginBottom: 20, marginTop: 12 }}>
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
          <div style={{ color: "#ffa726", fontSize: 13, marginBottom: 16 }}>⚠ {loadError}</div>
        ) : activeTab === "top" ? (
          topSignals.length === 0 ? (
            <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "32px 24px", textAlign: "center", color: "#8ab4d4", fontSize: 14 }}>
              今日無推薦，市場整體偏空，建議觀望
            </div>
          ) : (
            <div className="row g-3">{topSignals.map(renderSignalCard)}</div>
          )
        ) : (
          <div className="row g-3" style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}>
            {allSignals.length === 0 ? (
              <p className="text-secondary">今日尚無評分資料，請等待每日 14:00 排程執行</p>
            ) : (
              allSignals.map(renderSignalCard)
            )}
          </div>
        )}
      </section>
    </div>
  );
}
