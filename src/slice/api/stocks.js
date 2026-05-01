import api from "./index";

// 觸發後端重新篩選股票池（非同步背景任務，約需 5–10 分鐘）
// 輸入：無（需登入，Authorization Header 由 api 實例自動附加）
// 輸出：HTTP 202，{ message } 表示任務已接受並開始執行
export const runFilter = () => api.post("/api/stocks/filter");

// 取得目前股票池的完整清單
// 輸入：無（需登入）
// 輸出：{ success, data: [{ stock_code, stock_name, yield_pct, market_cap }] }
export const getStockPool = () => api.get("/api/stocks/pool");

// 查詢股票池篩選任務的目前執行狀態
// 輸入：無（需登入）
// 輸出：{ success, data: { status, stock_count, error_message, started_at, completed_at } }
//       status 可能值：idle | running | completed | failed
export const getFilterStatus = () => api.get("/api/stocks/status");
