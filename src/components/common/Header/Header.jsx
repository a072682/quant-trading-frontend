import { useState, useEffect } from "react";
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setConnected, setLogout } from "../../../slice/authSlice";
import api from "../../../slice/api/index";
import { verifyToken } from "../../../slice/api/auth";
import "./_Header.scss";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 本地連線狀態，用於控制 Badge 顯示，預設為 false（未連線）
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 確認後端連線狀態：呼叫 /api/health，success=true 代表伺服器與資料庫均正常
    const checkHealth = async () => {
      try {
        const res = await api.get("/api/health");
        const connected = res.data?.success === true;
        // 更新本地 state 控制 Badge 顯示
        setIsConnected(connected);
        // 同步更新 Redux store，讓其他頁面（例如設定頁）可以直接讀取連線狀態
        dispatch(setConnected(connected));
      } catch {
        // 任何錯誤（網路斷線、後端未啟動）都視為未連線
        setIsConnected(false);
        dispatch(setConnected(false));
      }
    };

    const checkTokenValidity = async () => {
      const token = localStorage.getItem("token");
      // localStorage 沒有 token，視為未登入，清空狀態並跳轉登入頁
      if (!token) {
        dispatch(setLogout());
        navigate("/login");
        return;
      }
      try {
        // 帶著 token 向後端確認是否仍然有效
        await verifyToken();
        // 200 回應：token 有效，不需要做任何事
      } catch {
        // 401 或其他錯誤：token 無效或過期，強制登出
        localStorage.removeItem("token");
        dispatch(setLogout());
        navigate("/login");
      }
    };

    // 頁面載入時確認一次連線
    checkHealth();
    // 頁面載入時確認一次是否登入
    checkTokenValidity();

  }, []); // 空依賴陣列：只在元件掛載時執行一次

  return (
    // fixed="top" 讓 Header 固定在頁面頂端，不隨捲動消失
    <Navbar expand="lg" className="quant-header" fixed="top">
      <Container>
        {/* 品牌名稱旁顯示後端連線狀態徽章，綠色=正常、紅色=異常 */}
        <Navbar.Brand as={NavLink} to="/">
          QuantSystem
          <Badge
            bg={isConnected ? "success" : "danger"}
            className="ms-2 ws-badge"
          >
            {isConnected ? "連線中" : "未連線"}
          </Badge>
        </Navbar.Brand>

        {/* 手機版漢堡按鈕，點擊後展開導覽選單 */}
        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          {/* 目前只開放儀表板和設定，其他頁面待後端重構後開放 */}
          <Nav className="ms-auto">
            <Nav.Link as={NavLink} to="/">儀表板</Nav.Link>
            <Nav.Link as={NavLink} to="/simulation">模擬交易</Nav.Link>
            <Nav.Link as={NavLink} to="/settings">設定</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
