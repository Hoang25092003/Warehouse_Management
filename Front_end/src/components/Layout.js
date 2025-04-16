import React, { useState, useEffect } from "react";
import { Container, Row, Col, Navbar, Nav } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import "./Layout.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null); // State to store logged-in user
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Check if user is logged in (simulate with localStorage)
        const payload = token.split('.')[1];
        const decodedPayload = atob(payload);
        const userData = JSON.parse(decodedPayload);
        setUser(userData);
      } catch (err) {
        console.error("Token không hợp lệ:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);
  

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false); // Close the sidebar after selecting a menu item
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // đúng key là "token"
    setUser(null);
    navigate("/login");
  };
  // Check if user is logged in  

  return (
    <>
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/">📦 Quản Lý Kho</Navbar.Brand>
          <Nav className="ms-auto">
            {user ? (
              <Nav.Link className="d-flex align-items-center text-white">
                <FontAwesomeIcon icon={faUser} className="me-2" /> {user.fullname} ({user.role})
              </Nav.Link>
            ) : (
              <Nav.Link as={NavLink} to="/login" className="d-flex align-items-center text-white">
                <FontAwesomeIcon icon={faUser} className="me-2" /> Đăng nhập
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar> 

      {/* Toggle Button */}
      <button
        className={`btn btn-primary sidebar-toggle ${isSidebarOpen ? "hidden" : ""}`}
        onClick={toggleSidebar}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col
            md={2}
            className={`sidebar vh-auto p-3 ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
            style={{
              display: isSidebarOpen ? "block" : "none",
            }}
          >
            <Nav className="flex-column">
              <Nav.Link as={NavLink} to="/" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                🏠 Trang chủ
              </Nav.Link>
              <Nav.Link as={NavLink} to="/products" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                📋 Quản lý sản phẩm
              </Nav.Link>
              <Nav.Link as={NavLink} to="/warehouse" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                🏢 Quản lý kho hàng
              </Nav.Link>
              <Nav.Link as={NavLink} to="/import" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                📥 Quản lý nhập hàng
              </Nav.Link>
              <Nav.Link as={NavLink} to="/exports" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                📤 Quản lý xuất hàng
              </Nav.Link>
              <Nav.Link as={NavLink} to="/suppliers" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                🏭 Quản lý nhà cung cấp
              </Nav.Link>
              <Nav.Link as={NavLink} to="/reports" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                📊 Báo cáo
              </Nav.Link>
              <Nav.Link as={NavLink} to="/account" className={({ isActive }) => (isActive ? "active" : "")} onClick={closeSidebar}>
                👤 Quản lý tài khoản
              </Nav.Link>
              {user && (
                <Nav.Link className="text-danger d-flex align-items-center" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Đăng xuất
                </Nav.Link>
              )}
            </Nav>
          </Col>

          {/* Main content */}
          <Col
            md={isSidebarOpen ? 10 : 12}
            className="p-4"
          >
            {children}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Layout;
