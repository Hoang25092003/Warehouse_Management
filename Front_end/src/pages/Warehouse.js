<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Col, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faCircle, faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Warehouse() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formWarehouse, setFormWarehouse] = useState({
    warehouse_id: "",
    name: "",
    location: "",
    capacity: "",
    status: "active"
  });


  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/warehouses`, {
        withCredentials: true,
      });
      setWarehouses(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
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

  const handleEdit = (warehouse) => {
    setEditingWarehouseId(warehouse.warehouse_id);
    setFormWarehouse({
      warehouse_id: warehouse.warehouse_id,
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      status: warehouse.status
    });
    setShowModal(true);
  };

  const handleDelete = async (warehouse) => {
    console.log(`Xóa kho hàng ID: ${warehouse.warehouse_id}`);
    if (window.confirm(`Bạn có chắc chắn muốn xóa kho hàng: ${warehouse.name}?`)) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/warehouses/${warehouse.warehouse_id}`, {
          withCredentials: true,
        });
        // Cập nhật lại danh sách kho hàng sau khi xóa
        setWarehouses((prev) => prev.filter(p => p.warehouse_id !== warehouse.warehouse_id));
        fetchWarehouses();
        toast.success("Đã xóa kho hàng thành công!");
      } catch (err) {
        console.error('❌ Chi tiết lỗi khi xóa kho hàng:', err);
        toast.error("Đã xảy ra lỗi khi xóa kho hàng!");
      }
    }
  };

  const handleSave = () => {
    if (editingWarehouseId) {
      handleSaveEdit(); // chỉnh sửa
    } else {
      handleAddWarehouse(); // thêm mới
    }
  };

  const handleAddWarehouse = async () => {
    try {
      const newWarehouse = { ...formWarehouse, current_capacity: 0 }; // Mặc định là 0
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/warehouses`, newWarehouse, {
        withCredentials: true,
      });
      setWarehouses(prev => [...prev, response.data]);
      handleClose();
      fetchWarehouses();
      toast.success("Đã thêm kho hàng thành công!");
    } catch (err) {
      toast.error("Lỗi khi thêm kho hàng mới!");
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedWarehouse = {
        warehouse_id: formWarehouse.warehouse_id,
        name: formWarehouse.name,
        location: formWarehouse.location,
        capacity: formWarehouse.capacity,
        status: formWarehouse.status
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/warehouses/${editingWarehouseId}`, updatedWarehouse,
        {
          withCredentials: true,
        }
      );

      setWarehouses((prevWarehouses) =>
        prevWarehouses.map((w) =>
          w.warehouse_id === editingWarehouseId ? { ...w, ...response.data } : w
        )
      );

      handleClose(); // Reset lại modal và form
      fetchWarehouses();
      toast.success("Đã cập nhật kho hàng thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật kho hàng:", err);
      toast.error("Đã xảy ra lỗi khi lưu chỉnh sửa.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingWarehouseId(null);
    setFormWarehouse({
      warehouse_id: "",
      name: "",
      location: "",
      capacity: "",
      status: "active"
    });
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
      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm kho hàng mới
        </Button>
        <Form className="mb-3 d-flex justify-content-end align-items-center">
          <Form.Group controlId="searchBar" className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm kho hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "700px" }}
            />
          </Form.Group>
        </Form>
        <Button variant="info" onClick={fetchWarehouses} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead className="table-dark text-center">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
              Tên Kho <FontAwesomeIcon icon={getSortIcon("name")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("location")}>
              Vị Trí <FontAwesomeIcon icon={getSortIcon("location")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("capacity")}>
              Sức Chứa <FontAwesomeIcon icon={getSortIcon("capacity")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("current_capacity")}>
              Tình Trạng Hiện Tại <FontAwesomeIcon icon={getSortIcon("current_capacity")} /></th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {warehouses
            .filter((warehouse) =>
              (warehouse?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => {
              if (!sortConfig.key) return 0;
              const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
              const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

              if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
              if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
              return 0;
            })
            .map((warehouse) => {
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
                    <Button
                      variant="warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(warehouse)}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(warehouse)}
                    >
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
          <Modal.Title>{editingWarehouseId ? "Chỉnh sửa kho hàng" : "Thêm kho hàng mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên kho</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formWarehouse.name}
                    onChange={(e) => setFormWarehouse({ ...formWarehouse, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sức chứa</Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formWarehouse.capacity}
                    onChange={(e) => setFormWarehouse({ ...formWarehouse, capacity: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Vị trí</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formWarehouse.location}
                onChange={(e) => setFormWarehouse({ ...formWarehouse, location: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formWarehouse.status}
                    onChange={(e) => setFormWarehouse({ ...formWarehouse, status: e.target.value })}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="closed">Đã đóng</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Hủy</Button>
          <Button variant="primary" onClick={handleSave}>
            {editingWarehouseId ? "Lưu chỉnh sửa" : "Thêm kho"}
          </Button>
        </Modal.Footer>
      </Modal>

    </div >
  );
}

=======
import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Col, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationCircle, faCircle, faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Warehouse() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formWarehouse, setFormWarehouse] = useState({
    warehouse_id: "",
    name: "",
    location: "",
    capacity: "",
    status: "active"
  });


  const fetchWarehouses = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/warehouses`, {
        withCredentials: true,
      });
      setWarehouses(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
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

  const handleEdit = (warehouse) => {
    setEditingWarehouseId(warehouse.warehouse_id);
    setFormWarehouse({
      warehouse_id: warehouse.warehouse_id,
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      status: warehouse.status
    });
    setShowModal(true);
  };

  const handleDelete = async (warehouse) => {
    console.log(`Xóa kho hàng ID: ${warehouse.warehouse_id}`);
    if (window.confirm(`Bạn có chắc chắn muốn xóa kho hàng: ${warehouse.name}?`)) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/warehouses/${warehouse.warehouse_id}`, {
          withCredentials: true,
        });
        // Cập nhật lại danh sách kho hàng sau khi xóa
        setWarehouses((prev) => prev.filter(p => p.warehouse_id !== warehouse.warehouse_id));
        fetchWarehouses();
        toast.success("Đã xóa kho hàng thành công!");
      } catch (err) {
        console.error('❌ Chi tiết lỗi khi xóa kho hàng:', err);
        toast.error("Đã xảy ra lỗi khi xóa kho hàng!");
      }
    }
  };

  const handleSave = () => {
    if (editingWarehouseId) {
      handleSaveEdit(); // chỉnh sửa
    } else {
      handleAddWarehouse(); // thêm mới
    }
  };

  const handleAddWarehouse = async () => {
    try {
      const newWarehouse = { ...formWarehouse, current_capacity: 0 }; // Mặc định là 0
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/warehouses`, newWarehouse, {
        withCredentials: true,
      });
      setWarehouses(prev => [...prev, response.data]);
      handleClose();
      fetchWarehouses();
      toast.success("Đã thêm kho hàng thành công!");
    } catch (err) {
      toast.error("Lỗi khi thêm kho hàng mới!");
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedWarehouse = {
        warehouse_id: formWarehouse.warehouse_id,
        name: formWarehouse.name,
        location: formWarehouse.location,
        capacity: formWarehouse.capacity,
        status: formWarehouse.status
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/warehouses/${editingWarehouseId}`, updatedWarehouse,
        {
          withCredentials: true,
        }
      );

      setWarehouses((prevWarehouses) =>
        prevWarehouses.map((w) =>
          w.warehouse_id === editingWarehouseId ? { ...w, ...response.data } : w
        )
      );

      handleClose(); // Reset lại modal và form
      fetchWarehouses();
      toast.success("Đã cập nhật kho hàng thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật kho hàng:", err);
      toast.error("Đã xảy ra lỗi khi lưu chỉnh sửa.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingWarehouseId(null);
    setFormWarehouse({
      warehouse_id: "",
      name: "",
      location: "",
      capacity: "",
      status: "active"
    });
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
      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm kho hàng mới
        </Button>
        <Form className="mb-3 d-flex justify-content-end align-items-center">
          <Form.Group controlId="searchBar" className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm kho hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "700px" }}
            />
          </Form.Group>
        </Form>
        <Button variant="info" onClick={fetchWarehouses} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead className="table-dark text-center">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
              Tên Kho <FontAwesomeIcon icon={getSortIcon("name")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("location")}>
              Vị Trí <FontAwesomeIcon icon={getSortIcon("location")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("capacity")}>
              Sức Chứa <FontAwesomeIcon icon={getSortIcon("capacity")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("current_capacity")}>
              Tình Trạng Hiện Tại <FontAwesomeIcon icon={getSortIcon("current_capacity")} /></th>
            <th>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {warehouses
            .filter((warehouse) =>
              (warehouse?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => {
              if (!sortConfig.key) return 0;
              const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
              const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

              if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
              if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
              return 0;
            })
            .map((warehouse) => {
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
                    <Button
                      variant="warning"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(warehouse)}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(warehouse)}
                    >
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
          <Modal.Title>{editingWarehouseId ? "Chỉnh sửa kho hàng" : "Thêm kho hàng mới"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên kho</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formWarehouse.name}
                    onChange={(e) => setFormWarehouse({ ...formWarehouse, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sức chứa</Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formWarehouse.capacity}
                    onChange={(e) => setFormWarehouse({ ...formWarehouse, capacity: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Vị trí</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formWarehouse.location}
                onChange={(e) => setFormWarehouse({ ...formWarehouse, location: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={formWarehouse.status}
                    onChange={(e) => setFormWarehouse({ ...formWarehouse, status: e.target.value })}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="closed">Đã đóng</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Hủy</Button>
          <Button variant="primary" onClick={handleSave}>
            {editingWarehouseId ? "Lưu chỉnh sửa" : "Thêm kho"}
          </Button>
        </Modal.Footer>
      </Modal>

    </div >
  );
}

>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
export default Warehouse;