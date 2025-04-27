import React, { useState, useEffect } from "react";
import { Container, Row, Col, Navbar, Button, Nav, Collapse, Dropdown } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser, faSignOutAlt, faChevronDown, faChevronUp, faChevronLeft, faUserEdit } from "@fortawesome/free-solid-svg-icons";

const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showReportSubmenu, setShowReportSubmenu] = useState(false);
  const [showReportSubmenu1, setShowReportSubmenu1] = useState(false);
  const [user, setUser] = useState(null); // State to store logged-in user
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Check if user is logged in (simulate with localStorage)
        const payload = token.split('.')[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = decodeURIComponent(escape(atob(base64)));
        const userData = JSON.parse(decodedPayload);
        setUser(userData);
      } catch (err) {
        console.error("Token không hợp lệ:", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleReportSubmenu = () => setShowReportSubmenu(!showReportSubmenu);
  const toggleReportSubmenu1 = () => setShowReportSubmenu1(!showReportSubmenu1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };
  // Check if user is logged in  

  return (
    <>
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" style={{ position: "fixed", top: 0, width: "100%", zIndex: 1030 }}>
        <Container fluid>
          {/* Sidebar Toggle Button */}
          <Button
            variant="dark"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? "Đóng Sidebar" : "Mở Sidebar"}
            className="ms-2"
          >
            <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faBars} />
          </Button>
          <Navbar.Brand as={NavLink} to="/">📦 Quản Lý Kho</Navbar.Brand>
          {user && (
            <Nav className="ms-auto">
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="link"
                  className="d-flex align-items-center text-white text-decoration-none"
                  id="dropdown-user"
                >
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  {user.fullname} ({user.role === "admin" ? "Quản trị viên" : "Nhân viên"})
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => {
                      navigate("/profile");
                    }}
                  >
                    <FontAwesomeIcon icon={faUserEdit} className="me-2" />Tài khoản của tôi
                  </Dropdown.Item>

                  <Dropdown.Item
                    onClick={() => {
                      localStorage.removeItem("token");
                      setUser(null);
                      navigate("/login");
                    }}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" />Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          )}

        </Container>
      </Navbar>

      <Container fluid>
        <Row>
          {/* Sidebar */}
          <Col
            md={2}
            className={`vh-100 p-3 bg-primary sidebar-transition ${isSidebarOpen ? "d-block" : "d-none"}`}
            style={{
              position: "fixed",
              top: "45px",
              left: 0,
              bottom: 0,
              zIndex: 1020,
              transition: "transform 0.9s ease",
              transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
              overflowY: "auto",
            }}
          >
            <Nav className="flex-column">
              <Nav.Link className="text-white" as={NavLink} to="/" onClick={closeSidebar}>
                🏠 Trang chủ
              </Nav.Link>
              {user?.role === "admin" && (
                <>
                  <Nav.Link className="text-white" as={NavLink} to="/products" onClick={closeSidebar}>
                    📋 Quản lý sản phẩm
                  </Nav.Link>
                  <Nav.Link className="text-white" as={NavLink} to="/warehouse" onClick={closeSidebar}>
                    🏢 Quản lý kho hàng
                  </Nav.Link>
                  <Nav.Link className="text-white" as={NavLink} to="/suppliers" onClick={closeSidebar}>
                    🏭 Quản lý nhà cung cấp
                  </Nav.Link>
                  <Nav.Link className="text-white" as={NavLink} to="/account" onClick={closeSidebar}>
                    👤 Quản lý tài khoản
                  </Nav.Link>
                  <Nav.Link className="text-white" as={NavLink} to="/category" onClick={closeSidebar}>
                    🗂️ Quản lý danh mục
                  </Nav.Link>
                </>
              )}
              <Nav.Link className="text-white" onClick={toggleReportSubmenu}>
                📦 Quản lý hàng hóa{" "}
                <FontAwesomeIcon icon={showReportSubmenu ? faChevronUp : faChevronDown} className="float-end" />
              </Nav.Link>
              <Collapse in={showReportSubmenu}>
                <div className="ms-3">
                  <Nav.Link className="text-white" as={NavLink} to="/import" onClick={closeSidebar}>
                    📥 Nhập hàng
                  </Nav.Link>
                  <Nav.Link className="text-white" as={NavLink} to="/export" onClick={closeSidebar}>
                    📤 Xuất hàng
                  </Nav.Link>
                  <Nav.Link className="text-white" as={NavLink} to="/check" onClick={closeSidebar}>
                    🔍 Kiểm hàng
                  </Nav.Link>
                </div>
              </Collapse>
              {user?.role === "admin" && (
                <>
                  <Nav.Link className="text-white" onClick={toggleReportSubmenu1}>
                    📊 Báo cáo{" "}
                    <FontAwesomeIcon icon={showReportSubmenu1 ? faChevronUp : faChevronDown} className="float-end" />
                  </Nav.Link>
                  <Collapse in={showReportSubmenu1}>
                    <div className="ms-3">
                      <Nav.Link className="text-white" as={NavLink} to="/create_report" onClick={closeSidebar}>
                        📄 Tạo báo cáo
                      </Nav.Link>
                      <Nav.Link className="text-white" as={NavLink} to="/history_report" onClick={closeSidebar}>
                        📚 Lịch sử báo cáo
                      </Nav.Link>
                    </div>
                  </Collapse>
                </>
              )}
              {user?.role === "staff" && (
                <>
                  <Nav.Link className="text-white" as={NavLink} to="/create_report" onClick={closeSidebar}>
                    📄 Tạo báo cáo
                  </Nav.Link>
                </>
              )}
              {user && (
                <Nav.Link className="text-danger d-flex align-items-center" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Đăng xuất
                </Nav.Link>
              )}
            </Nav>
          </Col>

          {/* Main content */}
          <Col
            onClick={() => setSidebarOpen(false)}
            md={12} className="p-4"
            style={{
              marginTop: "50px",
            }}
          >
            {children}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Layout;
