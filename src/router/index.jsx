import { createBrowserRouter } from "react-router-dom";
import FrontLayout from "../layouts/FrontLayout";
import PrivateRoute from "../components/common/PrivateRoute";
import DashboardPage from "../pages/DashboardPage";
// import AnalysisPage from "../pages/AnalysisPage";   // TODO: 待儀表板穩定後開放
// import HistoryPage from "../pages/HistoryPage";     // TODO: 待儀表板穩定後開放
import SettingsPage from "../pages/SettingsPage";
// import SimulationPage from "../pages/SimulationPage"; // TODO: 待儀表板穩定後開放
import LoginPage from "../pages/LoginPage";
import NotFound from "../pages/NotFound";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        element: <FrontLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          // TODO: 待儀表板穩定後開放
          // { path: "analysis", element: <AnalysisPage /> },
          // TODO: 待儀表板穩定後開放
          // { path: "history", element: <HistoryPage /> },
          // 保留 settings：儀表板測試期間需使用「立即計算今日評分」按鈕
          { path: "settings", element: <SettingsPage /> },
          // TODO: 待儀表板穩定後開放
          // { path: "simulation", element: <SimulationPage /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default router;
