import React, { useState, useEffect } from "react";
import { Table, Button, Spinner, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

function Warehouse() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/warehouses');
        setWarehouses(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
      case "maintenance":
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-warning" />;
      case "closed":
        return <FontAwesomeIcon icon={faCircle} className="text-danger" />;
      default:
        return <FontAwesomeIcon icon={faCircle} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Đang hoạt động";
      case "maintenance":
        return "Đang bảo trì";
      case "closed":
        return "Đã đóng";
      default:
        return status;
    }
  };

  const calculateUsagePercentage = (capacity, currentCapacity) => {
    return Math.round((currentCapacity / capacity) * 100);
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
          Error loading warehouses: {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Quản Lý Kho Hàng</h1>
      <Table striped bordered hover responsive>
        <thead className="table-dark text-center">
          <tr>
            <th>Tên Kho</th>
            <th>Vị Trí</th>
            <th>Sức Chứa</th>
            <th>Trạng Thái</th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map((warehouse) => {
            const usagePercentage = calculateUsagePercentage(warehouse.capacity, warehouse.current_capacity);
            
            return (
              <tr key={warehouse.warehouse_id}>
                <td>{warehouse.name}</td>
                <td>{warehouse.location}</td>
                <td>
                  <div className="mb-1">
                    <strong>Sử dụng: {usagePercentage}%</strong>
                  </div>
                  <div className="progress" style={{ height: '20px' }}>
                    <div 
                      className={`progress-bar ${usagePercentage > 90 ? 'bg-danger' : usagePercentage > 70 ? 'bg-warning' : 'bg-success'}`}
                      role="progressbar"
                      style={{ width: `${usagePercentage}%` }}
                      aria-valuenow={usagePercentage}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                    </div>
                  </div>
                  <div className="mt-1">
                    <small>{warehouse.current_capacity} / {warehouse.capacity}</small>
                  </div>
                </td>
                <td>
                  <span className="d-flex align-items-center">
                    {getStatusIcon(warehouse.status)}
                    <span className="ms-2">{getStatusText(warehouse.status)}</span>
                  </span>
                </td>
                <td className="text-center">
                  <Button variant="warning" size="sm" className="me-2">Sửa</Button>
                  <Button variant="danger" size="sm">Xóa</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default Warehouse;