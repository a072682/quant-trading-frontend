import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { runNow } from "../api/signals";

const DEFAULT_WATCH_LIST = ["0056", "0050", "2886", "2412", "5880"];
const DEFAULT_STRATEGY = { buyThreshold: 5, stopLoss: -3, profitTarget: 6 };
const LS_WATCH = "watchList";
const LS_STRATEGY = "strategySettings";

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
  const [watchList, setWatchList] = useState(() =>
    loadLS(LS_WATCH, DEFAULT_WATCH_LIST)
  );
  const [newCode, setNewCode] = useState("");

  const addStock = () => {
    const code = newCode.trim().toUpperCase();
    if (!code || watchList.includes(code)) return;
    const updated = [...watchList, code];
    setWatchList(updated);
    localStorage.setItem(LS_WATCH, JSON.stringify(updated));
    setNewCode("");
  };

  const removeStock = (code) => {
    const updated = watchList.filter((c) => c !== code);
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
  const [runStatus, setRunStatus] = useState("idle"); // idle | running | done | error
  const [runMsg, setRunMsg] = useState("");

  const handleRunNow = async () => {
    setRunStatus("running");
    setRunMsg("");
    try {
      const res = await runNow();
      setRunStatus("done");
      setRunMsg(res.data?.message || "計算完成");
    } catch (err) {
      setRunStatus("error");
      setRunMsg(err.response?.data?.message || "執行失敗，請稍後再試");
    }
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
        <h6 style={{ color: "#4fc3f7", marginBottom: 16 }}>監控股票清單</h6>

        <div className="d-flex flex-wrap gap-2 mb-3">
          {watchList.map((code) => (
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

      {/* ── 立即計算 ── */}
      <div style={CARD_STYLE}>
        <h6 style={{ color: "#4fc3f7", marginBottom: 12 }}>手動觸發</h6>
        <p style={{ color: "#8ab4d4", fontSize: 13, marginBottom: 12 }}>
          立即對所有監控股票執行 AI 評分分析，通常需要 30–60 秒。
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
              計算中...
            </>
          ) : (
            "立即計算今日評分"
          )}
        </button>

        {runMsg && (
          <div
            className={`mt-2`}
            style={{
              fontSize: 13,
              color: runStatus === "done" ? "#26a69a" : "#ef5350",
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
