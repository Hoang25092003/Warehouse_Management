import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
// import a from "../App"
const LogIn = () => {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');
    if (storedUsername && storedPassword) {
      setUserName(storedUsername);
      setPassword(storedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || `Lỗi đăng nhập (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();
      if (!data) {
        toast.error('Dữ liệu trả về không hợp lệ');
        return;
      }

      // Ghi nhớ tài khoản nếu có
      if (rememberMe) {
        localStorage.setItem('username', username);
        localStorage.setItem('password', password);
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
      }

      navigate('/');
    } catch (err) {
      toast.error('Không thể kết nối đến máy chủ');
    }
  };

  const handlePasswordRecovery = () => {
    if (!recoveryEmail) {
      toast.warn('Vui lòng nhập email để khôi phục mật khẩu');
      return;
    }
    toast.info(`Mã khôi phục sẽ được gửi đến email: ${recoveryEmail}. Hãy chờ đợi giây lát`);
    setShowRecoveryModal(false);
    setRecoveryEmail('');
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100" style={{ maxWidth: '1300px' }}>
        <Col md={8} className="d-flex flex-column justify-content-center align-items-center">
          <Row className="d-flex flex-column align-items-center justify-content-center text-center">
            <h1 className="text-danger mb-4">ĐỒ ÁN TỐT NGHIỆP 🎓</h1>
            <h2 className="text-primary mb-4">Hệ thống quản lý kho hàng 📦</h2>
            <p className="text-black text-center">
              Quản lý thông tin sản phẩm, tồn kho, và xuất nhập kho hiệu quả với hệ thống mã vạch hiện đại.
            </p>
          </Row>
          <Row className='mb-3'>
            <img
              src="/img/barcode3.gif" 
              alt="Barcode GIF"
              style={{ width: "150px", height: "auto" }}
            />
          </Row>
        </Col>
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <h2 className="text-center mb-4">Đăng Nhập</h2>
              <Form>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="rememberMe">
                  <Form.Check
                    type="checkbox"
                    label="Nhớ tài khoản"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </Form.Group>
                <Button variant="primary" type="button" className="w-100" onClick={handleSubmit}>
                  Đăng Nhập
                </Button>
              </Form>
              <div className="mt-3 text-center">
                <Button variant="link" onClick={() => setShowRecoveryModal(true)}>
                  Quên mật khẩu?
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal Khôi Phục Mật Khẩu */}
      <Modal show={showRecoveryModal} onHide={() => setShowRecoveryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Khôi phục mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="recoveryEmail">
            <Form.Label>Email khôi phục</Form.Label>
            <Form.Control
              type="email"
              placeholder="Nhập email của bạn"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRecoveryModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handlePasswordRecovery}>
            Gửi yêu cầu
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LogIn;
