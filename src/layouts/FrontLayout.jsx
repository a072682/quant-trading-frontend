import { Outlet } from "react-router-dom";
import Header from "../components/common/Header/Header";
import ModalRoot from "../components/common/ModalRoot/ModalRoot";
import useWebSocket from "../ws/useWebSocket";

export default function FrontLayout() {
  useWebSocket();

  return (
    <>
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <ModalRoot />
    </>
  );
}
