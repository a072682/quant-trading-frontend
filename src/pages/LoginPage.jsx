import { useState } from "react";
import { useNavigate } from "react-router-dom";
// useDispatch：觸發 Redux action
import { useDispatch } from "react-redux";
// login：呼叫後端登入 API
import { login } from "../slice/api/auth";
// setLogin：登入成功後更新 Redux store 的認證狀態
import { setLogin } from "../slice/authSlice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // email：使用者輸入的 Email（同時作為帳號）
  const [email, setEmail] = useState("");
  // password：使用者輸入的密碼
  const [password, setPassword] = useState("");
  // error：登入失敗時顯示的錯誤訊息
  const [error, setError] = useState("");
  // isLoading：按鈕 loading 狀態，防止重複送出
  const [isLoading, setIsLoading] = useState(false);

  // 表單送出處理函式
  const handleSubmit = async (e) => {
    // 阻止表單預設的頁面重整行為
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // 呼叫後端登入 API
      // 輸入：{ username: email, password }
      // 輸出：{ success, data: { access_token, token_type } }
      const res = await login({ username: email, password });
      const token = res.data?.data?.access_token;

      // 若回傳資料中找不到 token，視為登入失敗
      if (!token) throw new Error("回傳資料中找不到 token");

      // 將 token 存入 localStorage，供後續所有 API 請求的 Authorization Header 使用
      localStorage.setItem("token", token);

      // 更新 Redux store 的登入狀態，讓其他頁面可以讀取 isLogin 和 username
      dispatch(setLogin({ token, username: email }));

      // 登入成功，跳轉到儀表板
      navigate("/");
    } catch (err) {
      // 優先顯示後端回傳的錯誤訊息（detail 或 message），否則顯示通用提示
      const msg =
        err.response?.data?.detail ??
        err.response?.data?.message ??
        err.message ??
        "登入失敗，請再試一次";
      setError(msg);
    } finally {
      // 無論成功或失敗都解除 loading 狀態
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark">
      <div
        className="card bg-secondary text-white p-4 shadow"
        style={{ width: "100%", maxWidth: 400 }}
      >
        <h4 className="mb-4 text-center">量化交易系統 · 登入</h4>

        {/* 登入失敗時顯示錯誤訊息 */}
        {error && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">密碼</label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {/* 登入中禁用按鈕，避免重複送出 */}
          <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
            {isLoading ? "登入中…" : "登入"}
          </button>
        </form>
      </div>
    </div>
  );
}
