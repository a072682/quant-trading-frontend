import { createBrowserRouter } from "react-router-dom";
import FrontLayout from "../layouts/FrontLayout";
import PrivateRoute from "../components/common/PrivateRoute";
import DashboardPage from "../pages/DashboardPage";
import AnalysisPage from "../pages/AnalysisPage";
import HistoryPage from "../pages/HistoryPage";
import SettingsPage from "../pages/SettingsPage";
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
          { path: "analysis", element: <AnalysisPage /> },
          { path: "history", element: <HistoryPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);

export default router;
