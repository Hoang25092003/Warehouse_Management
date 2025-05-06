import React, { useState, useEffect } from "react";
import { Button, Row, Col, Form, Modal, Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import moment from "moment";

function Check() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse_id_data, setWarehouse_id_data] = useState([]);
  const [quantity_in_stock, setQuantity_in_stock] = useState([]);
  const [selectedWarehouseQuantity, setSelectedWarehouseQuantity] = useState(0);
  const [product_status, setProductStatus] = useState("");
  const [checked, setChecked] = useState(false);
  const [queueBarcode, setQueueBarcode] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const navigate = useNavigate();
  let warehouse_data = [];
  let warehouse_id_data_received = [];
  let quantity_in_stock_received = [];

  useEffect(() => {
    // Gọi API để lấy danh sách nhà kho, nhà cung cấp, danh mục từ CSDL để hiển thị ở các selectbox
    const fetchDataSelectBox = async () => {
      try {
        const warehousesRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/warehouses`, { 
          withCredentials: true,
         });

        setWarehouses(warehousesRes.data);
      } catch (error) {
        toast.error("Không thể tải dữ liệu từ server!");
      }finally {
        setLoading(false);
      }
    };
    fetchDataSelectBox();

    let intervalId;
    const startListening = () => {
      intervalId = setInterval(async () => {
        try {
          warehouse_data = [];
          warehouse_id_data_received = [];
          quantity_in_stock_received = [];
          // Gửi yêu cầu đến API để quét mã vạch
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/check_barcode_fetch`, { 
            withCredentials: true,
           });
          if (response.data.success) {
            if (response.data.find) {
              const received_product = response.data.product;
              warehouse_data = JSON.parse(received_product.warehouse_data);
              for (const data of warehouse_data) {
                warehouse_id_data_received.push(data.warehouse_id);
                quantity_in_stock_received.push(data.quantity);
              }

              checkProductStatus(received_product);
              setWarehouse_id_data(warehouse_id_data_received);
              setQuantity_in_stock(quantity_in_stock_received);
              if(!searchResults){
                setSearchResults(received_product);
                toast.success("Tìm thấy sản phẩm trong kho hàng.");
              }else{
                setQueueBarcode(received_product);
                toast.info("Một sản phẩm được thêm vào hàng chờ")
              }
              setChecked(true);
              setIsNewProduct(false);
            } else if (!response.data.find) {
              setIsNewProduct(true); //Show modal
              setChecked(false);
            }
          }
        } catch (error) {
          console.error("Lỗi khi quét mã vạch:", error);
          toast.error("Đã xảy ra lỗi khi quét mã vạch.");
          // Hiển thị thông báo lỗi chi tiết
          if (error.response) {
            // Lỗi từ phía server
            console.log(`Lỗi server: ${error.response.status} - ${error.response.data.message || "Không xác định"}`);
          } else if (error.request) {
            // Không nhận được phản hồi từ server
            console.log("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.");
          } else {
            // Lỗi khác
            console.log(`Đã xảy ra lỗi: ${error.message}`);
          }
        }
      }, 500);
    };

    startListening();
    // Dọn dẹp khi component bị unmount
    return () => clearInterval(intervalId);

  }, [searchResults]);

  const checkProductStatus = (product) => {
    const currentDate = moment();
    const expirationDate = moment(product.expiration_date);

    // Kiểm tra số lượng
    if (product.product_quantity < 10) {
      setProductStatus("Sắp hết hàng 🟡");
      return;
    } else if (product.product_quantity === 0) {
      setProductStatus("Hết hàng 🔴");
    }

    // Kiểm tra hạn sử dụng
    if (expirationDate.diff(currentDate, "days") < 7 && expirationDate.isAfter(currentDate)) {
      setProductStatus("Sắp hết hạn 🟠");
      return;
    } else if (expirationDate.isBefore(currentDate)) {
      setProductStatus("Quá hạn ⚫");
      return;
    }
    setProductStatus("Bình thường 🟢");
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
    <div className="container mt-4">
      <ToastContainer />
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        {/* Header Title */}
        <h1 className="text-center flex-grow-1 mb-0">Kiểm Hàng</h1>

        {/* Queue Button */}
        <div className="position-relative">
          <Button variant={queueBarcode.length > 0 ? "success" : "secondary"}
            className="position-relative"
            onClick={() => setShowQueue(!showQueue)}>
            <FontAwesomeIcon icon={faClipboardList} className="me-2" />
            Hàng chờ
            {queueBarcode.length > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.8rem" }}
              >
                {queueBarcode.length}
              </span>
            )}
          </Button>

          {/* Dropdown Hàng chờ */}
          {showQueue && (
            <div
              className="position-absolute end-0 mt-2 bg-white border shadow p-3"
              style={{
                width: "300px",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1050,
              }}
            >
              {queueBarcode.length === 0 ? (
                <p className="text-muted text-center">Không có gì trong hàng chờ</p>
              ) : (
                <ul className="list-group">
                  {queueBarcode.map((item, index) => (
                    <li
                      key={index}
                      className="list-group-item"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSearchResults(item);
                        setQueueBarcode((prevProducts) =>
                          prevProducts.filter((product) => product.barcode !== item.barcode)
                        );
                        setShowQueue(false);
                        toast.info("Vui lòng kiểm tra thông tin.")
                      }}
                    >
                      <strong>Tên:</strong> {item.name}
                      <br />
                      <strong>Mã vạch:</strong> {item.barcode}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Product List */}
      <div className="card p-4 shadow-sm">
        <Row className="mb-3">
          <h2 className="mb-3 text-primary text-center">{searchResults?.product_name || "Chưa có thông tin"}</h2>
        </Row>
        <Form>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Mã vạch</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Mã vạch sản phẩm"
                  value={searchResults?.barcode || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Danh mục</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Danh mục sản phẩm"
                  value={searchResults?.product_category || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Đơn giá</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Giá sản phẩm"
                  value={searchResults?.product_unit_price || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Ngày sản xuất</Form.Label>
                <Form.Control
                  type="date"
                  value={searchResults.production_date?.split("T")[0] || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Ngày hết hạn</Form.Label>
                <Form.Control
                  type="date"
                  value={searchResults.expiration_date?.split("T")[0] || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Tình trạng</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Tình trạng sản phẩm"
                  value={product_status || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Nhà cung cấp</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhà cung cấp"
                  value={searchResults.supplier_name || ""}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Kho hàng</Form.Label>
                <Form.Select
                  onChange={(e) => {
                    const selectedWarehouseId = e.target.value;
                    const index = warehouse_id_data.indexOf(selectedWarehouseId);
                    const quantity = index >= 0 ? quantity_in_stock[index] : 0;
                    setSelectedWarehouseQuantity(quantity);
                  }}
                >
                  <option value="">Chọn nhà kho</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      {warehouse.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Số lượng trong kho</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedWarehouseQuantity}
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
        <div className="d-flex justify-content-end mt-4">
          <Button className="me-2" variant="primary"
            onClick={() => {
              setSearchResults([]);
              setChecked(false);
            }}>
            Làm mới
          </Button>
          <Button variant="danger"
            onClick={() => {
              if (checked) {
                setShowModal(true);
              }
            }}>
            Sửa thông tin
          </Button>
        </div>
      </div>
      {/* Xác nhận hàng mới */}
      <Modal show={isNewProduct} onHide={() => setIsNewProduct(false)} centered>
        <Modal.Header>
          <Modal.Title>Thông báo <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="d-block text-center p-3 rounded text-primary">
              <strong>Sản phẩm chưa tồn tại trong kho</strong>.
              <br />
              Bạn muốn thêm sản phẩm vào kho?
              <br />
              <span className="text-muted">Nhấn xác nhận để chuyển qua trang nhập hàng!</span>
            </Form.Label>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsNewProduct(false)}>Hủy</Button>
          <Button
            variant="primary"
            onClick={() => {
              setIsNewProduct(false);
              navigate('/import');
            }}
          >
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Xác nhận sửa thông tin */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header
          closeButton
          style={{
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #dee2e6",
          }}
        >
          <Modal.Title className="d-flex align-items-center">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="me-2 text-warning"
              style={{ fontSize: "1.5rem" }}
            />
            <span style={{ fontWeight: "bold" }}>Thông báo</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "1px solid #ffeeba",
            }}
          >
            <p
              style={{
                fontSize: "1.2rem",
                fontWeight: "600",
                color: "#856404",
              }}
            >
              Bạn có chắc chắn muốn sửa thông tin sản phẩm không?
            </p>
            <p
              style={{
                fontSize: "1rem",
                color: "#6c757d",
                marginBottom: "10px",
              }}
            >
              Nhấn xác nhận để chuyển qua trang quản lý sản phẩm!
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: "#f8f9fa",
            borderTop: "1px solid #dee2e6",
          }}
        >
          <Button
            variant="outline-secondary"
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: "20px",
              padding: "10px 20px",
              fontWeight: "bold",
            }}
          >
            Hủy
          </Button>
          <Button
            variant="success"
            onClick={() => {
              setIsNewProduct(false);
              navigate("/products");
            }}
            style={{
              borderRadius: "20px",
              padding: "10px 20px",
              fontWeight: "bold",
            }}
          >
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default Check;
