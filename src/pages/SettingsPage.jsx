import { useState } from "react";
import { useDispatch } from "react-redux";
import { open, MODALS } from "../slice/modalSlice";

export default function SettingsPage() {
  const dispatch = useDispatch();

  const [settings, setSettings] = useState({
    buyScoreThreshold: 4,
    wsReconnectInterval: 5,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  });

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    dispatch(open({
      modal: MODALS.ALERT,
      data: { title: "已儲存", message: "設定已更新（目前為前端暫存，重新整理後恢復預設值）" },
    }));
  };

  return (
    <div className="container-fluid py-4">
      <h5 className="section-title">系統設定</h5>

      <div className="settings-form">
        <div className="settings-group">
          <label className="settings-label">買入評分門檻</label>
          <input
            type="number"
            className="settings-input"
            min={1}
            max={5}
            value={settings.buyScoreThreshold}
            onChange={(e) => handleChange("buyScoreThreshold", Number(e.target.value))}
          />
          <span className="settings-hint">總分達到此門檻才顯示「確認買入」按鈕（預設：4 分）</span>
        </div>

        <div className="settings-group">
          <label className="settings-label">WebSocket 重連間隔（秒）</label>
          <input
            type="number"
            className="settings-input"
            min={1}
            max={60}
            value={settings.wsReconnectInterval}
            onChange={(e) => handleChange("wsReconnectInterval", Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label className="settings-label">後端 API 網址</label>
          <input
            type="text"
            className="settings-input settings-input--wide"
            value={settings.apiBaseUrl}
            onChange={(e) => handleChange("apiBaseUrl", e.target.value)}
          />
        </div>

        <button className="btn-buy mt-3" onClick={handleSave}>
          儲存設定
        </button>
      </div>
    </div>
  );
}
