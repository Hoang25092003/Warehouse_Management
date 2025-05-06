import React, { useState, useEffect } from "react";
import { Table, Button, Form, Row, Col, Spinner, Alert, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import axios from "axios";

function CreateReport() {
  const [user, setUser] = useState(null);
  const [reportType, setReportType] = useState("");
  const [DetailReportType, setDetailReportType] = useState("");
  const [reportData, setReportData] = useState(null);
  const [ImportReportData, setImportReportData] = useState([]);
  const [ExportReportData, setExportReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
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
      }finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const generateReport = async () => {
    if (!reportType) {
      setError("Vui lòng chọn loại báo cáo");
      return;
    }

    setShowReport(false);
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let endpoint = '';
      switch (reportType) {
        case 'import':
          endpoint = `${process.env.REACT_APP_API_URL}/api/reports/imports`;
          break;
        case 'export':
          endpoint = `${process.env.REACT_APP_API_URL}/api/reports/exports`;
          break;
        case 'inventory':
          endpoint = `${process.env.REACT_APP_API_URL}/api/reports/inventory`;
          break;
        default:
          throw new Error("Loại báo cáo không hợp lệ");
      }

      const response = await axios.get(endpoint, {
        withCredentials: true,
      });

      console.log("Dữ liệu báo cáo: ", response.data)
      setReportData(response.data);
      setShowReport(true);
      setIsGenerated(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (report_id, reportType) => {
    console.log("ID báo cáo chọn xem chi tiết: ", report_id);
    console.log("Loại báo cáo chọn xem chi tiết: ", reportType);
    if (reportType === 'import') {
      // setImportReportData(null);
      try {
        const importReportResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/import_detail/${report_id}`,
          {
            withCredentials: true,
          }
        );
        console.log("Dữ liệu chi tiết nhập hàng: ", importReportResponse.data)
        setImportReportData(importReportResponse.data);
        console.log("Dữ liệu chi tiết nhập hàng: ", ImportReportData);
      } catch (err) {
        console.log("Lỗi khi lấy chi tiết nhập hàng: ", err);
      }
    } else {
      // setExportReportData(null);
      try {
        const exportReportResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/export_detail/${report_id}`,
          {
            withCredentials: true,
          }
        );
        console.log("Dữ liệu chi tiết xuất hàng: ", exportReportResponse.data)
        setExportReportData(exportReportResponse.data);
      } catch (err) {
        console.log("Lỗi khi lấy chi tiết xuất hàng: ", err);
      }
    }
    setDetailReportType(reportType);
    setShowModal(true);
  };

  const exportToExcel = async () => {

    const now = new Date();
    let contentReportType = ""
    switch (reportType) {
      case 'import':
        contentReportType = "nhập kho";
        break;
      case 'export':
        contentReportType = "xuất kho";
        break;
      case 'inventory':
        contentReportType = "tồn kho";
        break;
      default:
        throw new Error("Loại báo cáo không hợp lệ");
    }
    const reportContent = `Báo cáo ${contentReportType} tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

    await axios.post(`${process.env.REACT_APP_API_URL}/api/reports`, {
      report_type: reportType,
      user_id: user.user_id,
      content: reportContent
    }, {
      withCredentials: true,
    });

    if (!reportData) return;

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");
    let fileName = `${reportContent}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderReportTable = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'import':
        return (
          <Table striped bordered hover responsive className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>Ngày thực hiện</th>
                <th>Người thực hiện</th>
                <th>Nhà kho</th>
                <th>Số lượng sản phẩm</th>
                <th>Tổng giá trị</th>
                <th>Ghi chú</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.import_id}>
                  <td>{new Date(item.import_date).toLocaleDateString('vi-VN')}</td>
                  <td>{item.fullname}</td>
                  <td>{item.warehouse_name}</td>
                  <td>{item.total_quantity}</td>
                  <td>{item.total_value.toLocaleString()}</td>
                  <td>{item.notes || 'N/A'}</td>
                  <td>
                    <Button
                      variant="success"
                      onClick={(e) => viewDetail(item.import_id, reportType)}
                    >
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );

      case 'export':
        return (
          <Table striped bordered hover responsive className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>Ngày thực hiện</th>
                <th>Người thực hiện</th>
                <th>Nhà kho</th>
                <th>Số lượng sản phẩm</th>
                <th>Tổng giá trị</th>
                <th>Khách hàng</th>
                <th>Ghi chú</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.export_id}>
                  <td>{new Date(item.export_date).toLocaleDateString('vi-VN')}</td>
                  <td>{item.fullname}</td>
                  <td>{item.warehouse_name}</td>
                  <td>{item.total_quantity}</td>
                  <td>{item.total_value.toLocaleString()}</td>
                  <td>{item.customer_info}</td>
                  <td>{item.notes || 'N/A'}</td>
                  <td>
                    <Button
                      variant="success"
                      onClick={(e) => viewDetail(item.export_id, reportType)}
                    >
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        );

      case 'inventory':
        return (
          <Table striped bordered hover responsive className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>Sản phẩm</th><th>Danh mục</th><th>Kho</th><th>Số lượng tồn</th>
                <th>Đơn giá</th><th>Tổng giá trị</th><th>HSD còn lại</th>
              </tr>
            </thead>
            <tbody>
              {reportData?.map((item) => {
                const expirationDate = new Date(item.expiration_date);
                const today = new Date();
                const diffDays = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
                return (
                  <tr key={`${item.product_id}_${item.warehouse_id}`}>
                    <td>{item.product_name}</td>
                    <td>{item.category_name}</td>
                    <td>{item.warehouse_name}</td>
                    <td>{item.stock_quantity}</td>
                    <td>{item.unit_price.toLocaleString()}</td>
                    <td>{(item.unit_price * item.stock_quantity).toLocaleString()}</td>
                    <td className={diffDays < 30 ? 'text-danger' : ''}>
                      {diffDays > 0 ? `${diffDays} ngày` : 'Đã hết hạn'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        );
      default:
        return null;
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const ExportDeTalReport = async () => {
    if (DetailReportType === 'import') {
      if (!ImportReportData) return;

      const worksheet = XLSX.utils.json_to_sheet(ImportReportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo chi tiết nhập hàng");
      let fileName = `CTNH-${ImportReportData[0].import_id}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else if (DetailReportType === 'export') {
      if (!ExportReportData) return;

      const worksheet = XLSX.utils.json_to_sheet(ExportReportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo chi tiết xuất hàng");
      let fileName = `CTXH-${ExportReportData[0].export_id}.xlsx`;
      XLSX.writeFile(workbook, fileName);
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

  return (
    <>
      <div className="container mt-4">
        <div className="text-center mb-4">
          <h1>Tạo báo cáo mới</h1>
        </div>
        <div className="card mb-4">
          <div className="card-body">
            {error && <Alert variant="danger">{error}</Alert>}
            <Row>
              <Col md={4}>
                <Form.Group controlId="reportType">
                  <Form.Label>Loại báo cáo</Form.Label>
                  <Form.Control
                    as="select"
                    value={reportType}
                    onChange={(e) => {
                      setReportType(e.target.value);
                      setShowReport(false);
                      setIsGenerated(false);
                    }}
                  >
                    <option value="">-- Chọn loại --</option>
                    <option value="import">Báo cáo nhập hàng</option>
                    <option value="export">Báo cáo xuất hàng</option>
                    <option value="inventory">Báo cáo tồn kho</option>
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button variant="primary" onClick={generateReport} disabled={isGenerated || !reportType}>
                  {loading ? <><Spinner animation="border" size="sm" /> Đang tạo...</> : 'Tạo báo cáo'}
                </Button>
              </Col>
            </Row>
          </div>
        </div>

        <Modal show={showModal} onHide={handleClose} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{DetailReportType === 'import' ? "Thông tin chi tiết nhập hàng" : "Thông tin chi tiết xuất hàng"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Người thực hiện</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        DetailReportType === 'import' ?
                          ImportReportData[0]?.user_fullname || "Không có tên"
                          :
                          ExportReportData[0]?.user_fullname || "Không có tên"
                      }
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngày thực hiện</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        DetailReportType === 'import' ?
                          ImportReportData[0]?.import_date || "Không có ngày"
                          :
                          ExportReportData[0]?.export_date || "Không có ngày"
                      }
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vị trí</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        DetailReportType === 'import' ?
                          ImportReportData[0]?.warehouse_name || "Không có kho"
                          :
                          ExportReportData[0]?.warehouse_name || "Không có kho"
                      }
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng sản phẩm</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        DetailReportType === 'import' ?
                          ImportReportData[0]?.total_quantity_import || "0"
                          :
                          ExportReportData[0]?.total_quantity_export || "0"
                      }
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tổng giá trị</Form.Label>
                    <Form.Control
                      type="text"
                      value={
                        DetailReportType === 'import' ?
                          ImportReportData[0]?.total_value_import || "0"
                          :
                          ExportReportData[0]?.total_value_export || "0"
                      }
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Form.Group className="mb-3">
                  <Form.Label>Chi tiết sản phẩm</Form.Label>
                  <div className="container mt-4" style={{ maxHeight: "200px", overflowY: "auto", paddingRight: "10px" }}>
                    <Table striped bordered hover responsive>
                      <thead className="table-dark text-center">
                        <tr>
                          <th>Mã vạch</th>
                          <th>Tên sản phẩm</th>
                          <th>Danh mục</th>
                          <th>Nhà cung cấp</th>
                          <th>Ngày sản xuất</th>
                          <th>Ngày hết hạn</th>
                          <th>Số lượng</th>
                          <th>Đơn giá</th>
                          <th>Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {
                          DetailReportType === 'import' && ImportReportData ?
                            ImportReportData?.map((content) => {
                              return (
                                <tr key={content.import_detail_id}>
                                  <td>{content.barcode}</td>
                                  <td>{content.product_name}</td>
                                  <td>{content.product_category}</td>
                                  <td>{content.supplier_name}</td>
                                  <td>{new Date(content.production_date).toLocaleDateString("vi-VN")}</td>
                                  <td>{new Date(content.expiration_date).toLocaleDateString("vi-VN")}</td>
                                  <td>{content.product_quantity}</td>
                                  <td>{content.product_unit_price}</td>
                                  <td>{content.total_value_import_detail}</td>
                                </tr>
                              );
                            })
                            : DetailReportType === 'export' && ExportReportData ?
                            ExportReportData.map((content) => {
                                return (
                                  <tr key={content.export_detail_id}>
                                    <td>{content.barcode}</td>
                                    <td>{content.product_name}</td>
                                    <td>{content.product_category}</td>
                                    <td>{content.supplier_name}</td>
                                    <td>{new Date(content.production_date).toLocaleDateString("vi-VN")}</td>
                                    <td>{new Date(content.expiration_date).toLocaleDateString("vi-VN")}</td>
                                    <td>{content.product_quantity}</td>
                                    <td>{content.product_unit_price}</td>
                                    <td>{content.total_value_export_detail}</td>
                                  </tr>
                                );
                              })
                              : <Alert>Nothing</Alert>
                        }
                      </tbody>
                    </Table>
                  </div>
                </Form.Group>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Đóng</Button>
            <Button variant="success" onClick={ExportDeTalReport}>
              <FontAwesomeIcon icon={faFileExcel} className="me-2" />
              Xuất Excel {DetailReportType === 'import' ? "chi tiết nhập hàng" : "chi tiết xuất hàng"}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      {showReport && reportData && (
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Kết quả báo cáo</h5>
            <Button variant="success" onClick={exportToExcel}>
              <FontAwesomeIcon icon={faFileExcel} className="me-2" />
              Xuất Excel
            </Button>
          </div>
          <div key={reportType} className="card-body">
            {renderReportTable()}
          </div>
        </div>
      )}
    </>
  );
}

export default CreateReport;
