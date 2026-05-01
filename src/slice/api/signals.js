import api from "./index";

// 觸發後端對完整股票池執行全量 AI 評分（非同步背景任務，約需 5–10 分鐘）
// 輸入：無（需登入，Authorization Header 由 api 實例自動附加）
// 輸出：HTTP 202，{ message } 表示任務已接受並開始執行
export const runFull = () => api.post("/api/signals/run");

// 取得今日所有股票的評分結果（完整股票池，不限門檻）
// 輸入：無（需登入）
// 輸出：{ success, data: [{ stock_code, stock_name, total_score, ai_action, ai_reason, confidence, ... }] }
export const getTodaySignals = () => api.get("/api/signals/today");

// 取得今日評分最高的前三名推薦股票
// 輸入：無（需登入）
// 輸出：{ success, data: [{ stock_code, stock_name, total_score, ai_action, ai_reason, confidence }] }
export const getTopSignals = () => api.get("/api/signals/top");
