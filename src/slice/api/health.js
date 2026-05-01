import api from "./index";

// 後端健康確認，用於檢查伺服器與資料庫連線狀態
// 輸入：無
// 輸出：{ success, server, database, timestamp }
export const checkHealth = () => api.get("/api/health");