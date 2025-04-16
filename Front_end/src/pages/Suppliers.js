import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Button } from "react-bootstrap";
import axios from "axios";

function Supplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/suppliers');
        setSuppliers(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

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
          Error loading suppliers: {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">📦 Quản Lý Nhà Cung Cấp</h1>
        <Button variant="primary" size="sm">
          + Thêm nhà cung cấp
        </Button>
      </div>
      
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Nhà cung cấp</th>
            <th>Người liên hệ</th>
            <th>Số điện thoại</th>
            <th>Email</th>
            <th>Địa chỉ</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier, index) => (
            <tr key={supplier.supplier_id}>
              <td>{index + 1}</td>
              <td>{supplier.supplier_name}</td>
              <td>{supplier.contact_person || 'N/A'}</td>
              <td>{supplier.phone}</td>
              <td>
                <a href={`mailto:${supplier.email}`}>{supplier.email}</a>
              </td>
              <td>{supplier.address || 'N/A'}</td>
              <td className="text-center">
                <Button variant="warning" size="sm" className="me-2">Sửa</Button>
                <Button variant="danger" size="sm">Xóa</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Supplier;