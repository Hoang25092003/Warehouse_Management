import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Col, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Supplier() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formSupplier, setFormSupplier] = useState({
    supplier_id: "",
    supplier_name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {

    fetchSuppliers();
  }, []);

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

  const handleEdit = (supplier) => {
    setEditingSupplierId(supplier.supplier_id);
    setFormSupplier({
      supplier_id: supplier.supplier_id,
      supplier_name: supplier.supplier_name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address
    });
    setShowModal(true);
  };

  const handleDelete = async (supplier) => {
    console.log(`Xóa NCC ID: ${supplier.supplier_id}`);
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp: ${supplier.supplier_name}?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/api/suppliers/${supplier.supplier_id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        // Cập nhật lại danh sách nhà cung cấp sau khi xóa
        setSuppliers((prev) => prev.filter(p => p.supplier_id !== supplier.supplier_id));
        toast.success("Đã xóa nhà cung cấp thành công!");
      } catch (err) {
        console.error('❌ Chi tiết lỗi khi xóa nhà cung cấp:', err);
        toast.error("Đã xảy ra lỗi khi xóa nhà cung cấp!");
      }
    }
  };

  const handleSave = () => {
    if (editingSupplierId) {
      handleSaveEdit(); // chỉnh sửa
    } else {
      handleAddSupplier(); // thêm mới
    }
  };

  const handleAddSupplier = async () => {
    try {
      const token = localStorage.getItem('token');
      const newSupplier = { ...formSupplier };
      const response = await axios.post("http://localhost:3000/api/suppliers", newSupplier, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSuppliers(prev => [...prev, response.data]);
      handleClose();
      toast.success("Đã thêm nhà cung cấp thành công!");
    } catch (err) {
      toast.error("Lỗi khi thêm nhà cung cấp mới!");
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedSupplier = {
        supplier_id: formSupplier.supplier_id,
        supplier_name: formSupplier.supplier_name,
        contact_person: formSupplier.contact_person,
        phone: formSupplier.phone,
        email: formSupplier.email,
        address: formSupplier.address
      };

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:3000/api/suppliers/${editingSupplierId}`, updatedSupplier,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuppliers((prevSupplier) =>
        prevSupplier.map((w) =>
          w.supplier_id === editingSupplierId ? { ...w, ...response.data } : w
        )
      );

      handleClose(); // Reset lại modal và form
      toast.success("Đã cập nhật nhà cung cấp thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật nhà cung cấp:", err);
      toast.error("Đã xảy ra lỗi khi lưu chỉnh sửa.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingSupplierId(null);
    setFormSupplier({
      supplier_id: "",
      supplier_name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
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
          Lỗi khi tải nhà cung cấp: {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Quản Lý Nhà Cung Cấp</h1>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm nhà cung cấp
        </Button>
        <Form className="mb-3 d-flex justify-content-end align-items-center">
          <Form.Group controlId="searchBar" className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "700px" }}
            />
          </Form.Group>
        </Form>
        <Button variant="info" onClick={fetchSuppliers} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("supplier_name")}>
              Tên nhà cung cấp <FontAwesomeIcon icon={getSortIcon("supplier_name")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("contact_person")}>
              Người liên hệ <FontAwesomeIcon icon={getSortIcon("contact_person")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("phone")}>
              SĐT <FontAwesomeIcon icon={getSortIcon("phone")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("email")}>
              Email <FontAwesomeIcon icon={getSortIcon("email")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("address")}>
              Địa chỉ <FontAwesomeIcon icon={getSortIcon("address")} /></th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {suppliers
            .filter((supplier) =>
              (supplier?.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => {
              if (!sortConfig.key) return 0;
              const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
              const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

              if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
              if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
              return 0;
            })
            .map((supplier, index) => {
              return (
                <tr key={supplier.supplier_id}>
                  <td>{supplier.supplier_name}</td>
                  <td>{supplier.contact_person || "N/A"}</td>
                  <td>{supplier.phone}</td>
                  <td>
                    <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
                  </td>
                  <td>{supplier.address || "N/A"}</td>
                  <td className="text-center">
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(supplier)}>
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(supplier)}>
                      <FontAwesomeIcon icon={faTrash} /> Xóa
                    </Button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingSupplierId ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên nhà cung cấp</Form.Label>
                  <Form.Control
                    type="text"
                    name="supplier_name"
                    value={formSupplier.supplier_name}
                    onChange={(e) => setFormSupplier({ ...formSupplier, supplier_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Người liên hệ</Form.Label>
                  <Form.Control
                    type="text"
                    name="contact_person"
                    value={formSupplier.contact_person}
                    onChange={(e) => setFormSupplier({ ...formSupplier, contact_person: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formSupplier.phone}
                    onChange={(e) => setFormSupplier({ ...formSupplier, phone: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="text"
                    name="email"
                    value={formSupplier.email}
                    onChange={(e) => setFormSupplier({ ...formSupplier, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Form.Group className="mb-3">
                <Form.Label>Địa chỉ</Form.Label>
                <Form.Control
                  type="text"
                  name="address"
                  value={formSupplier.address}
                  onChange={(e) => setFormSupplier({ ...formSupplier, address: e.target.value })}
                  required
                />
              </Form.Group>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleSave}>
            {editingSupplierId ? "Lưu thay đổi" : "Thêm mới"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Supplier;
