import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await login(email, password);
      const token = res.data?.data?.access_token;
      if (!token) throw new Error("回傳資料中找不到 token");
      localStorage.setItem("token", token);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message ?? err.message ?? "登入失敗，請再試一次";
      setError(msg);
    } finally {
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
        {error && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
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
            <label htmlFor="password" className="form-label">
              密碼
            </label>
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
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
          >
            {isLoading ? "登入中…" : "登入"}
          </button>
        </form>
      </div>
    </div>
  );
}
