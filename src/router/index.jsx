import { createBrowserRouter } from "react-router-dom";
import FrontLayout from "../layouts/FrontLayout";
import PrivateRoute from "../components/common/PrivateRoute";
import DashboardPage from "../pages/DashboardPage";
// import AnalysisPage from "../pages/AnalysisPage";   // TODO: 待儀表板穩定後開放
// import HistoryPage from "../pages/HistoryPage";     // TODO: 待儀表板穩定後開放
import SettingsPage from "../pages/SettingsPage";
import SimulationPage from "../pages/SimulationPage";
import LoginPage from "../pages/LoginPage";
import NotFound from "../pages/NotFound";

// 應用程式的路由設定，使用 createBrowserRouter（HTML5 History 模式）
const router = createBrowserRouter([
  // 登入頁：不需認證即可存取
  { path: "/login", element: <LoginPage /> },

  {
    // 根路由包在 PrivateRoute 內：未登入時自動導向 /login
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        // FrontLayout 提供共用的導覽列與頁面框架，所有子頁面共用此版型
        element: <FrontLayout />,
        children: [
          // 儀表板（首頁）：顯示今日訊號評分與推薦標的
          { index: true, element: <DashboardPage /> },

          // 設定頁：監控清單、策略參數、手動觸發評分與股票池篩選
          // 保留原因：儀表板測試期間需使用「立即計算今日評分」與「重新篩選股票池」按鈕
          { path: "settings", element: <SettingsPage /> },

          // 模擬交易頁：以假資金測試策略績效
          // 停用原因：simulation 相關後端 API 尚未重構
          // TODO: 待儀表板穩定後開放
          { path: "simulation", element: <SimulationPage /> },

          // 萬用路由：捕捉所有未匹配的路徑，顯示 404 頁面
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default router;
