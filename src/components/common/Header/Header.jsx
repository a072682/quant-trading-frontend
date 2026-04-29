import { useState, useEffect } from "react";
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import { NavLink } from "react-router-dom";
// 使用統一的 axios 實例發送 health check 請求（自動帶 token）
import api from "../../../api/index";
import "./_Header.scss";

export default function Header() {
  // 後端連線狀態，預設為 false（未連線），等第一次 health check 完成後更新
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 確認後端連線狀態的函式：呼叫 /api/health，success=true 代表伺服器與資料庫均正常
    const checkHealth = async () => {
      try {
        const res = await api.get("/api/health");
        // success=true 代表後端和資料庫都正常
        setIsConnected(res.data?.success === true);
      } catch {
        // 任何錯誤（網路斷線、後端未啟動）都視為未連線
        setIsConnected(false);
      }
    };

    // 頁面載入時立即確認一次，不等待第一個 interval
    checkHealth();

    // 每 30 秒自動重新確認一次連線狀態
    const interval = setInterval(checkHealth, 30000);

    // 元件卸載時清除定時器，避免記憶體洩漏
    return () => clearInterval(interval);
  }, []); // 空依賴陣列：只在元件掛載時執行一次，interval 會自行維持

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
            <Nav.Link as={NavLink} to="/settings">設定</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
