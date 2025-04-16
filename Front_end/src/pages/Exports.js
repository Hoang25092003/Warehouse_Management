import React, { useState, useEffect } from "react";
import { Table, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle, faEdit, faTrashAlt, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

function Exports() {
  const [exports, setExports] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    product_id: "",
    warehouse_id: "",
    quantity: 0,
    customer_info: "",
    operator: "Nguyễn Văn A"
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load dữ liệu khi component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exportsRes, productsRes, warehousesRes] = await Promise.all([
        axios.get('http://localhost:3000/api/exports'),
        axios.get('http://localhost:3000/api/products'),
        axios.get('http://localhost:3000/api/warehouses')
      ]);
      setExports(exportsRes.data);
      setProducts(productsRes.data);
      setWarehouses(warehousesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.warehouse_id || formData.quantity <= 0) {
      setError("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        // Cập nhật bản ghi
        await axios.put(`http://localhost:3000/api/exports/${editingId}`, formData);
      } else {
        // Thêm mới
        await axios.post('http://localhost:3000/api/exports', formData);
      }
      await fetchData(); // Refresh dữ liệu
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exportItem) => {
    setFormData({
      product_id: exportItem.product_id,
      warehouse_id: exportItem.warehouse_id,
      quantity: exportItem.quantity,
      customer_info: exportItem.customer_info || "",
      operator: exportItem.user_id || "Nguyễn Văn A"
    });
    setEditingId(exportItem.export_id);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa không?")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:3000/api/exports/${id}`);
        await fetchData(); // Refresh dữ liệu
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      warehouse_id: "",
      quantity: 0,
      customer_info: "",
      operator: "Nguyễn Văn A"
    });
    setEditingId(null);
    setError(null);
  };

  if (loading && exports.length === 0) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Quản Lý Xuất Hàng</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form className="mb-4">
        <Row>
          <Col md={3}>
            <Form.Group controlId="productSelect">
              <Form.Label>Sản phẩm</Form.Label>
              <Form.Control
                as="select"
                name="product_id"
                value={formData.product_id}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Chọn sản phẩm</option>
                {products.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.name} (Còn: {product.quantity})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group controlId="warehouseSelect">
              <Form.Label>Kho</Form.Label>
              <Form.Control
                as="select"
                name="warehouse_id"
                value={formData.warehouse_id}
                onChange={handleInputChange}
                disabled={loading}
              >
                <option value="">Chọn kho</option>
                {warehouses.map((w) => (
                  <option key={w.warehouse_id} value={w.warehouse_id}>
                    {w.name} (Đã dùng: {w.current_capacity}/{w.capacity})
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group controlId="quantityInput">
              <Form.Label>Số lượng</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                disabled={loading}
              />
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group controlId="customerInfo">
              <Form.Label>Thông tin KH</Form.Label>
              <Form.Control
                type="text"
                name="customer_info"
                value={formData.customer_info}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Tên KH/SĐT"
              />
            </Form.Group>
          </Col>

          <Col md={2} className="d-flex align-items-end">
            <Button 
              variant={editingId ? "warning" : "danger"} 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>
                  <FontAwesomeIcon icon={faMinusCircle} />{" "}
                  {editingId ? "Cập nhật" : "Xuất hàng"}
                </>
              )}
            </Button>
            {editingId && (
              <Button variant="secondary" className="ms-2" onClick={resetForm}>
                Hủy
              </Button>
            )}
          </Col>
        </Row>
      </Form>

      <div className="d-flex justify-content-between mb-3">
        <h4>Danh sách xuất hàng</h4>
        <Button variant="info" size="sm" onClick={fetchData} disabled={loading}>
          <FontAwesomeIcon icon={faSync} /> Làm mới
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Ngày xuất</th>
            <th>Sản phẩm</th>
            <th>Số lượng</th>
            <th>Kho</th>
            <th>Khách hàng</th>
            <th>Người thao tác</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {exports.map((item) => {
            const product = products.find(p => p.product_id === item.product_id);
            const warehouse = warehouses.find(w => w.warehouse_id === item.warehouse_id);
            
            return (
              <tr key={item.export_id}>
                <td>{new Date(item.export_date).toLocaleString('vi-VN')}</td>
                <td>{product?.name || 'N/A'}</td>
                <td>{item.quantity}</td>
                <td>{warehouse?.name || 'N/A'}</td>
                <td>{item.customer_info || 'N/A'}</td>
                <td>{item.user_id}</td>
                <td className="text-center">
                  <Button
                    variant="warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(item)}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faEdit} /> Sửa
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item.export_id)}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} /> Xóa
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default Exports;