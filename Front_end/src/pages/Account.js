import React, { useState, useEffect } from "react";
import { Table, Button, Row, Col, Form, Modal, Spinner, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

function Account() {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    username: "", 
    email: "", 
    role: "staff", 
    password: "",
    fullname: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/users');
      setAccounts(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (account) => {
    setFormData({
      username: account.username,
      email: account.email,
      role: account.role,
      fullname: account.fullname || "",
      phone: account.phone || "",
      password: "" // Reset password khi edit
    });
    setPasswordConfirm("");
    setEditingId(account.user_id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:3000/api/users/${id}`);
        await fetchAccounts();
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.username || !formData.email || !formData.role) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Validate password khi tạo mới hoặc khi đổi password
    if ((!editingId || formData.password) && formData.password !== passwordConfirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      
      if (editingId) {
        // Cập nhật tài khoản
        await axios.put(`http://localhost:3000/api/users/${editingId}`, formData);
      } else {
        // Tạo tài khoản mới
        await axios.post('http://localhost:3000/api/users', formData);
      }
      
      await fetchAccounts();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ 
      username: "", 
      email: "", 
      role: "staff", 
      password: "",
      fullname: "",
      phone: ""
    });
    setPasswordConfirm("");
    setError(null);
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Quản Lý Tài Khoản</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm tài khoản
        </Button>
        <Button variant="info" onClick={fetchAccounts} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      {loading && accounts.length === 0 ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Tên tài khoản</th>
              <th>Mật khẩu</th>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Điện thoại</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={account.user_id}>
                <td>{index + 1}</td>
                <td>{account.username}</td>
                <td>{account.password}</td>
                <td>{account.email}</td>
                <td>{account.fullname || 'N/A'}</td>
                <td>{account.phone || 'N/A'}</td>
                <td>{account.role === 'admin' ? 'Quản trị' : 'Nhân viên'}</td>
                <td className="text-center">
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(account)}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(account.user_id)}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingId ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Tên tài khoản *</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={!!editingId}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="fullname">
                  <Form.Label>Họ và tên</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullname"
                    value={formData.fullname}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>
                    {editingId ? "Mật khẩu mới" : "Mật khẩu *"}
                    {editingId && <small className="text-muted"> (Để trống nếu không đổi)</small>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="passwordConfirm">
                  <Form.Label>Xác nhận mật khẩu {!editingId && '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={!formData.password && !!editingId}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Vai trò *</Form.Label>
              <Form.Control
                as="select"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="admin">Quản trị viên</option>
                <option value="staff">Nhân viên</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              editingId ? "Cập nhật" : "Tạo tài khoản"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Account;