import api from "./index";

// 使用者登入
// 輸入：email（字串）、password（字串）
// 輸出：axios Promise，成功時 response.data 包含 access_token
// 備註：後端採用 OAuth2 表單格式，需以 URLSearchParams 傳送，欄位名稱為 username/password
export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);
  return api.post("/api/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
