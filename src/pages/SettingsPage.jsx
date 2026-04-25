import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { runFull } from "../api/signals";
import { getStockPool, getFilterStatus, runStockFilter } from "../api/stocks";
import { getWatchList, getStockName } from "../utils/watchList";

const DEFAULT_STRATEGY = { buyThreshold: 5, stopLoss: -3, profitTarget: 6 };
const LS_WATCH = "watchList";
const LS_STRATEGY = "strategySettings";
const LS_FILTERING = "isFiltering";
const LS_FULL_SCAN = "fullScanRunning";
const FULL_SCAN_TIMEOUT_MS = 15 * 60 * 1000;

function isFullScanActive() {
  const ts = localStorage.getItem(LS_FULL_SCAN);
  if (!ts) return false;
  if (Date.now() - Number(ts) > FULL_SCAN_TIMEOUT_MS) {
    localStorage.removeItem(LS_FULL_SCAN);
    return false;
  }
  return true;
}

const CARD_STYLE = {
  background: "#0d1b2e",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  border: "1px solid #1e3a5f",
};

const INPUT_STYLE = {
  background: "#06101e",
  color: "#e0f0ff",
  border: "1px solid #1e3a5f",
  borderRadius: 6,
};

function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsPage() {
  const navigate = useNavigate();

  // ── 監控股票清單 ──────────────────────────────
  const [watchList, setWatchList] = useState(() => getWatchList());
  const [newCode, setNewCode] = useState("");

  const addStock = () => {
    const code = newCode.trim().toUpperCase();
    if (!code || watchList.some((item) => item.code === code)) return;
    const updated = [...watchList, { code, name: getStockName(code) }];
    setWatchList(updated);
    localStorage.setItem(LS_WATCH, JSON.stringify(updated));
    setNewCode("");
  };

  const removeStock = (code) => {
    const updated = watchList.filter((item) => item.code !== code);
    setWatchList(updated);
    localStorage.setItem(LS_WATCH, JSON.stringify(updated));
  };

  // ── 策略參數 ──────────────────────────────────
  const [strategy, setStrategy] = useState(() =>
    loadLS(LS_STRATEGY, DEFAULT_STRATEGY)
  );
  const [strategySaved, setStrategySaved] = useState(false);

  const updateStrategy = (key, value) =>
    setStrategy((prev) => ({ ...prev, [key]: value }));

  const saveStrategy = () => {
    localStorage.setItem(LS_STRATEGY, JSON.stringify(strategy));
    setStrategySaved(true);
    setTimeout(() => setStrategySaved(false), 2000);
  };

  // ── 系統資訊 ──────────────────────────────────
  const [connStatus, setConnStatus] = useState("checking");
  const [sysInfo, setSysInfo] = useState(null);

  useEffect(() => {
    const checkConn = async () => {
      try {
        const res = await api.get("/api/v1/signals/stats");
        setSysInfo(res.data.data || null);
        setConnStatus("ok");
      } catch {
        setConnStatus("error");
      }
    };
    checkConn();
  }, []);

  // ── 立即計算 ──────────────────────────────────
  const [runStatus, setRunStatus] = useState(() =>
    isFullScanActive() ? "running" : "idle"
  ); // idle | running | error
  const [runMsg, setRunMsg] = useState("");

  const handleRunNow = async () => {
    setRunStatus("running");
    setRunMsg("");
    try {
      const res = await runFull();
      localStorage.setItem(LS_FULL_SCAN, String(Date.now()));
      setRunMsg(res.data?.message || "評分任務已啟動，完成後請重新整理儀表板");
    } catch (err) {
      if (err.response?.status === 400) {
        localStorage.setItem(LS_FULL_SCAN, String(Date.now()));
        setRunMsg("評分任務已在進行中，請稍後");
      } else {
        localStorage.removeItem(LS_FULL_SCAN);
        setRunStatus("error");
        setRunMsg(err.response?.data?.message || "執行失敗，請稍後再試");
      }
    }
  };

  // ── 股票池管理 ────────────────────────────────
  // 後端 getStockPool() 回傳陣列，拆成三個獨立 state 避免巢狀存取錯誤
  const [stockPool, setStockPool] = useState([]);
  const [poolCount, setPoolCount] = useState(null);
  const [poolLastUpdated, setPoolLastUpdated] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterMsg, setFilterMsg] = useState("");
  const [showPool, setShowPool] = useState(false);

  const applyPoolData = (raw) => {
    console.log("getStockPool() 回傳：", raw);
    const arr = Array.isArray(raw) ? raw : [];
    setStockPool(arr);
    setPoolCount(arr.length);
    setPoolLastUpdated(arr[0]?.updated_at ?? null);
  };

  const applyFilterStatus = (status, stock_count, error_message) => {
    if (status === "running") {
      setIsFiltering(true);
      setFilterMsg("篩選進行中，請稍候...");
      localStorage.setItem(LS_FILTERING, "true");
    } else if (status === "completed") {
      setIsFiltering(false);
      setFilterMsg(`篩選完成，共 ${stock_count ?? "未知"} 檔股票`);
      localStorage.removeItem(LS_FILTERING);
    } else if (status === "failed") {
      setIsFiltering(false);
      setFilterMsg(`篩選失敗：${error_message ?? "未知錯誤"}`);
      localStorage.removeItem(LS_FILTERING);
    } else {
      // idle：清除可能殘留的舊旗標
      localStorage.removeItem(LS_FILTERING);
    }
  };

  // 頁面載入：取得股票池資料 + 以後端 status 為準決定初始狀態
  useEffect(() => {
    const init = async () => {
      try {
        const poolRes = await getStockPool();
        applyPoolData(poolRes.data?.data ?? poolRes.data);
      } catch {}

      try {
        const statusRes = await getFilterStatus();
        const d = statusRes.data?.data ?? statusRes.data ?? {};
        applyFilterStatus(d.status, d.stock_count, d.error_message);
      } catch {}
    };
    init();
  }, []);

  // 輪詢：isFiltering=true 時每 30 秒查詢一次後端狀態
  useEffect(() => {
    if (!isFiltering) return;

    const poll = async () => {
      try {
        const res = await getFilterStatus();
        const d = res.data?.data ?? res.data ?? {};
        if (d.status === "running") return; // 繼續等待

        // completed → 重新取得最新股票池
        if (d.status === "completed") {
          try {
            const poolRes = await getStockPool();
            applyPoolData(poolRes.data?.data ?? poolRes.data);
          } catch {}
        }
        applyFilterStatus(d.status, d.stock_count, d.error_message);
      } catch {
        // 輪詢失敗靜默忽略，下次繼續
      }
    };

    const timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, [isFiltering]);

  const handleFilter = () => {
    setIsFiltering(true);
    setFilterMsg("");
    localStorage.setItem(LS_FILTERING, "true");
    // fire-and-forget：實際狀態以 status API 輪詢為準
    runStockFilter().catch(() => {});
  };

  // ── 登出 ──────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 720 }}>
      <h5 className="section-title">系統設定</h5>

      {/* ── 監控股票清單 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 6 }}>監控股票清單</h6>
        <p style={{ color: "#8ab4d4", fontSize: 12, marginBottom: 14 }}>
          額外追蹤的個股（選填，系統會自動從股票池掃描）
        </p>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {watchList.map(({ code, name }) => (
            <div
              key={code}
              className="d-flex align-items-center gap-2"
              style={{
                background: "#06101e",
                border: "1px solid #1e3a5f",
                borderRadius: 6,
                padding: "4px 10px",
              }}
            >
              <span style={{ color: "#e0f0ff", fontWeight: 600 }}>{code}</span>
              {name !== code && (
                <span style={{ color: "#8ab4d4", fontSize: 12 }}>{name}</span>
              )}
              <button
                onClick={() => removeStock(code)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef5350",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ ...INPUT_STYLE, maxWidth: 140 }}
            placeholder="股票代號"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addStock()}
          />
          <button className="btn btn-outline-info btn-sm" onClick={addStock}>
            新增
          </button>
        </div>
      </div>

      {/* ── 策略參數 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 16 }}>策略參數設定</h6>

        <div className="mb-3">
          <label style={{ color: "#8ab4d4", fontSize: 13, display: "block", marginBottom: 6 }}>
            買進門檻（分）：<strong style={{ color: "#e0f0ff" }}>{strategy.buyThreshold}</strong>
          </label>
          <input
            type="range"
            className="form-range"
            min={1}
            max={8}
            value={strategy.buyThreshold}
            onChange={(e) => updateStrategy("buyThreshold", Number(e.target.value))}
            style={{ accentColor: "#26a69a" }}
          />
          <div className="d-flex justify-content-between" style={{ fontSize: 11, color: "#4a6a8a" }}>
            <span>1 分</span>
            <span>8 分</span>
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <label style={{ color: "#8ab4d4", fontSize: 13, display: "block", marginBottom: 6 }}>
              停損設定（%）
            </label>
            <input
              type="number"
              className="form-control form-control-sm"
              style={INPUT_STYLE}
              value={strategy.stopLoss}
              onChange={(e) => updateStrategy("stopLoss", Number(e.target.value))}
            />
          </div>
          <div className="col-6">
            <label style={{ color: "#8ab4d4", fontSize: 13, display: "block", marginBottom: 6 }}>
              獲利目標（%）
            </label>
            <input
              type="number"
              className="form-control form-control-sm"
              style={INPUT_STYLE}
              value={strategy.profitTarget}
              onChange={(e) => updateStrategy("profitTarget", Number(e.target.value))}
            />
          </div>
        </div>

        <button className="btn btn-outline-info btn-sm" onClick={saveStrategy}>
          {strategySaved ? "✓ 已儲存" : "儲存設定"}
        </button>
      </div>

      {/* ── 系統資訊 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 16 }}>系統資訊</h6>

        <div className="d-flex align-items-center gap-2 mb-2">
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background:
                connStatus === "ok"
                  ? "#26a69a"
                  : connStatus === "error"
                  ? "#ef5350"
                  : "#ffa726",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#8ab4d4", fontSize: 13 }}>
            {connStatus === "ok"
              ? "後端連線正常"
              : connStatus === "error"
              ? "後端連線失敗"
              : "連線確認中..."}
          </span>
        </div>

        {sysInfo && (
          <>
            <div style={{ color: "#8ab4d4", fontSize: 13, marginBottom: 4 }}>
              最後計算時間：
              <span style={{ color: "#e0f0ff" }}>{sysInfo.lastRunAt ?? "—"}</span>
            </div>
            <div style={{ color: "#8ab4d4", fontSize: 13 }}>
              評分紀錄筆數：
              <span style={{ color: "#e0f0ff" }}>{sysInfo.recordCount ?? "—"}</span>
            </div>
          </>
        )}
      </div>

      {/* ── 股票池管理 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 4 }}>股票池管理</h6>

        <div style={{ color: "#8ab4d4", fontSize: 13, marginBottom: 12 }}>
          <div>
            上次篩選時間：
            <span style={{ color: "#e0f0ff" }}>
              {poolLastUpdated ?? "—"}
            </span>
          </div>
          <div>
            目前股票池數量：
            <span style={{ color: "#e0f0ff" }}>
              {poolCount !== null ? `${poolCount} 檔` : "—"}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-2">
          <button
            className="btn btn-outline-warning btn-sm"
            onClick={handleFilter}
            disabled={isFiltering}
            style={{ opacity: isFiltering ? 0.6 : 1 }}
          >
            {isFiltering ? "篩選中，約需 5~10 分鐘..." : "開始篩選"}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowPool((v) => !v)}
          >
            {showPool ? "收合股票池" : "查看股票池"}
          </button>
        </div>

        {filterMsg && (
          <div
            style={{
              fontSize: 13,
              color: filterMsg.includes("完成")
                ? "#26a69a"
                : filterMsg.includes("進行中")
                ? "#4fc3f7"
                : "#ef5350",
              marginBottom: 8,
            }}
          >
            {filterMsg}
          </div>
        )}

        {showPool && (
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            {stockPool.length === 0 ? (
              <p style={{ color: "#8ab4d4", fontSize: 13 }}>目前無股票池資料</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["股票代號", "股票名稱", "殖利率", "市值"].map((col) => (
                      <th
                        key={col}
                        style={{
                          background: "#0a1520",
                          color: "#8ab4d4",
                          padding: "6px 12px",
                          borderBottom: "1px solid #1e3a5f",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockPool.map((s, idx) => (
                    <tr key={s.stock_code ?? idx}>
                      <td style={{ color: "#e0f0ff", padding: "6px 12px", borderBottom: "1px solid #12243a" }}>
                        {s.stock_code ?? "—"}
                      </td>
                      <td style={{ color: "#c8dff0", padding: "6px 12px", borderBottom: "1px solid #12243a" }}>
                        {s.stock_name ?? getStockName(s.stock_code) ?? "—"}
                      </td>
                      <td style={{ color: "#c8dff0", padding: "6px 12px", borderBottom: "1px solid #12243a" }}>
                        {s.yield_pct != null ? `${Number(s.yield_pct).toFixed(2)}%` : "—"}
                      </td>
                      <td style={{ color: "#c8dff0", padding: "6px 12px", borderBottom: "1px solid #12243a" }}>
                        {s.market_cap != null ? Number(s.market_cap).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── 立即計算 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 12 }}>手動觸發</h6>
        <p style={{ color: "#8ab4d4", fontSize: 13, marginBottom: 12 }}>
          對完整股票池（311 檔）執行 AI 評分分析，約需 5–10 分鐘。
        </p>

        <button
          className="btn btn-outline-success btn-sm"
          onClick={handleRunNow}
          disabled={runStatus === "running"}
        >
          {runStatus === "running" ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              />
              評分進行中...
            </>
          ) : (
            "立即計算今日評分"
          )}
        </button>

        {runStatus === "running" && (
          <div style={{ fontSize: 12, color: "#4fc3f7", marginTop: 8 }}>
            正在對所有股票池執行評分，約需 5–10 分鐘，完成後請重新整理儀表板
          </div>
        )}

        {runMsg && (
          <div
            className={`mt-2`}
            style={{
              fontSize: 13,
              color: runStatus === "error" ? "#ef5350" : "#4fc3f7",
            }}
          >
            {runMsg}
          </div>
        )}
      </div>

      {/* ── 登出 ── */}
      <div style={{ textAlign: "right" }}>
        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          登出
        </button>
      </div>
    </div>
  );
}
