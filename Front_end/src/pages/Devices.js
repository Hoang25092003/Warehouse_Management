import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Col, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Devices() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formDevice, setFormDevice] = useState({
    device_id: "",
    device_name: "",
    device_type: "",
    device_description: "",
  });

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/devices`, {
        withCredentials: true,
      });
      console.log("Dữ liệu từ API:", response.data.device);
      setDevices(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDevices();
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

  const handleEdit = (device) => {
    setEditingDeviceId(device.device_id);
    setFormDevice({
      device_id: device.device_id,
      device_name: device.device_name,
      device_type: device.device_type,
      device_description: device.device_description,
    });
    setShowModal(true);
  };

  const handleDelete = async (device) => {
    console.log(`Xóa device ID: ${device.device_id}`);
    if (window.confirm(`Bạn có chắc chắn muốn xóa thiết bị: ${device.device_id}?`)) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/devices/${device.device_id}`, {
          withCredentials: true,
        });
        // Cập nhật lại danh sách thiết bị sau khi xóa
        setDevices((prev) => prev.filter(d => d.device_id !== device.device_id));
        fetchDevices();
        toast.success("Đã xóa thiết bị thành công!");
      } catch (err) {
        console.error('Chi tiết lỗi khi xóa thiết bị:', err);
        toast.error("Đã xảy ra lỗi khi xóa thiết bị!");
      }
    }
  };

  const handleSave = () => {
    if (editingDeviceId) {
      handleSaveEdit(); // chỉnh sửa
    } else {
      handleAddDevice(); // thêm mới
    }
  };

  const handleAddDevice = async () => {
    try {
      const newDevice = { ...formDevice };
      const newDeviceId = newDevice.device_id;
      const isDeviceExist = devices.some(
        (d) => d.device_id === newDeviceId
      );

      if(isDeviceExist){
        toast.warn("Mã thiết bị đã tồn tại!");
        return;
      }
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/devices`, newDevice, {
        withCredentials: true,
      });
      setDevices(prev => [...prev, response.data]);
      handleClose();
      fetchDevices();
      toast.success("Đã thêm thiết bị thành công!");
    } catch (err) {
      toast.error("Lỗi khi thêm thiết bị mới!");
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedDevice = {
        device_id: formDevice.device_id,
        device_name: formDevice.device_name,
        device_type: formDevice.device_type,
        device_description: formDevice.device_description,
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/devices/${editingDeviceId}`, updatedDevice,
        {
          withCredentials: true,
        }
      );

      setDevices((prevDevice) =>
        prevDevice.map((d) =>
          d.device_id === editingDeviceId ? { ...d, ...response.data } : d
        )
      );

      handleClose(); // Reset lại modal và form
      fetchDevices();
      toast.success("Đã cập nhật thiết bị thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật thiết bị:", err);
      toast.error("Đã xảy ra lỗi khi lưu chỉnh sửa.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingDeviceId(null);
    setFormDevice({
      device_id: "",
      device_name: "",
      device_type: "",
      device_description: "",
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
          Lỗi khi tải thiết bị: {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Quản Lý thiết bị</h1>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm thiết bị
        </Button>
        <Form className="mb-3 d-flex justify-content-end align-items-center">
          <Form.Group controlId="searchBar" className="d-flex align-items-center">
            <Form.Control
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "700px" }}
            />
          </Form.Group>
        </Form>
        <Button variant="info" onClick={fetchDevices} disabled={loading}>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("device_id")}>
              Mã thiết bị <FontAwesomeIcon icon={getSortIcon("device_id")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("device_name")}>
              Tên thiết bị <FontAwesomeIcon icon={getSortIcon("device_name")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("device_type")}>
              Loại <FontAwesomeIcon icon={getSortIcon("device_type")} /></th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("device_description")}>
              Mô tả <FontAwesomeIcon icon={getSortIcon("device_description")} /></th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {devices
            .filter((device) =>
              (device?.device_name || '').toLowerCase().includes(searchTerm.toLowerCase())
            ).sort((a, b) => {
              if (!sortConfig.key) return 0;
              const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
              const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

              if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
              if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
              return 0;
            })
            .map((device, index) => {
              return (
                <tr key={device.device_id}>
                  <td>{device.device_id}</td>
                  <td>{device.device_name}</td>
                  <td>{device.device_type === 'import' ? "Máy nhập" : device.device_type === 'export' ? "Máy xuất" : "Máy kiểm"}</td>
                  <td>{device.device_description}</td>
                  <td className="text-center">
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(device)}>
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(device)}>
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
          <Modal.Title>{editingDeviceId ? "Sửa thông tin thiết bị" : "Thêm thiết bị"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã thiết bị</Form.Label>
                  <Form.Control
                    type="text"
                    name="device_id"
                    value={formDevice.device_id}
                    onChange={(e) => setFormDevice({ ...formDevice, device_id: e.target.value })}
                    required
                    readOnly={editingDeviceId ? true : false}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên thiết bị</Form.Label>
                  <Form.Control
                    type="text"
                    name="device_name"
                    value={formDevice.device_name}
                    onChange={(e) => setFormDevice({ ...formDevice, device_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại thiết bị</Form.Label>
                  <Form.Select
                    value={formDevice?.device_type || ""}
                    onChange={(e) => setFormDevice({ ...formDevice, device_type: e.target.value })}
                  >
                    <option value="">Chọn loại thiết bị</option>
                    <option key="1" value="import"> Máy nhập</option>
                    <option key="2" value="export"> Máy xuất</option>
                    <option key="3" value="check"> Máy kiểm</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Mo tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Mô tả thiết bị..."
                    className="mb-3"
                    value={formDevice?.device_description || ""}
                    onChange={(e) => setFormDevice({ ...formDevice, device_description: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleSave}>
            {editingDeviceId ? "Lưu thay đổi" : "Thêm mới"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Devices;
