<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import axios from "axios";

function HistoryReport() {
    const [loading, setLoading] = useState(true);
    const [savedReports, setSavedReports] = useState([]);

    const fetchSavedReports = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/savedreports`, {
                withCredentials: true,
            });
            setSavedReports(response.data);
        } catch (err) {
            console.error("Lỗi khi lấy lịch sử báo cáo:", err);
        }finally {
            setLoading(false);
          }
    };

    useEffect(() => {
        fetchSavedReports();
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

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header">
                    <h5>Lịch sử báo cáo</h5>
                </div>
                <div className="card-body">
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Mã báo cáo</th>
                                <th>Loại báo cáo</th>
                                <th>Ngày tạo</th>
                                <th>Người tạo</th>
                                <th>Ghi chú</th>
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
                                    </td>
                                    <td>{new Date(report.generated_date).toLocaleString('vi-VN')}</td>
                                    <td>{report.user_name}</td>
                                    <td>
                                        {report.content}
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

export default HistoryReport;
=======
import React, { useEffect, useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import axios from "axios";

function HistoryReport() {
    const [loading, setLoading] = useState(true);
    const [savedReports, setSavedReports] = useState([]);

    const fetchSavedReports = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/savedreports`, {
                withCredentials: true,
            });
            setSavedReports(response.data);
        } catch (err) {
            console.error("Lỗi khi lấy lịch sử báo cáo:", err);
        }finally {
            setLoading(false);
          }
    };

    useEffect(() => {
        fetchSavedReports();
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

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header">
                    <h5>Lịch sử báo cáo</h5>
                </div>
                <div className="card-body">
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Mã báo cáo</th>
                                <th>Loại báo cáo</th>
                                <th>Ngày tạo</th>
                                <th>Người tạo</th>
                                <th>Ghi chú</th>
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
                                    </td>
                                    <td>{new Date(report.generated_date).toLocaleString('vi-VN')}</td>
                                    <td>{report.user_name}</td>
                                    <td>
                                        {report.content}
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

export default HistoryReport;
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
