import React, { useState, useEffect } from "react";
import { Table, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import axios from "axios";
import "react-datepicker/dist/react-datepicker.css";

function Reports() {
  const [reportType, setReportType] = useState("");
  // const [startDate, setStartDate] = useState(null);
  // const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [user, setUser] = useState(null);

  // Lấy danh sách báo cáo đã lưu
  useEffect(() => {
    const fetchSavedReports = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/reports');
        setSavedReports(response.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách báo cáo:", err);
      }
    };
    fetchSavedReports();
  }, []);

  const generateReport = async () => {
    if (!reportType) {
      setError("Vui lòng chọn loại báo cáo");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      const params = {};

      // if (startDate) params.startDate = startDate.toISOString().split('T')[0];
      // if (endDate) params.endDate = endDate.toISOString().split('T')[0];

      switch (reportType) {
        case 'import':
          endpoint = 'http://localhost:3000/api/reports/imports';
          break;
        case 'export':
          endpoint = 'http://localhost:3000/api/reports/exports';
          break;
        case 'inventory':
          endpoint = 'http://localhost:3000/api/reports/inventory';
          break;
        case 'monthly':
        case 'quarterly':
        case 'annual':
          endpoint = 'http://localhost:3000/api/reports/summary';
          params.period = reportType;
          break;
        default:
          break;
      }

      const response = await axios.get(endpoint, { params });
      setReportData(response.data);

      // Lưu báo cáo vào database
      const token = localStorage.getItem("token");
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const userData = JSON.parse(decodedPayload);
      setUser(userData);
      await axios.post('http://localhost:3000/api/reports', {
        report_type: reportType || 'import',
        // start_date: startDate,
        // end_date: endDate,
        user_id: user.user_id || "US001",
        content: JSON.stringify(response.data)
      });

      // Cập nhật danh sách báo cáo đã lưu
      const reportsResponse = await axios.get('http://localhost:3000/api/reports');
      setSavedReports(reportsResponse.data);

    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Báo cáo");

    // Tạo tên file dựa trên loại báo cáo và ngày
    const dateStr = new Date().toISOString().slice(0, 10);
    let fileName = `BaoCao_${reportType}_${dateStr}.xlsx`;

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
                <th>Mã nhập</th>
                <th>Sản phẩm</th>
                <th>Kho</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th>Ngày nhập</th>
                <th>Nhà cung cấp</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.import_id}>
                  <td>{item.import_id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.warehouse_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price.toLocaleString()}</td>
                  <td>{item.total_value.toLocaleString()}</td>
                  <td>{new Date(item.import_date).toLocaleDateString('vi-VN')}</td>
                  <td>{item.supplier_name || 'N/A'}</td>
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
                <th>Mã xuất</th>
                <th>Sản phẩm</th>
                <th>Kho</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
                <th>Ngày xuất</th>
                <th>Thông tin KH</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.export_id}>
                  <td>{item.export_id}</td>
                  <td>{item.product_name}</td>
                  <td>{item.warehouse_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit_price.toLocaleString()}</td>
                  <td>{item.total_value.toLocaleString()}</td>
                  <td>{new Date(item.export_date).toLocaleDateString('vi-VN')}</td>
                  <td>{item.customer_info || 'N/A'}</td>
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
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Kho</th>
                <th>Số lượng tồn</th>
                <th>Đơn giá</th>
                <th>Tổng giá trị</th>
                <th>HSD còn lại</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => {
                const expirationDate = new Date(item.expiration_date);
                const today = new Date();
                const diffTime = expirationDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
        return (
          <Table striped bordered hover responsive className="mt-3">
            <thead className="table-dark">
              <tr>
                <th>Thời gian</th>
                <th>Tổng nhập</th>
                <th>Tổng xuất</th>
                <th>Tồn kho</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item) => (
                <tr key={item.period}>
                  <td>{item.period}</td>
                  <td>{item.total_import.toLocaleString()}</td>
                  <td>{item.total_export.toLocaleString()}</td>
                  <td>{item.total_inventory.toLocaleString()}</td>
                  <td>{item.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        );
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">📊 Quản Lý Báo Cáo</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="card mb-4">
        <div className="card-header">
          <h5>Tạo báo cáo mới</h5>
        </div>
        <div className="card-body">
          <Row>
            <Col md={4}>
              <Form.Group controlId="reportType">
                <Form.Label>Loại báo cáo</Form.Label>
                <Form.Control
                  as="select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="">-- Chọn loại --</option>
                  <option value="import">Báo cáo nhập hàng</option>
                  <option value="export">Báo cáo xuất hàng</option>
                  <option value="inventory">Báo cáo tồn kho</option>
                  <option value="monthly">Báo cáo tháng</option>
                  <option value="quarterly">Báo cáo quý</option>
                  <option value="annual">Báo cáo năm</option>
                </Form.Control>
              </Form.Group>
            </Col>

            {/* <Col md={3}>
              <Form.Group controlId="startDate">
                <Form.Label>Từ ngày</Form.Label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Chọn ngày bắt đầu"
                  isClearable
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group controlId="endDate">
                <Form.Label>Đến ngày</Form.Label>
                <DatePicker
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Chọn ngày kết thúc"
                  isClearable
                />
              </Form.Group>
            </Col> */}

            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="primary"
                onClick={generateReport}
                disabled={loading || !reportType}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" /> Đang tạo...
                  </>
                ) : (
                  'Tạo báo cáo'
                )}
              </Button>
            </Col>
          </Row>
        </div>
      </div>

      {reportData && (
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Kết quả báo cáo</h5>
            <Button variant="success" onClick={exportToExcel}>
              <FontAwesomeIcon icon={faFileExcel} className="me-2" />
              Xuất Excel
            </Button>
          </div>
          <div className="card-body">
            {renderReportTable()}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h5>Lịch sử báo cáo</h5>
        </div>
        <div className="card-body">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Mã báo cáo</th>
                <th>Loại báo cáo</th>
                <th>Ngày tạo</th>
                <th>Người tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {savedReports.map((report) => (
                <tr key={report.report_id}>
                  <td>{report.report_id}</td>
                  <td>
                    {report.report_type === 'import' && 'Nhập hàng'}
                    {report.report_type === 'export' && 'Xuất hàng'}
                    {report.report_type === 'inventory' && 'Tồn kho'}
                    {report.report_type === 'monthly' && 'Tháng'}
                    {report.report_type === 'quarterly' && 'Quý'}
                    {report.report_type === 'annual' && 'Năm'}
                  </td>
                  <td>{new Date(report.generated_date).toLocaleString('vi-VN')}</td>
                  <td>{report.user_id}</td>
                  <td>
                    <Button variant="info" size="sm">Xem lại</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default Reports;