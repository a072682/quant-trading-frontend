import api from "./index";

// ── 以下函式對應的後端端點尚未重構完成，暫時停用 ────────────────────────

// 查詢指定股票的 K 線歷史資料
// 停用原因：後端 K 線資料端點尚未重構，目前無對應路由
// 未來用途：個股詳情頁面繪製 K 線圖表
// TODO: 待重構後啟用
// export const getKlineData = (stockCode) =>
//   api.get(`/api/stocks/kline/${stockCode}`);

// ── 目前啟用的函式 ────────────────────────────────────────────────────────

// 取得目前股票池清單（已通過篩選條件的所有股票）
// 輸入：無
// 輸出：axios Promise，response.data.data 為股票物件陣列
//       每個物件包含：stock_code、stock_name、yield_pct、market_cap、updated_at
export const getStockPool = () =>
  api.get("/api/stocks/pool");

// 查詢股票篩選任務的目前狀態
// 輸入：無
// 輸出：axios Promise，response.data.data 包含：
//       status（"idle" | "running" | "completed" | "failed"）、stock_count、error_message
// 備註：觸發 runStockFilter() 後需定期呼叫此函式輪詢任務進度
export const getFilterStatus = () =>
  api.get("/api/stocks/status");

// 觸發後端重新篩選股票池（非同步任務，約需 5–10 分鐘）
// 輸入：無
// 輸出：axios Promise，任務啟動後立即回傳（fire-and-forget）
// 備註：timeout 設為 900000ms（15 分鐘）防止 axios 提前中斷；
//       使用 api 實例以自動帶上 Authorization Header，不需手動讀取 token
export const runStockFilter = () =>
  api.post("/api/stocks/filter", {}, { timeout: 900000 });
