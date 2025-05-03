import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Col, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Account() {
  const [user, setUser] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [formUser, setFormUser] = useState({
    user_id: "",
    username: "",
    email: "",
    role: "staff",
    password: "",
    fullname: "",
    phone: ""
  });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/profile", {
        method: "GET",
        credentials: "include", // Quan trọng để gửi cookie
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Không thể lấy thông tin người dùng:", err);
      setUser(null);
    }
    finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/users', {
        withCredentials: true,
      });
      // Mặc định tất cả password đều ẩn
      const accountsWithHiddenPasswords = response.data.map(account => ({
        ...account,
        showPassword: false
      }));

      setAccounts(accountsWithHiddenPasswords);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === "asc" ? faSortUp : faSortDown;
  };

  const handleEdit = (account) => {
    setEditingUserId(account.user_id);
    setFormUser({
      user_id: account.user_id,
      username: account.username,
      email: account.email,
      role: account.role,
      fullname: account.fullname || "",
      phone: account.phone || "",
      password: account.password
    });
    setPasswordConfirm(account.password);
    setShowModal(true);
  };

  const handleDelete = async (account) => {
    console.log(`Xóa User ID: ${account.user_id}`);
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        await axios.delete(`http://localhost:3000/api/users/${account.user_id}`, {
          withCredentials: true,
        });
        setAccounts((prevAccounts) => prevAccounts.filter((acc) => acc.user_id !== account.user_id));
        toast.success("Xóa tài khoản thành công");
      } catch (err) {
        console.error('❌ Chi tiết lỗi khi xóa tài khoản:', err);
        // Nếu là lỗi từ server có message
        if (err.response && err.response.data && err.response.data.error) {
          toast.error(err.response.data.error); // ví dụ: "Không thể xóa tài khoản admin"
        } else {
          toast.error("Đã xảy ra lỗi khi xóa tài khoản!");
        }
      }
    }
  };

  const handleSave = () => {
    if (editingUserId) {
      handleSaveEdit();
    } else {
      handleAddAccount();
    }
  }

  const handleAddAccount = async () => {
    try {
      const newAccount = { ...formUser };
      if (formUser.password !== passwordConfirm) {
        toast.error("Mật khẩu không khớp!");
        return;
      }
      if (!formUser.username || !formUser.email || !formUser.password) {
        toast.error("Vui lòng điền đầy đủ thông tin!");
        return;
      }
      if (formUser.password.length < 6) {
        toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
      }
      if (formUser.phone && !/^\d{10}$/.test(formUser.phone)) {
        toast.error("Số điện thoại không hợp lệ!");
        return;
      }
      if (formUser.email && !/\S+@\S+\.\S+/.test(formUser.email)) {
        toast.error("Email không hợp lệ!");
        return;
      }
      const response = await axios.post('http://localhost:3000/api/users', newAccount, {
        withCredentials: true,
      });
      setAccounts((prevAccounts) => [...prevAccounts, response.data]);
      handleClose();
      toast.success("Tạo tài khoản thành công");
    } catch (err) {
      console.error('❌ Chi tiết lỗi khi tạo tài khoản:', err);
      toast.error("Đã xảy ra lỗi khi tạo tài khoản!");
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedWarehouse = {
        user_id: formUser.user_id,
        username: formUser.username,
        email: formUser.email,
        password: formUser.password,
        fullname: formUser.fullname,
        phone: formUser.phone,
        role: formUser.role
      };
      if (formUser.password !== passwordConfirm) {
        toast.error("Mật khẩu không khớp!");
        return;
      }
      if (!formUser.username || !formUser.email) {
        toast.error("Vui lòng điền đầy đủ thông tin!");
        return;
      }
      if (formUser.phone && !/^\d{10}$/.test(formUser.phone)) {
        toast.error("Số điện thoại không hợp lệ!");
        return;
      }
      if (formUser.email && !/\S+@\S+\.\S+/.test(formUser.email)) {
        toast.error("Email không hợp lệ!");
        return;
      }
      const response = await axios.put(`http://localhost:3000/api/users/${editingUserId}`, updatedWarehouse, {
        withCredentials: true,
      });
      setAccounts((prevAccounts) =>
        prevAccounts.map((account) =>
          account.user_id === editingUserId ? { ...account, ...response.data } : account
        )
      );
      handleClose();
      toast.success("Cập nhật tài khoản thành công");

    } catch (err) {
      console.error('❌ Chi tiết lỗi khi cập nhật tài khoản:', err);
      toast.error("Đã xảy ra lỗi khi cập nhật tài khoản!");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingUserId(null);
    setFormUser({
      user_id: "",
      username: "",
      email: "",
      role: "staff",
      password: "",
      fullname: "",
      phone: ""
    });
    setPasswordConfirm("");
  };

  const handleShowPasswordClick = (userId) => {
    setSelectedUserId(userId);
    setConfirmModalVisible(true);
  };

  const handleConfirmPassword = () => {
    try {
      const account = accounts.find(acc => acc.user_id === user.user_id);

      if (account && confirmPassword === account.password) {
        const updatedAccounts = accounts.map(acc =>
          acc.user_id === selectedUserId ? { ...acc, showPassword: true } : acc
        );
        setAccounts(updatedAccounts);
        setConfirmModalVisible(false);
        setConfirmPassword("");
      } else {
        toast.error("Mật khẩu xác nhận không đúng!");
      }
    } catch (err) {
      console.error("Lỗi khi giải mã token:", err);
      toast.error("Token không hợp lệ.");
      localStorage.removeItem("token");
    }
  };



  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger">
          Error loading accounts: {error}
        </Alert>
      </div>
    );
  }
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Quản Lý Tài Khoản</h1>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm tài khoản
        </Button>
        <Form className="mb-3 d-flex justify-content-end align-items-center">
          <Form.Group controlId="searchBar" className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm tài khoản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "700px" }}
            />
          </Form.Group>
        </Form>
        <Button variant="info" onClick={fetchAccounts} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("username")}>
              Tên tài khoản <FontAwesomeIcon icon={getSortIcon("username")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("password")}>
              Mật khẩu <FontAwesomeIcon icon={getSortIcon("password")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
              Email <FontAwesomeIcon icon={getSortIcon("email")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("fullname")}>
              Họ tên <FontAwesomeIcon icon={getSortIcon("fullname")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("phone")}>
              SĐT <FontAwesomeIcon icon={getSortIcon("phone")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("role")}>
              Vai trò <FontAwesomeIcon icon={getSortIcon("role")} /></th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {accounts
            .filter((account) =>
              (account?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => {
              if (!sortConfig.key) return 0;
              const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
              const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

              if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
              if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
              return 0;
            })
            .map((account, index) => (
              <tr key={account.user_id}>
                <td>{index + 1}</td>
                <td>{account.username}</td>
                <td>
                  {account.showPassword ? (
                    <span>{account.password}</span>
                  ) : (
                    <>
                      <span>******</span>{" "}
                      <Button variant="light" size="sm" onClick={() => handleShowPasswordClick(account.user_id)}>
                        👁
                      </Button>
                    </>
                  )}
                </td>
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
                  >
                    <FontAwesomeIcon icon={faEdit} /> Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(account)}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Xóa
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingUserId ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Tên tài khoản</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formUser.username}
                    onChange={(e) => setFormUser({ ...formUser, username: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formUser.email}
                    onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
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
                    value={formUser.fullname}
                    onChange={(e) => setFormUser({ ...formUser, fullname: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="phone">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formUser.phone}
                    onChange={(e) => setFormUser({ ...formUser, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>
                    {editingUserId ? "Mật khẩu mới" : "Mật khẩu *"}
                    {editingUserId && <small className="text-muted"> (Để nguyên nếu không đổi)</small>}
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formUser.password}
                    onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="passwordConfirm">
                  <Form.Label>Xác nhận mật khẩu {!editingUserId && '*'}</Form.Label>
                  <Form.Control
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    disabled={!formUser.password && !!editingUserId}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Vai trò *</Form.Label>
              <Form.Control
                as="select"
                name="role"
                value={formUser.role}
                onChange={(e) => setFormUser({ ...formUser, role: e.target.value })}
              >
                <option value="admin">Quản trị viên</option>
                <option value="staff">Nhân viên</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              editingUserId ? "Cập nhật" : "Tạo tài khoản"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmModalVisible} onHide={() => setConfirmModalVisible(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận mật khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Nhập mật khẩu của bạn để xem</Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Mật khẩu xác nhận..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmModalVisible(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleConfirmPassword}>Xác nhận</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default Account;