import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// checkHealth：確認後端伺服器與資料庫連線狀態
import { checkHealth } from "../api/auth";
// runFull：觸發全量評分；getTodaySignals：取得今日評分（用於輪詢完成偵測）
import { runFull, getTodaySignals } from "../api/signals";
// getStockPool：取得股票池清單；getFilterStatus：查詢篩選狀態；runFilter：觸發篩選
import { getStockPool, getFilterStatus, runFilter } from "../api/stocks";

// localStorage 的 key 常數
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

// 通用卡片容器樣式
const CARD_STYLE = {
  background: "#0d1b2e",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  border: "1px solid #1e3a5f",
};

export default function SettingsPage() {
  const navigate = useNavigate();

  // ── 系統資訊 ──────────────────────────────────────────────────────────────
  // systemInfo：整合三個 API 組合出的系統狀態物件，null 表示尚未載入
  // 包含：server、database、timestamp、signalCount、stockCount、filterStatus
  const [systemInfo, setSystemInfo] = useState(null);

  // 載入系統資訊：同時查詢 health、今日評分筆數、股票池篩選狀態
  // getFilterStatus 可能回傳 404（尚未有篩選紀錄），以獨立 try/catch 處理
  const loadSystemInfo = async () => {
    try {
      // 取得後端伺服器與資料庫連線狀態
      const healthRes = await checkHealth();

      // 取得今日評分清單，用陣列長度當作「今日評分筆數」
      let signalCount = 0;
      try {
        const signalsRes = await getTodaySignals();
        signalCount = signalsRes.data?.data?.length ?? 0;
      } catch {
        // 尚無今日評分時維持 0
      }

      // 取得篩選任務狀態（可能尚未有篩選紀錄，回傳 404）
      let stockCount = 0;
      let filterStatusVal = "尚未執行";
      try {
        const statusRes = await getFilterStatus();
        stockCount = statusRes.data?.data?.stock_count ?? 0;
        filterStatusVal = statusRes.data?.data?.status ?? "尚未執行";
      } catch {
        // 尚未有篩選紀錄時維持預設值
      }

      // 將三個 API 的結果合併成單一 systemInfo 物件
      setSystemInfo({
        server: healthRes.data?.server,        // 伺服器狀態：ok 或 error
        database: healthRes.data?.database,    // 資料庫狀態：ok 或 error
        timestamp: healthRes.data?.timestamp,  // 伺服器目前時間
        signalCount,                           // 今日評分筆數
        stockCount,                            // 股票池股票數量
        filterStatus: filterStatusVal,         // 篩選任務狀態
      });
    } catch {
      // health API 失敗視為完全無法連線
    }
  };

  // 頁面掛載時執行一次系統資訊載入
  useEffect(() => {
    loadSystemInfo();
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

  // 評分完成偵測輪詢：runStatus 為 "running" 時啟動，每 30 秒查詢一次今日評分
  // 偵測邏輯：評分筆數 > 10 代表評分已有結果，切換為 done 狀態
  // 超時保護：若超過 FULL_SCAN_TIMEOUT_MS 仍未完成，自動回到 idle 並提示重新觸發
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
        // 以今日評分筆數作為完成依據：筆數 > 10 代表評分已有結果
        const res = await getTodaySignals();
        const count = res.data?.data?.length ?? 0;
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
  // stockPool：後端回傳的完整股票池陣列
  // poolCount：股票池目前的股票總數，null 表示尚未載入
  // poolLastUpdated：最後一次篩選完成的時間
  // isFiltering：篩選任務是否進行中（true 時按鈕禁用、啟動輪詢）
  // filterMsg：篩選狀態說明文字
  // showPool：是否展開顯示股票池表格
  const [stockPool, setStockPool] = useState([]);
  const [poolCount, setPoolCount] = useState(null);
  const [poolLastUpdated, setPoolLastUpdated] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterMsg, setFilterMsg] = useState("");
  const [showPool, setShowPool] = useState(false);

  // 將 getStockPool() 的回傳資料套用到三個獨立 state
  const applyPoolData = (raw) => {
    const arr = Array.isArray(raw) ? raw : [];
    setStockPool(arr);
    setPoolCount(arr.length);
    setPoolLastUpdated(arr[0]?.updated_at ?? null);
  };

  // 根據後端回傳的篩選任務狀態更新 UI 與 localStorage 旗標
  // 輸入：status（"running" | "completed" | "failed" | "idle"）、stock_count、error_message
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

  // 頁面初始化：取得股票池清單，並以後端 status 為準決定 isFiltering 初始值
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
  // completed → 重新拉取最新股票池；failed → 顯示錯誤訊息並停止輪詢
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

  // 「開始篩選」按鈕的點擊處理
  // fire-and-forget：立即更新 UI 為 running，實際狀態以 status API 輪詢為準
  const handleFilter = () => {
    setIsFiltering(true);
    setFilterMsg("");
    localStorage.setItem(LS_FILTERING, "true");
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

      {/* ── 系統資訊 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 16 }}>系統資訊</h6>

        {/* systemInfo 為 null 表示尚未載入完成，顯示確認中提示 */}
        {!systemInfo ? (
          <p style={{ color: "#8ab4d4", fontSize: 13 }}>連線確認中...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>

            {/* 伺服器狀態：ok 顯示綠色「正常」，其他顯示紅色「異常」 */}
            <div style={{ color: "#8ab4d4" }}>
              伺服器狀態：
              <span style={{ color: systemInfo.server === "ok" ? "#26a69a" : "#ef5350", fontWeight: 600 }}>
                {systemInfo.server === "ok" ? "正常" : "異常"}
              </span>
            </div>

            {/* 資料庫狀態：ok 顯示綠色「正常」，其他顯示紅色「異常」 */}
            <div style={{ color: "#8ab4d4" }}>
              資料庫狀態：
              <span style={{ color: systemInfo.database === "ok" ? "#26a69a" : "#ef5350", fontWeight: 600 }}>
                {systemInfo.database === "ok" ? "正常" : "異常"}
              </span>
            </div>

            {/* 伺服器時間：直接顯示後端回傳的 timestamp 字串 */}
            <div style={{ color: "#8ab4d4" }}>
              伺服器時間：
              <span style={{ color: "#e0f0ff" }}>{systemInfo.timestamp ?? "—"}</span>
            </div>

            {/* 今日評分筆數：由 getTodaySignals 回傳陣列長度計算 */}
            <div style={{ color: "#8ab4d4" }}>
              今日評分數量：
              <span style={{ color: "#e0f0ff" }}>{systemInfo.signalCount} 筆</span>
            </div>

            {/* 股票池數量：由 getFilterStatus 回傳的 stock_count 取得 */}
            <div style={{ color: "#8ab4d4" }}>
              股票池數量：
              <span style={{ color: "#e0f0ff" }}>{systemInfo.stockCount} 支</span>
            </div>

            {/* 篩選狀態：由 getFilterStatus 回傳的 status 取得 */}
            <div style={{ color: "#8ab4d4" }}>
              篩選狀態：
              <span style={{ color: "#e0f0ff" }}>{systemInfo.filterStatus}</span>
            </div>

          </div>
        )}
      </div>

      {/* ── 股票池管理 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 4 }}>股票池管理</h6>

        <div style={{ color: "#8ab4d4", fontSize: 13, marginBottom: 12 }}>
          <div>
            上次篩選時間：
            <span style={{ color: "#e0f0ff" }}>{poolLastUpdated ?? "—"}</span>
          </div>
          <div>
            目前股票池數量：
            <span style={{ color: "#e0f0ff" }}>
              {poolCount !== null ? `${poolCount} 檔` : "—"}
            </span>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-2">
          {/* 篩選進行中時按鈕禁用，避免重複觸發 */}
          <button
            className="btn btn-outline-warning btn-sm"
            onClick={handleFilter}
            disabled={isFiltering}
            style={{ opacity: isFiltering ? 0.6 : 1 }}
          >
            {isFiltering ? "篩選中，約需 5~10 分鐘..." : "開始篩選"}
          </button>
          {/* 展開 / 收合股票池表格 */}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowPool((v) => !v)}
          >
            {showPool ? "收合股票池" : "查看股票池"}
          </button>
        </div>

        {/* 篩選狀態訊息：顏色依完成/進行中/失敗區分 */}
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

        {/* 股票池表格：showPool=true 時顯示 */}
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
                        {s.stock_name ?? "—"}
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

      {/* ── 立即計算今日評分 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 12 }}>手動觸發</h6>
        <p style={{ color: "#8ab4d4", fontSize: 13, marginBottom: 12 }}>
          對完整股票池執行 AI 評分分析，約需 5–10 分鐘。
        </p>

        {/* 評分進行中時顯示 spinner 並禁用按鈕 */}
        <button
          className="btn btn-outline-success btn-sm"
          onClick={handleRunNow}
          disabled={runStatus === "running"}
        >
          {runStatus === "running" ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              評分進行中...
            </>
          ) : (
            "立即計算今日評分"
          )}
        </button>

        {/* 評分進行中：顯示預估完成時間 */}
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

        {/* 狀態訊息：依 runStatus 顯示對應顏色 */}
        {runMsg && (
          <div
            style={{
              fontSize: 13,
              marginTop: 8,
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
