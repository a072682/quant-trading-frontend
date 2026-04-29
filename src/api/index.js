import axios from "axios";

// 建立統一的 axios 實例，供所有 API 模組共用
// baseURL 從環境變數 VITE_API_BASE_URL 讀取（例如 http://localhost:8000）
// timeout 設為 60 秒，避免後端無回應時前端永遠等待
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,
});

// Request 攔截器：每次發出請求前自動帶上 JWT Token
// 從 localStorage 取得登入後儲存的 token，加入 Authorization Header
// 如果 token 不存在（未登入），則不加入 Header，讓後端回傳 401
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response 攔截器：統一處理後端回傳的錯誤狀態
// 成功（2xx）：直接回傳 response，不做任何處理
// 401 未授權：清除本地 token 並強制跳轉到登入頁
// 其他錯誤：繼續拋出 Promise.reject，讓各個呼叫端自行處理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
