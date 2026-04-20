import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-fluid py-5 text-center">
      <h1 style={{ color: "#4fc3f7", fontSize: "4rem", fontWeight: 700 }}>404</h1>
      <p style={{ color: "rgba(200, 220, 255, 0.7)", marginBottom: "2rem" }}>
        找不到此頁面
      </p>
      <Link to="/" className="btn btn-outline-info">
        回到儀表板
      </Link>
    </div>
  );
}
