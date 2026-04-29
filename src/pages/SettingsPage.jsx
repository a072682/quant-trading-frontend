import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { runFull } from "../api/signals";
import { getStockPool, getFilterStatus, runFilter } from "../api/stocks";
import { getWatchList, getStockName } from "../utils/watchList";

// 策略參數的預設值，用於首次進入或 localStorage 資料損毀時的備援
const DEFAULT_STRATEGY = { buyThreshold: 5, stopLoss: -3, profitTarget: 6 };

// localStorage 的 key 常數，集中管理避免散落各處造成拼寫錯誤
const LS_WATCH = "watchList";
const LS_STRATEGY = "strategySettings";
const LS_FILTERING = "isFiltering";
const LS_FULL_SCAN = "fullScanRunning"; // 儲存全量評分任務的啟動時間戳

// 全量評分最長等待時間：12 分鐘，超過則視為任務異常，自動解除 running 狀態
const FULL_SCAN_TIMEOUT_MS = 12 * 60 * 1000;

// 檢查 localStorage 中是否有尚未超時的全量評分任務
// 用於頁面重新載入時還原按鈕的 running 狀態，避免使用者切換頁面後按鈕被重置
// 輸出：true = 任務仍在進行中；false = 無任務或已超時
function isFullScanActive() {
  const ts = localStorage.getItem(LS_FULL_SCAN);
  if (!ts) return false;
  if (Date.now() - Number(ts) > FULL_SCAN_TIMEOUT_MS) {
    localStorage.removeItem(LS_FULL_SCAN);
    return false;
  }
  return true;
}

