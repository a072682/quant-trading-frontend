import { useEffect, useState } from "react";
// getTopSignals：取得今日推薦前三名；getTodaySignals：取得今日所有評分
import { getTopSignals, getTodaySignals } from "../slice/api/signals";
import ScoreCard from "../components/trading/ScoreCard/ScoreCard";

// 將後端回傳的評分原始物件（snake_case）轉換為前端統一格式（camelCase）
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
  // AI 評分信心度，可能為 null（舊資料無此欄位）
  confidence: d.confidence ?? null,
});

// Tab 按鈕的共用基礎樣式
const TAB_BASE = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 600,
  transition: "color 0.15s, border-color 0.15s",
};

// 根據 Tab 是否為當前選中狀態回傳對應樣式（選中時顯示藍色底線）
const tabStyle = (active) => ({
  ...TAB_BASE,
  color: active ? "#4fc3f7" : "#4a6a8a",
  borderBottom: active ? "2px solid #4fc3f7" : "2px solid transparent",
});

export default function DashboardPage() {
  // activeTab：目前顯示的 Tab，"top" = 今日推薦，"all" = 全部評分
  const [activeTab, setActiveTab] = useState("top");
  // topSignals：今日推薦清單（最多 3 檔，評分最高）
  const [topSignals, setTopSignals] = useState([]);
  // allSignals：今日所有股票評分（完整股票池，依分數由高到低排序）
  const [allSignals, setAllSignals] = useState([]);
  // isRefreshing：「重新整理」按鈕的 loading 狀態，防止重複點擊
  const [isRefreshing, setIsRefreshing] = useState(false);
  // loading：頁面初次載入時的全域 loading 狀態
  const [loading, setLoading] = useState(false);
  // loadError：API 失敗時顯示的錯誤提示訊息，null 表示無錯誤
  const [loadError, setLoadError] = useState(null);

  // 同時發送今日推薦和今日所有評分兩支 API
  // 使用 Promise.allSettled 確保其中一支失敗時不影響另一支的資料顯示
  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 同時呼叫今日推薦和今日所有評分
      const [topRes, allRes] = await Promise.allSettled([
        getTopSignals(),
        getTodaySignals(),
      ]);

      // 處理今日推薦結果
      if (topRes.status === "fulfilled") {
        const raw = topRes.value.data?.data ?? [];
        setTopSignals(Array.isArray(raw) ? raw.map(mapSignal) : []);
      } else {
        // API 失敗時清空，避免顯示過期資料
        setTopSignals([]);
      }

      // 處理今日所有評分結果，並依 total_score 由高到低排序
      if (allRes.status === "fulfilled") {
        const raw = allRes.value.data?.data ?? [];
        const sorted = Array.isArray(raw)
          ? [...raw].sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
          : [];
        setAllSignals(sorted.map(mapSignal));
      } else {
        setAllSignals([]);
      }

      // 若任一 API 失敗，顯示部分錯誤提示（資料可能仍有部分可顯示）
      if (topRes.status === "rejected" || allRes.status === "rejected") {
        setLoadError("部分資料載入失敗，請稍後重新整理");
      }
    } catch (error) {
      // 非預期錯誤（例如網路完全中斷）
      setLoadError("資料載入失敗，請稍後重新整理");
    } finally {
      setLoading(false);
    }
  };

  // 頁面掛載時自動載入一次資料，空依賴陣列確保只執行一次
  useEffect(() => {
    loadData();
  }, []);

  // 使用者點擊「重新整理」時觸發，以獨立的 isRefreshing 控制按鈕狀態
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 渲染單張評分卡片：若有錯誤旗標則顯示錯誤佔位框，否則渲染 ScoreCard
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
        {/* 標題列：顯示頁面標題與重新整理按鈕 */}
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

        {/* Tab 列：切換「今日推薦」和「全部評分」 */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e3a5f", marginBottom: 20, marginTop: 12 }}>
          <button style={tabStyle(activeTab === "top")} onClick={() => setActiveTab("top")}>
            今日推薦
          </button>
          <button style={tabStyle(activeTab === "all")} onClick={() => setActiveTab("all")}>
            全部評分
          </button>
        </div>

        {/* Tab 內容：loading → 錯誤提示 → 正常顯示（依 activeTab 切換） */}
        {loading ? (
          <p className="text-info">載入中...</p>
        ) : loadError ? (
          <div style={{ color: "#ffa726", fontSize: 13, marginBottom: 16 }}>⚠ {loadError}</div>
        ) : activeTab === "top" ? (
          // 今日推薦 Tab：無資料時顯示觀望提示
          topSignals.length === 0 ? (
            <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "32px 24px", textAlign: "center", color: "#8ab4d4", fontSize: 14 }}>
              今日無推薦，市場整體偏空，建議觀望
            </div>
          ) : (
            <div className="row g-3">{topSignals.map(renderSignalCard)}</div>
          )
        ) : (
          // 全部評分 Tab：顯示完整股票池評分，可捲動
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
