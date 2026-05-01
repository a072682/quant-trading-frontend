import api from "./index";

// 使用者登入
// 後端使用 OAuth2PasswordRequestForm，需要 form 格式（非 JSON）
// URLSearchParams 會自動將物件轉為 application/x-www-form-urlencoded
// 輸入：data 物件，格式為 { username: email字串, password: 密碼字串 }
// 輸出：{ success, message, data: { access_token, token_type } }
export const login = (data) =>
  api.post("/api/auth/login", new URLSearchParams(data), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

// 使用者登出（需帶 Authorization Header，由 api 實例自動附加）
// 輸入：無
// 輸出：{ success, message, data: { logged_out, timestamp } }
export const logout = () => api.post("/api/auth/logout");


// 確認 token 是否仍然有效（需帶 Authorization Header）
// 輸入：無（token 由 api 實例自動附加）
// 輸出：{ success, message, data: { valid: true } }
export const verifyToken = () => api.get("/api/auth/verify");