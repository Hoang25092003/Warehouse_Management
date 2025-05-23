import { useEffect, useState } from "react";
import { Button, Table, Form, Row, Col, Spinner, Card, Tab, Tabs } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faSave, faUpload, faWindowRestore, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Backup() {
    const [loading, setLoading] = useState(true);
    const [backupAuto, setBackupAuto] = useState(false);
    const [interval, setInterval] = useState("hour");
    const [backupDestination, setBackupDestination] = useState("driver");
    const [restoreFileDestination, setRestoreFileDestination] = useState("local");
    const [restoreLocalFile, setRestoreLocalFile] = useState(null);
    const [restoreGoogleDriveFile, setRestoreGoogleDriveFile] = useState(null);
    const [googleDriveFileName, setGoogleDriveFileName] = useState("");
    const navigate = useNavigate();
    const [backupHistory, setBackupHistory] = useState([]);

    useEffect(() => {
        const fetchlistBackup = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/list_backup`,{
                    withCredentials: true,
                });
                if (response.status === 200) {
                    const data = response.data;
                    setBackupHistory(data);
                }
            } catch (error) {
                console.error("Error fetching backup history:", error);
                toast.error("Có lỗi xảy ra khi tải lịch sử sao lưu.");
            } finally {
                setLoading(false);
            }
        }
        fetchlistBackup();

        if (backupAuto && backupDestination === "local") {
            setBackupDestination("driver");
        }
    }, []);

    // Lưu cài đặt sao lưu tự động
    const handleSaveBackupSettings = async () => {
        toast.info(
            <div style={{ textAlign: "center", lineHeight: 1.5 }}>
                <p style={{ fontWeight: 600, fontSize: "1.15rem", color: "#0a58ca", marginBottom: 4 }}>
                    🚧 Chức năng đang được phát triển!
                </p>
                <p style={{ marginBottom: 2 }}>Vui lòng thử lại sau.</p>
                <p style={{ fontStyle: "italic", color: "#555" }}>Xin cảm ơn!</p>
            </div>,
            {
                position: "top-center",
                autoClose: 2500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                style: {
                    fontSize: "1.08rem",
                    background: "linear-gradient(135deg, #e3f0ff 0%, #b6e0fe 100%)",
                    color: "#1a237e",
                    border: "1.5px solid #90caf9",
                    boxShadow: "0 2px 12px rgba(33,150,243,0.08)"
                }
            }
        );
        return;
        try {
            const response = await axios.post("/api/auto_backup", {
                auto: backupAuto,
                interval: interval,
                destination: backupDestination,
            });
            if (response.status === 200) {
                toast.success("Cài đặt sao lưu tự động đã được lưu thành công!");
            }
        } catch (error) {
            console.error("Error saving backup settings:", error);
            toast.error("Có lỗi xảy ra khi lưu cài đặt sao lưu tự động.");
        }
    };
    // Tải về file backup về máy
    const handleBackupToLocal = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/backup`,{
                withCredentials: true,
            }, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "backup.json");
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Tải file backup thành công!");
        } catch (error) {
            console.error("Error downloading backup:", error);
            toast.error("Có lỗi xảy ra khi tải file backup.");
        }
    };


    // Tải lên file backup Google Drive
    const handleBackupToGoogleDrive = async () => {
        toast.info(
            <div style={{ textAlign: "center", lineHeight: 1.5 }}>
                <p style={{ fontWeight: 600, fontSize: "1.15rem", color: "#0a58ca", marginBottom: 4 }}>
                    🚧 Chức năng đang được phát triển!
                </p>
                <p style={{ marginBottom: 2 }}>Vui lòng thử lại sau.</p>
                <p style={{ fontStyle: "italic", color: "#555" }}>Xin cảm ơn!</p>
            </div>,
            {
                position: "top-center",
                autoClose: 2500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                style: {
                    fontSize: "1.08rem",
                    background: "linear-gradient(135deg, #e3f0ff 0%, #b6e0fe 100%)",
                    color: "#1a237e",
                    border: "1.5px solid #90caf9",
                    boxShadow: "0 2px 12px rgba(33,150,243,0.08)"
                }
            }
        );
        return;
        try {
            const response = await axios.post("/api/backup_to_drive");
            if (response.status === 200) {
                toast.success("Sao lưu lên Google Drive thành công!");
            }
        } catch (error) {
            console.error("Error uploading backup to Google Drive:", error);
            toast.error("Có lỗi xảy ra khi sao lưu lên Google Drive.");
        }
    };

    // Hàm chọn file từ Google Drive 
    const handlePickFromGoogleDrive = () => {
        toast.info(
            <div style={{ textAlign: "center", lineHeight: 1.5 }}>
                <p style={{ fontWeight: 600, fontSize: "1.15rem", color: "#0a58ca", marginBottom: 4 }}>
                    🚧 Chức năng đang được phát triển!
                </p>
                <p style={{ marginBottom: 2 }}>Vui lòng thử lại sau.</p>
                <p style={{ fontStyle: "italic", color: "#555" }}>Xin cảm ơn!</p>
            </div>,
            {
                position: "top-center",
                autoClose: 2500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false,
                draggable: true,
                progress: undefined,
                style: {
                    fontSize: "1.08rem",
                    background: "linear-gradient(135deg, #e3f0ff 0%, #b6e0fe 100%)",
                    color: "#1a237e",
                    border: "1.5px solid #90caf9",
                    boxShadow: "0 2px 12px rgba(33,150,243,0.08)"
                }
            }
        );
        return;
        const fileName = prompt("Nhập tên file Google Drive muốn khôi phục:");
        if (fileName) setGoogleDriveFileName(fileName);
    };

    // Hàm khôi phục dữ liệu từ file backup
    const handleRestore = async () => {
        if (restoreFileDestination === "local" && restoreLocalFile) {
            const formData = new FormData();
            formData.append("backupFile", restoreLocalFile);
            try {
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/restore_backup`, formData, {
                    withCredentials: true,
                });
                if (response.status === 200) {
                    toast.success("Khôi phục dữ liệu thành công!");
                }
            } catch (error) {
                toast.error("Có lỗi xảy ra khi khôi phục dữ liệu.");
            }
        } else if (restoreFileDestination === "local" && !restoreLocalFile) {
            toast.warning("Vui lòng chọn file backup để khôi phục.");
            return;
        }
        else if (restoreFileDestination === "driver") {
            toast.info(
                <div style={{ textAlign: "center", lineHeight: 1.5 }}>
                    <p style={{ fontWeight: 600, fontSize: "1.15rem", color: "#0a58ca", marginBottom: 4 }}>
                        🚧 Chức năng đang được phát triển!
                    </p>
                    <p style={{ marginBottom: 2 }}>Vui lòng thử lại sau.</p>
                    <p style={{ fontStyle: "italic", color: "#555" }}>Xin cảm ơn!</p>
                </div>,
                {
                    position: "top-center",
                    autoClose: 2500,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false,
                    draggable: true,
                    progress: undefined,
                    style: {
                        fontSize: "1.08rem",
                        background: "linear-gradient(135deg, #e3f0ff 0%, #b6e0fe 100%)",
                        color: "#1a237e",
                        border: "1.5px solid #90caf9",
                        boxShadow: "0 2px 12px rgba(33,150,243,0.08)"
                    }
                }
            );
            return;
            try {
                const response = await axios.post("/api/restore_from_drive", { fileName: googleDriveFileName });
                if (response.status === 200) {
                    toast.success("Khôi phục từ Google Drive thành công!");
                }
            } catch (error) {
                toast.error("Có lỗi xảy ra khi khôi phục từ Google Drive.");
            }
        }
    }

    return (
        <div className="container mt-4">
            <Card>
                <Card.Body>
                    <h2 className="text-center">Quản lý sao lưu & khôi phục dữ liệu</h2>
                    <Tabs defaultActiveKey="backup" id="backup-tabs" className="mb-3">
                        <Tab eventKey="backup" title="🔄 Sao lưu dữ liệu">
                            <Form>
                                <Row className="mb-3">
                                    <Col md={3}>
                                        <Form.Label>Sao lưu dữ liệu</Form.Label>
                                        <Form.Check
                                            type="switch"
                                            value={backupAuto}
                                            onChange={(e) => setBackupAuto(e.target.checked)}
                                            label={backupAuto ? "Tự động" : "Thủ công"}
                                        />
                                    </Col>
                                    <Col md={3}>
                                        <Form.Label>Đích sao lưu</Form.Label>
                                        <Form.Select onChange={(e) => setBackupDestination(e.target.value)} value={backupDestination}>
                                            <option value="driver">Google Drive</option>
                                            {!backupAuto && <option value="local">Thiết bị</option>}
                                        </Form.Select>
                                    </Col>
                                    {backupAuto && (
                                        <Col md={6}>
                                            <Form.Label>Chu kỳ sao lưu</Form.Label>
                                            <Form.Select onChange={(e) => setInterval(e.target.value)} value={interval}>
                                                <option value="hour">12 tiếng</option>
                                                <option value="day">24 tiếng</option>
                                                <option value="week">1 tuần</option>
                                                <option value="month">1 tháng</option>
                                            </Form.Select>
                                        </Col>
                                    )}
                                </Row>
                                <div className="d-flex justify-content-end mt-4">
                                    {backupAuto ? (
                                        <Button variant="primary" onClick={() => handleSaveBackupSettings()}>
                                            <FontAwesomeIcon icon={faSave} className="me-2" />
                                            Lưu cài đặt
                                        </Button>
                                    ) : backupDestination === "local" ? (
                                        <Button variant="primary" onClick={() => handleBackupToLocal()}>
                                            <FontAwesomeIcon icon={faDownload} className="me-2" />
                                            Tải về
                                        </Button>
                                    ) : (
                                        <Button variant="primary" onClick={() => handleBackupToGoogleDrive()}>
                                            <FontAwesomeIcon icon={faUpload} className="me-2" />
                                            Tải lên
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </Tab>

                        <Tab eventKey="restore" title="💾 Khôi phục dữ liệu">
                            <Form>
                                <Form.Group className="mb-3">
                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Form.Label>Chọn file backup từ thiết bị:</Form.Label><br />
                                            <Form.Select onChange={(e) => setRestoreFileDestination(e.target.value)} value={restoreFileDestination}>
                                                <option value="local">Thiết bị</option>
                                                <option value="driver">Google Drive</option>
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                    <Row className="mb-3">
                                        {restoreFileDestination === "local" ? (
                                            <Col md={6}>
                                                <Form.Control
                                                    type="file"
                                                    accept=".json, .sql, .bak, csv"
                                                    onChange={(e) => setRestoreLocalFile(e.target.files[0])}
                                                />
                                            </Col>
                                        ) : (
                                            <Col md={6}>
                                                <div className="d-flex align-items-center">
                                                    <Button
                                                        variant="secondary"
                                                        className="me-2"
                                                        onClick={handlePickFromGoogleDrive}
                                                    >
                                                        <FontAwesomeIcon icon={faGlobe} className="me-2" />
                                                        Chọn file từ Google Drive
                                                    </Button>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Tên file Google Drive đã chọn"
                                                        value={googleDriveFileName}
                                                        readOnly
                                                        style={{ background: "#f8f9fa", fontWeight: 500, width: "300px" }}
                                                    />
                                                </div>
                                            </Col>
                                        )}
                                        <Col md={3}>
                                            <Button variant="primary" onClick={() => handleRestore()}>
                                                <FontAwesomeIcon icon={faWindowRestore} className="me-2" />
                                                Khôi phục
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form.Group>
                            </Form>
                        </Tab>

                        <Tab eventKey="history" title="🗂️ Lịch sử backup">
                            {loading ? (
                                <Spinner animation="border" />
                            ) : (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Tên file</th>
                                            <th>Thời gian backup</th>
                                            <th>Đích sao lưu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {backupHistory.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.fileName}</td>
                                                <td>{new Date(item.timestamp).toLocaleString()}</td>
                                                <td>{item.destination}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </div>
    );
}

export default Backup;
