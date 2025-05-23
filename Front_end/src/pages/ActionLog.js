import React, { useEffect, useState } from "react";
import { Table, Spinner, Form, Row, Col, Button, Modal } from "react-bootstrap";
import axios from "axios";
import { toast } from 'react-toastify';

function ActionLog() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionlog, setActionLog] = useState([]);
    const [Users, setUsers] = useState([]);
    const [filterActionType, setFilterActionType] = useState("");
    const [filterUser, setFilterUser] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);


    const fetchActionLog = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/actionLog`, {
                withCredentials: true,
            });
            setActionLog(response.data);
        } catch (err) {
            console.error("Lỗi khi lấy log:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/assign_users`, {
                withCredentials: true,
            });
            setUsers(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActionLog();
        fetchUsers();
    }, []);

    function formatDateTime(isoString) {
        const date = new Date(isoString);

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
    }

    const formatData = (data) => {
        if (!data) return null;
        let obj;
        try {
            obj = typeof data === "string" ? JSON.parse(data) : data;
        } catch (e) {
            return <div className="text-danger">Dữ liệu không hợp lệ</div>;
        }
        return (
            <Table striped bordered hover responsive size="sm">
                <thead className="table-dark">
                    <tr>
                        <th>Trường</th>
                        <th>Giá trị</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(obj).map(([key, value]) => (
                        <tr key={key}>
                            <td style={{ fontWeight: 500 }}>{key}</td>
                            <td>{String(value)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    const formatDescription = (description) => {
        if (!description) return null;

        const changes = description.split(";").filter(line => line.trim() !== "");

        return (
            <Table striped bordered hover responsive size="sm">
                <thead className="table-dark">
                    <tr>
                        <th>Tác động</th>
                        <th>Giá trị cũ</th>
                        <th>Giá trị mới</th>
                    </tr>
                </thead>
                <tbody>
                    {changes.map((line, index) => {
                        const match = line.match(/^(.+?): \[(.*?)\] ?→ ?\[(.*?)\]$/);
                        if (!match) return null;

                        const [, field, oldValue, newValue] = match;

                        return (
                            <tr key={index}>
                                <td>{field}</td>
                                <td>{oldValue}</td>
                                <td>{newValue}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        );
    };


    const handleViewDetailAction = (row) => {
        setSelectedLog(row);
        setShowModal(true);
    };

    const handleUndo = async (row) => { 
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/undo_action`, {
                log_id: row.log_id,
            }, {
                withCredentials: true,
            });

            if (response.data.success) {
                toast.success("Hoàn tác thành công!");
                fetchActionLog();
            } else {
                toast.warning("Hoàn tác thất bại!");
            }
        } catch (err) {
            console.error("Lỗi khi hoàn tác:", err);
            toast.error("Có lỗi xảy ra khi hoàn tác!");
        }
    };

    const handleSearch = async () => {
        try {
            const params = {};

            if (filterActionType) params.action_type = filterActionType;
            if (filterUser) params.user_id = filterUser;
            if (filterStartDate) params.start_date = filterStartDate;
            if (filterEndDate) params.end_date = filterEndDate;
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/search_actionLog`,
                {
                    params,
                    withCredentials: true,
                });

            setActionLog(response.data);
        } catch (err) {
            console.error("Lỗi khi tìm kiếm:", err);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "linear-gradient(120deg, #fdf2f8 0%, #f1f5f9 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                }}
            >
                <img
                    src="/img/barcode3.gif"
                    alt="Logo"
                    style={{ width: 120, marginBottom: 32 }}
                />
                <div style={{ fontSize: "1.5rem", color: "#e11d48", fontWeight: 700, marginBottom: 16 }}>
                    Đã xảy ra lỗi xác thực!
                </div>
                <div style={{ color: "#64748b", marginBottom: 18, fontSize: "1.1rem" }}>
                    Phiên đăng nhập của bạn đã hết hạn hoặc có lỗi kết nối.<br />
                    Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống.
                </div>
                <a
                    href="/login"
                    style={{
                        background: "#2563eb",
                        color: "#fff",
                        padding: "10px 28px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        textDecoration: "none",
                        fontSize: "1.1rem",
                        boxShadow: "0 2px 8px 0 #2563eb33"
                    }}
                >
                    Đăng nhập lại
                </a>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Lịch sử thao tác</h1>
            <div className="card">
                <div className="card-header">
                    <Form className="mb-3">
                        <Row className="mb-3">
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loại thao tác</Form.Label>
                                    <Form.Select onChange={(e) => setFilterActionType(e.target.value)} value={filterActionType}>
                                        <option value="">Tất cả</option>
                                        <option value="insert">Thêm dữ liệu</option>
                                        <option value="update">Cập nhật dữ liệu</option>
                                        <option value="delete">Xóa dữ liệu</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Người thao tác</Form.Label>
                                    <Form.Select onChange={(e) => setFilterUser(e.target.value)} value={filterUser}>
                                        <option value="">Tất cả</option>
                                        {Users.map((user) => (
                                            <option key={user.user_id} value={user.user_id}>
                                                {user.user_id} - {user.fullname}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Từ ngày</Form.Label>
                                    <Form.Control type="date" onChange={(e) => setFilterStartDate(e.target.value)} value={filterStartDate} />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Đến ngày</Form.Label>
                                    <Form.Control type="date" onChange={(e) => setFilterEndDate(e.target.value)} value={filterEndDate} />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>&nbsp;</Form.Label>
                                    <Button variant="primary" className="w-100" onClick={handleSearch}>
                                        Tìm kiếm
                                    </Button>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </div>
                <div className="card-body">
                    <Table striped bordered hover responsive>
                        <thead className="table-dark">
                            <tr>
                                <th>Thời gian</th>
                                <th>Người thực hiện  </th>
                                <th>Loại thao tác</th>
                                <th>Tóm tắt thac tác</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7">
                                        <div className="d-flex justify-content-center align-items-center" style={{ height: "150px" }}>
                                            <Spinner animation="border" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </Spinner>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                actionlog.map((row) => (
                                    <tr key={row.log_id}>
                                        <td>{formatDateTime(row.action_time)}</td>
                                        <td>Tài khoản: {row.username} <br />({row.fullname})</td>
                                        <td>{row.action_type === "INSERT" ? "Thêm " : row.action_type === "UPDATE" ? "Cập nhật " : "Xóa "}</td>
                                        <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', overflowX: 'auto', wordBreak: 'break-word' }}>
                                            {row.table_name} - ID: {row.record_id}

                                        </td>
                                        <td>
                                            <Button className="me-2 btn btn-primary" onClick={() => handleViewDetailAction(row)}>
                                                Chi tiết
                                            </Button>
                                            <Button className="m2-2 btn btn-info" onClick={() => handleUndo(row)}>
                                                Hoàn tác
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>

                    <Modal show={showModal} size="xl">
                        <Modal.Header>
                            <Modal.Title>Chi tiết thao tác</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Thời gian tác động</Form.Label>
                                            <Form.Control type="text" value={formatDateTime(selectedLog?.action_time)} readOnly />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Người thực hiện</Form.Label>
                                            <Form.Control type="text" value={`${selectedLog?.username} (${selectedLog?.fullname})`} readOnly />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Loại thao tác</Form.Label>
                                            <Form.Control type="text" value={selectedLog?.action_type === "INSERT" ? "Thêm " : selectedLog?.action_type === "UPDATE" ? "Cập nhật " : "Xóa "} readOnly />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Bảng tác động</Form.Label>
                                            <Form.Control type="text" value={selectedLog?.table_name} readOnly />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>ID bản ghi</Form.Label>
                                            <Form.Control type="text" value={selectedLog?.record_id} readOnly />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                {selectedLog?.action_type === "UPDATE" ? (
                                    <Row>
                                        <Col md={12}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Chi tiết thay đổi</Form.Label>
                                                {formatDescription(selectedLog?.description)}
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                ) : (
                                    selectedLog?.action_type === "INSERT" ? (
                                        <Row>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Dữ liệu mới</Form.Label>
                                                    {formatData(selectedLog?.new_data)}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <Row>
                                            <Col md={12}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Dữ liệu đã xóa</Form.Label>
                                                    {formatData(selectedLog?.old_data)}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    ))}
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                        </Modal.Footer>
                    </Modal>

                </div>
            </div>
        </div>
    );
}

export default ActionLog;