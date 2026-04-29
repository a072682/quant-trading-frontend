import api from "./index";

// ── 以下函式對應的後端端點尚未重構完成，暫時停用 ────────────────────────

// 查詢單一股票今日評分（例如 0056）
// 停用原因：後端已將「單檔查詢」整合進全量評分，不再提供獨立端點
// 未來用途：重構後可用於個股頁面顯示最新評分
// TODO: 待重構後啟用
// export const getTodaySignals = (stockCode = "0056") =>
//   api.get("/api/signals/today", { params: { stock_code: stockCode } });

// 立即對所有股票執行評分（舊版端點）
// 停用原因：已由 runFull() 取代，舊版端點不再維護
// 未來用途：若需要快速觸發單次評分且不需要完整股票池，可考慮重新啟用
// TODO: 待重構後啟用
// export const runNow = () =>
//   api.post("/api/signals/run-now");

// 對指定股票清單執行評分（舊版端點）
// 停用原因：後端已改為只接受全量評分，不支援傳入股票子集
// 未來用途：若後端重新支援自訂股票清單評分，可啟用此函式
// TODO: 待重構後啟用
// export const runNowWithStocks = (stocks) =>
//   api.post("/api/signals/run-now", { stocks });

// 對單一股票執行評分
// 停用原因：後端已整合至全量評分流程，獨立單檔端點已移除
// 未來用途：個股詳情頁面需要即時評分時可啟用
// TODO: 待重構後啟用
// export const runStock = (stockCode, stockName) =>
//   api.post("/api/signals/run-stock", { stock_code: stockCode, stock_name: stockName });

// 查詢指定股票的歷史評分紀錄
// 停用原因：後端歷史評分 API 尚未重構，目前無對應端點
// 未來用途：歷史頁面（HistoryPage）顯示個股評分走勢
// TODO: 待重構後啟用
// export const getSignalHistory = (stockCode) =>
//   api.get(`/api/signals/history/${stockCode}`);

// 查詢指定日期的所有評分
// 停用原因：後端按日期查詢端點尚未重構
// 未來用途：歷史頁面按日期篩選評分結果
// TODO: 待重構後啟用
// export const getSignalsByDate = (date) =>
//   api.get(`/api/signals/by-date/${date}`);

// ── 目前啟用的函式 ────────────────────────────────────────────────────────

// 查詢今日推薦股票（依評分排序取前 N 名，僅回傳達到門檻的標的）
// 輸入：limit（回傳筆數，預設 10）、minScore（最低評分門檻，預設 6）
// 輸出：axios Promise，response.data.data 為評分物件陣列
export const getTopSignals = (limit = 10, minScore = 6) =>
  api.get("/api/signals/top", { params: { limit, min_score: minScore } });

// 查詢今日所有股票評分（完整股票池，不限門檻）
// 輸入：無
// 輸出：axios Promise，response.data.data 為完整評分陣列，用於儀表板「全部評分」Tab
export const getTodayAllSignals = () =>
  api.get("/api/signals/today");

// 觸發後端對完整股票池執行 AI 評分（非同步任務，約需 5–10 分鐘）
// 輸入：無
// 輸出：axios Promise，response.data.message 為任務啟動確認訊息
// 備註：呼叫後需輪詢 /api/signals/stats 確認評分是否完成
export const runFull = () =>
  api.post("/api/signals/run");
