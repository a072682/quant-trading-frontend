import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import "./_Header.scss";

export default function Header() {
  const isConnected = useSelector((state) => state.ws.isConnected);

  return (
    <Navbar expand="lg" className="quant-header" fixed="top">
      <Container>
        <Navbar.Brand as={NavLink} to="/">
          QuantSystem
          <Badge
            bg={isConnected ? "success" : "danger"}
            className="ms-2 ws-badge"
          >
            {isConnected ? "連線中" : "未連線"}
          </Badge>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto">
            <Nav.Link as={NavLink} to="/">儀表板</Nav.Link>
            <Nav.Link as={NavLink} to="/analysis">K線分析</Nav.Link>
            <Nav.Link as={NavLink} to="/history">歷史紀錄</Nav.Link>
            <Nav.Link as={NavLink} to="/settings">設定</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