// 根據任務啟動時間戳計算預估完成時間（假設約需 10 分鐘）
// 輸入：startTs（任務啟動的 Unix 毫秒時間戳）
// 輸出：台灣格式的時間字串，例如「14:35」
function formatETA(startTs) {
  return new Date(startTs + 10 * 60 * 1000).toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

// 安全讀取 localStorage 並 JSON.parse，解析失敗時回傳 fallback
// 輸入：key（localStorage key）、fallback（解析失敗時的預設值）
// 輸出：解析後的物件，或 fallback
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

  // ── 監控股票清單 ──────────────────────────────────────────────────────────
  // watchList：使用者手動新增的額外追蹤股票（儲存在 localStorage）
  // newCode：新增股票的輸入框暫存值
  const [watchList, setWatchList] = useState(() => getWatchList());
  const [newCode, setNewCode] = useState("");

  // 新增股票到監控清單
  // 輸入：由 newCode state 取得使用者輸入的股票代號
  // 輸出：更新 watchList state 並同步寫入 localStorage
  const addStock = () => {
    const code = newCode.trim().toUpperCase();
    if (!code || watchList.some((item) => item.code === code)) return;
    const updated = [...watchList, { code, name: getStockName(code) }];
    setWatchList(updated);
    localStorage.setItem(LS_WATCH, JSON.stringify(updated));
    setNewCode("");
  };

  // 從監控清單移除指定股票
  // 輸入：code（股票代號字串）
  // 輸出：更新 watchList state 並同步寫入 localStorage
  const removeStock = (code) => {
    const updated = watchList.filter((item) => item.code !== code);
    setWatchList(updated);
    localStorage.setItem(LS_WATCH, JSON.stringify(updated));
  };

  // ── 策略參數 ──────────────────────────────────────────────────────────────
  // strategy：目前生效的策略參數（buyThreshold、stopLoss、profitTarget）
  // strategySaved：「儲存成功」的短暫提示旗標，2 秒後自動清除
  const [strategy, setStrategy] = useState(() =>
    loadLS(LS_STRATEGY, DEFAULT_STRATEGY)
  );
  const [strategySaved, setStrategySaved] = useState(false);

  // 更新單一策略欄位，不影響其他欄位
  const updateStrategy = (key, value) =>
    setStrategy((prev) => ({ ...prev, [key]: value }));

  // 將目前策略參數儲存到 localStorage，並顯示 2 秒的確認提示
  const saveStrategy = () => {
    localStorage.setItem(LS_STRATEGY, JSON.stringify(strategy));
    setStrategySaved(true);
    setTimeout(() => setStrategySaved(false), 2000);
  };

  // ── 系統資訊 ──────────────────────────────────────────────────────────────
  // connStatus：後端連線狀態，"checking" | "ok" | "error"
  // sysInfo：後端回傳的評分統計資料（lastRunAt、recordCount）
  const [connStatus, setConnStatus] = useState("checking");
  const [sysInfo, setSysInfo] = useState(null);

  // 頁面掛載時呼叫 /api/signals/stats 確認後端連線狀態
  // 成功：顯示綠燈並記錄最後評分時間與筆數
  // 失敗：顯示紅燈，不影響其他功能使用
  useEffect(() => {
    const checkConn = async () => {
      try {
        const res = await api.get("/api/signals/stats");
        setSysInfo(res.data.data || null);
        setConnStatus("ok");
      } catch {
        setConnStatus("error");
      }
    };
    checkConn();
  }, []);

  // ── 立即計算今日評分 ───────────────────────────────────────────────────────
  // runStatus：評分任務的目前狀態，"idle" | "running" | "done" | "error"
  //   - 頁面初始化時讀取 localStorage，若有未超時的任務則直接進入 running 狀態
  // runMsg：顯示在按鈕下方的狀態說明文字
  // scanStartTime：任務啟動的 Unix 時間戳，用於計算並顯示預估完成時間
  const [runStatus, setRunStatus] = useState(() =>
    isFullScanActive() ? "running" : "idle"
  );
  const [runMsg, setRunMsg] = useState("");
  const [scanStartTime, setScanStartTime] = useState(() => {
    const ts = localStorage.getItem(LS_FULL_SCAN);
    return ts ? Number(ts) : null;
  });

  // 「立即計算今日評分」按鈕的點擊處理
  // 流程：呼叫 runFull() → 儲存啟動時間戳到 localStorage → 進入 running 狀態
  // 後端回傳 400：表示評分已在進行中，仍進入 running 狀態等待完成
  // 其他錯誤：進入 error 狀態並顯示錯誤訊息，清除 localStorage 旗標
  const handleRunNow = async () => {
    setRunStatus("running");
    setRunMsg("");
    try {
      const res = await runFull();
      const now = Date.now();
      localStorage.setItem(LS_FULL_SCAN, String(now));
      setScanStartTime(now);
      setRunMsg(res.data?.message || "評分任務已啟動，完成後請重新整理儀表板");
    } catch (err) {
      if (err.response?.status === 400) {
        const now = Date.now();
        localStorage.setItem(LS_FULL_SCAN, String(now));
        setScanStartTime(now);
        setRunMsg("評分已在進行中");
      } else {
        localStorage.removeItem(LS_FULL_SCAN);
        setScanStartTime(null);
        setRunStatus("error");
        setRunMsg("評分啟動失敗，請稍後再試");
      }
    }
  };

  // 評分完成偵測輪詢：runStatus 為 "running" 時啟動，每 30 秒查詢一次 stats
  // 偵測邏輯：若 recordCount > 10，判定評分已有結果，切換為 done 狀態
  // 超時保護：若超過 FULL_SCAN_TIMEOUT_MS 仍未完成，自動回到 idle 並提示重新觸發
  // 備註：useEffect cleanup 會在 runStatus 改變時清除舊的 interval，防止記憶體洩漏
  useEffect(() => {
    if (runStatus !== "running") return;

    const poll = async () => {
      // 先檢查是否已超時
      const ts = localStorage.getItem(LS_FULL_SCAN);
      if (!ts || Date.now() - Number(ts) > FULL_SCAN_TIMEOUT_MS) {
        localStorage.removeItem(LS_FULL_SCAN);
        setScanStartTime(null);
        setRunStatus("idle");
        setRunMsg("評分任務已超時，請重新觸發");
        return;
      }

      try {
        const res = await api.get("/api/signals/stats");
        const count = res.data?.data?.recordCount ?? 0;
        if (count > 10) {
          localStorage.removeItem(LS_FULL_SCAN);
          setScanStartTime(null);
          setRunStatus("done");
          setRunMsg("評分完成！請前往儀表板查看結果");
        }
      } catch {
        // 輪詢失敗靜默忽略，下次繼續
      }
    };

    poll(); // 立即執行一次（切回頁面時不用等 30 秒）
    const timer = setInterval(poll, 30000);
    return () => clearInterval(timer);
  }, [runStatus]);

  // ── 股票池管理 ────────────────────────────────────────────────────────────
  // stockPool：後端回傳的完整股票池陣列（每個元素含 stock_code、stock_name、yield_pct、market_cap）
  // poolCount：股票池目前的股票總數，null 表示尚未載入
  // poolLastUpdated：股票池最後一次篩選完成的時間，取第一筆資料的 updated_at
  // isFiltering：篩選任務是否進行中（true 時按鈕禁用、啟動輪詢）
  // filterMsg：篩選狀態說明文字（進行中 / 完成 / 失敗）
  // showPool：是否展開顯示股票池表格
  const [stockPool, setStockPool] = useState([]);
  const [poolCount, setPoolCount] = useState(null);
  const [poolLastUpdated, setPoolLastUpdated] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterMsg, setFilterMsg] = useState("");
  const [showPool, setShowPool] = useState(false);

  // 將 getStockPool() 的回傳資料套用到三個獨立 state
  // 後端回傳陣列而非物件，拆成三個 state 避免每次渲染都要做巢狀存取
  const applyPoolData = (raw) => {
    console.log("getStockPool() 回傳：", raw);
    const arr = Array.isArray(raw) ? raw : [];
    setStockPool(arr);
    setPoolCount(arr.length);
    setPoolLastUpdated(arr[0]?.updated_at ?? null);
  };

  // 根據後端回傳的篩選任務狀態更新 UI 與 localStorage 旗標
  // 輸入：status（"running" | "completed" | "failed" | "idle"）、stock_count、error_message
  // 備註：completed 和 failed 都會清除 localStorage 旗標，停止輪詢
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

  // 頁面初始化：同時取得股票池清單與篩選任務狀態
  // 以後端 status 為準決定 isFiltering 初始值，確保重新整理後狀態與後端一致
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

  // 篩選任務完成偵測輪詢：isFiltering 為 true 時啟動，每 30 秒查詢一次後端狀態
  // 若任務完成（completed）：重新拉取最新股票池並更新 UI
  // 若任務失敗（failed）：顯示錯誤訊息並停止輪詢
  // 備註：useEffect cleanup 會在 isFiltering 變為 false 時自動清除 interval
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

  // 「重新篩選股票池」按鈕的點擊處理
  // 流程：立即更新 UI 為 running 狀態 → fire-and-forget 呼叫 runFilter()
  //       → 實際完成狀態由上方輪詢偵測，不依賴此請求的回應
  // 備註：runFilter() timeout 為 15 分鐘，但前端不等待它完成
  const handleFilter = () => {
    setIsFiltering(true);
    setFilterMsg("");
    localStorage.setItem(LS_FILTERING, "true");
    // fire-and-forget：實際狀態以 status API 輪詢為準
    runFilter().catch(() => {});
  };

  // ── 登出 ──────────────────────────────────────────────────────────────────
  // 清除 localStorage 中的 JWT token，並導向登入頁
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
            {scanStartTime && (
              <span style={{ marginLeft: 8 }}>
                （預計完成時間：{formatETA(scanStartTime)}）
              </span>
            )}
          </div>
        )}

        {runMsg && (
          <div
            className={`mt-2`}
            style={{
              fontSize: 13,
              color: runStatus === "error" ? "#ef5350" : runStatus === "done" ? "#26a69a" : "#4fc3f7",
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
