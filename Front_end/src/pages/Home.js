import React, { useState, useEffect } from "react";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from "chart.js";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/dashboard`, {
          withCredentials: true,
        });
        setDashboardData(response.data);
      } catch (err) {
        if (err.response?.status === 403) {
          navigate('/login');
        } else {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      <div className="alert alert-danger">
        Error loading dashboard data: {error}
      </div>
    );
  }

  // Prepare chart data
  const productData = {
    labels: dashboardData.categoryStats.map(item => item.category_name),
    datasets: [
      {
        label: "Số lượng",
        data: dashboardData.categoryStats.map(item => item.total_quantity),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
      },
    ],
  };

  const warehouseData = {
    labels: dashboardData.warehouseStats.map(item => item.warehouse_name),
    datasets: [
      {
        label: "Sức chứa hiện tại",
        data: dashboardData.warehouseStats.map(item => item.current_capacity),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
      },
    ],
  };

  const warehouseOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Sức chứa của các kho",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...dashboardData.warehouseStats.map(item => item.capacity)) * 1.2,
      },
    },
  };

  const importExportData = {
    labels: ["Nhập", "Xuất"],
    datasets: [
      {
        label: "Số lượng",
        data: [dashboardData.todayImports, dashboardData.todayExports],
        backgroundColor: ["#36A2EB", "#FF6384"],
      },
    ],
  };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">🏠 Trang chủ - Quản lý kho</h1>
      <Row>
        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>📦 Tổng sản phẩm</Card.Title>
              <Card.Text>{dashboardData.totalProducts} sản phẩm</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>📥 Đơn nhập hôm nay</Card.Title>
              <Card.Text>{dashboardData.todayImportsCount} đơn</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>📤 Đơn xuất hôm nay</Card.Title>
              <Card.Text>{dashboardData.todayExportsCount} đơn</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>🏭 Tổng số kho</Card.Title>
              <Card.Text>{dashboardData.totalWarehouses} kho</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <h4 className="text-center">Biểu đồ danh mục sản phẩm</h4>
          <Pie data={productData} />
        </Col>
        <Col md={6}>
          <h4 className="text-center">Biểu đồ sức chứa kho</h4>
          <Bar data={warehouseData} options={warehouseOptions} />
          <div className="mt-4">
            <h5 className="text-center">Biểu đồ nhập/xuất hôm nay</h5>
            <div style={{ height: "200px" }}>
              <Line
                data={importExportData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    title: {
                      display: true,
                      text: `Tổng: ${dashboardData.todayImports + dashboardData.todayExports} sản phẩm`
                    }
                  }
                }}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default Home;