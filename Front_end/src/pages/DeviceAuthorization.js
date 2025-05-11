<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faUser } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function DevicesAuthorization() {
  const [DevicesAuthorization, setDevicesAuthorization] = useState([]);
  const [devices, setDevices] = useState([]);
  const [assignUsers, setAssignUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [newRow, setNewRow] = useState({
    device_id: "",
    user_id: ""
  });

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/devices`, {
        withCredentials: true,
      });
      setDevices(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevicesAuthorization = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/devicesAuth`, {
        withCredentials: true,
      });
      setDevicesAuthorization(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/assign_users`, {
        withCredentials: true,
      });
      setAssignUsers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDevicesAuthorization();
    fetchDevices();
    fetchAssignUsers();
  }, []);

  const handleEdit = (row) => {
    setEditRowId(row.DA_id);
    setEditedRow({ ...row });
  };

  const handleSave = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/devicesAuth/${editRowId}`, editedRow, {
        withCredentials: true
      });
      toast.success("Đã cập nhật thành công");
      setEditRowId(null);
      fetchDevicesAuthorization();
    } catch (err) {
      console.log("Lỗi khi cập nhật: ", err);
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/devicesAuth/${row.DA_id}`, {
        withCredentials: true
      });
      toast.success("Đã xóa thành công");
      fetchDevicesAuthorization();
    } catch (err) {
      toast.error("Lỗi khi xóa");
    }
  };

  const handleAdd = async () => {
    if (!newRow.device_id || !newRow.user_id) {
      toast.warn("Vui lòng chọn đầy đủ thông tin");
      return;
    }
    try {
      const isDevice_AuthExist = DevicesAuthorization.some(
        (d_a) => d_a.device_id === newRow.device_id
      );
      if (isDevice_AuthExist) {
        toast.warn("Thiết bị đang được sửa dụng vui lòng chọn thiết bị khác!");
        return;
      }
      await axios.post(`${process.env.REACT_APP_API_URL}/api/devicesAuth`, newRow, {
        withCredentials: true
      });
      toast.success("Đã thêm mới thành công");
      setNewRow({
        device_id: "",
        user_id: ""
      });
      fetchDevicesAuthorization();
    } catch (err) {
      toast.error("Lỗi khi thêm mới");
    }
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
      <h1 className="text-center mb-4">Phân quyền người dùng</h1>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Mã thiết bị</th>
            <th>Người được ủy quyền</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {DevicesAuthorization.map((row) => (
            <tr key={row.DA_id}>
              <td>
                <Form.Select
                  value={row.device_id}
                  onChange={(e) => setEditedRow({ ...editedRow, device_id: e.target.value })}
                  disabled={editRowId !== row.DA_id}
                >
                  <option value="">Chọn thiết bị</option>
                  {devices.map((device) => (
                    <option key={device.device_id} value={device.device_id}>{device.device_id} - {device.device_name}</option>
                  ))}
                </Form.Select>
              </td>
              <td>
                <Form.Select
                  value={row.assigned_userID}
                  onChange={(e) => setEditedRow({ ...editedRow, user_id: e.target.value })}
                  disabled={editRowId !== row.DA_id}
                >
                  <option value="">Chọn người dùng</option>
                  {assignUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>{user.user_id} - {user.fullname}</option>
                  ))}
                </Form.Select>
              </td>
              <td className="text-center">
                {editRowId === row.DA_id ? (
                  <>
                    <Button variant="success" size="sm" className="me-2" onClick={handleSave}>
                      <FontAwesomeIcon icon={faSave} /> Lưu
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditRowId(null)}>
                      <FontAwesomeIcon icon={faSave} /> Hủy
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(row)}>
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
                      <FontAwesomeIcon icon={faTrash} /> Xóa
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {/* Dòng thêm mới */}
          <tr>
            <td>
              <Form.Select
                value={newRow.device_id}
                onChange={(e) => setNewRow({ ...newRow, device_id: e.target.value })}
              >
                <option value="">Chọn thiết bị</option>
                {devices
                  .filter((device) => !DevicesAuthorization.some((d_a) => d_a.device_id === device.device_id))
                  .map((device) => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.device_id} - {device.device_name}
                    </option>
                  ))}

              </Form.Select>
            </td>
            <td>
              <Form.Select
                value={newRow.user_id}
                onChange={(e) => setNewRow({ ...newRow, user_id: e.target.value })}
              >
                <option value="">Chọn người dùng</option>
                {assignUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>{user.user_id} - {user.fullname}</option>
                ))}
              </Form.Select>
            </td>
            <td className="text-center">
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <FontAwesomeIcon icon={faUser} /> Phân quyền
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default DevicesAuthorization;
=======
import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faUser } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function DevicesAuthorization() {
  const [DevicesAuthorization, setDevicesAuthorization] = useState([]);
  const [devices, setDevices] = useState([]);
  const [assignUsers, setAssignUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [newRow, setNewRow] = useState({
    device_id: "",
    user_id: ""
  });

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/devices`, {
        withCredentials: true,
      });
      setDevices(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevicesAuthorization = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/devicesAuth`, {
        withCredentials: true,
      });
      setDevicesAuthorization(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/assign_users`, {
        withCredentials: true,
      });
      setAssignUsers(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDevicesAuthorization();
    fetchDevices();
    fetchAssignUsers();
  }, []);

  const handleEdit = (row) => {
    setEditRowId(row.DA_id);
    setEditedRow({ ...row });
  };

  const handleSave = async () => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/devicesAuth/${editRowId}`, editedRow, {
        withCredentials: true
      });
      toast.success("Đã cập nhật thành công");
      setEditRowId(null);
      fetchDevicesAuthorization();
    } catch (err) {
      console.log("Lỗi khi cập nhật: ", err);
      toast.error("Lỗi khi cập nhật");
    }
  };

  const handleDelete = async (row) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/devicesAuth/${row.DA_id}`, {
        withCredentials: true
      });
      toast.success("Đã xóa thành công");
      fetchDevicesAuthorization();
    } catch (err) {
      toast.error("Lỗi khi xóa");
    }
  };

  const handleAdd = async () => {
    if (!newRow.device_id || !newRow.user_id) {
      toast.warn("Vui lòng chọn đầy đủ thông tin");
      return;
    }
    try {
      const isDevice_AuthExist = DevicesAuthorization.some(
        (d_a) => d_a.device_id === newRow.device_id
      );
      if (isDevice_AuthExist) {
        toast.warn("Thiết bị đang được sửa dụng vui lòng chọn thiết bị khác!");
        return;
      }
      await axios.post("${process.env.REACT_APP_API_URL}/api/devicesAuth", newRow, {
        withCredentials: true
      });
      toast.success("Đã thêm mới thành công");
      setNewRow({
        device_id: "",
        user_id: ""
      });
      fetchDevicesAuthorization();
    } catch (err) {
      toast.error("Lỗi khi thêm mới");
    }
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
      <h1 className="text-center mb-4">Phân quyền người dùng</h1>

      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Mã thiết bị</th>
            <th>Người được ủy quyền</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {DevicesAuthorization.map((row) => (
            <tr key={row.DA_id}>
              <td>
                <Form.Select
                  value={row.device_id}
                  onChange={(e) => setEditedRow({ ...editedRow, device_id: e.target.value })}
                  disabled={editRowId !== row.DA_id}
                >
                  <option value="">Chọn thiết bị</option>
                  {devices.map((device) => (
                    <option key={device.device_id} value={device.device_id}>{device.device_id} - {device.device_name}</option>
                  ))}
                </Form.Select>
              </td>
              <td>
                <Form.Select
                  value={row.assigned_userID}
                  onChange={(e) => setEditedRow({ ...editedRow, user_id: e.target.value })}
                  disabled={editRowId !== row.DA_id}
                >
                  <option value="">Chọn người dùng</option>
                  {assignUsers.map((user) => (
                    <option key={user.user_id} value={user.user_id}>{user.user_id} - {user.fullname}</option>
                  ))}
                </Form.Select>
              </td>
              <td className="text-center">
                {editRowId === row.DA_id ? (
                  <>
                    <Button variant="success" size="sm" className="me-2" onClick={handleSave}>
                      <FontAwesomeIcon icon={faSave} /> Lưu
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditRowId(null)}>
                      <FontAwesomeIcon icon={faSave} /> Hủy
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(row)}>
                      <FontAwesomeIcon icon={faEdit} /> Sửa
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(row)}>
                      <FontAwesomeIcon icon={faTrash} /> Xóa
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {/* Dòng thêm mới */}
          <tr>
            <td>
              <Form.Select
                value={newRow.device_id}
                onChange={(e) => setNewRow({ ...newRow, device_id: e.target.value })}
              >
                <option value="">Chọn thiết bị</option>
                {devices
                  .filter((device) => !DevicesAuthorization.some((d_a) => d_a.device_id === device.device_id))
                  .map((device) => (
                    <option key={device.device_id} value={device.device_id}>
                      {device.device_id} - {device.device_name}
                    </option>
                  ))}

              </Form.Select>
            </td>
            <td>
              <Form.Select
                value={newRow.user_id}
                onChange={(e) => setNewRow({ ...newRow, user_id: e.target.value })}
              >
                <option value="">Chọn người dùng</option>
                {assignUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>{user.user_id} - {user.fullname}</option>
                ))}
              </Form.Select>
            </td>
            <td className="text-center">
              <Button variant="primary" size="sm" onClick={handleAdd}>
                <FontAwesomeIcon icon={faUser} /> Phân quyền
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
}

export default DevicesAuthorization;
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
