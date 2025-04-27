import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Row, Col } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faCheckCircle, faPerson, faQrcode, faTrash, faSearch } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import Location from "../full_json_generated_data_vn_units.json"

function Export() {
  const [showModal, setShowModal] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [export_notes, setExportNotes] = useState([]);
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
  const [formProduct, setFormProduct] = useState({
    barcode: "",
    product_name: "",
    product_category: "",
    product_unit_price: "",
    supplier_name: "",
    production_date: "",
    expiration_date: "",
    warehouse_id: "",
    total_quantity_per_warehouse: 0,
    product_quantity: 0,
  });
  const [enteredCus_Infor, setEnteredCus_Infor] = useState(false);
  const [showModalCus_Infor, setShowModalCus_Infor] = useState(false);
  const [formCustomerInfor, setFormCustomerInfor] = useState({
    cus_name: "",
    cus_phone: "",
    cus_addres_province: "",
    cus_addres_district: "",
    cus_addres_ward: "",
    cus_addres_house_number: "",
    cus_delivery_option: "",
    cus_payment_option: "",
  });
  const [CustomerInfor, setCustomerInfor] = useState([]);
  // Lấy thông tin tỉnh, quận/huyện, và phường/xã
  const selectedProvince = Location.find(
    (province) => province.FullName === formCustomerInfor.cus_addres_province
  );
  const districts = selectedProvince?.District || [];
  const selectedDistrict = districts.find(
    (district) => district.FullName === formCustomerInfor.cus_addres_district
  );
  const wards = selectedDistrict?.Ward || [];
  const navigate = useNavigate();
  let warehouse_data = [];
  let warehouse_id_data_received = [];
  let quantity_in_stock_received = [];
  const [warehouse_id_data, setWarehouse_id_data] = useState([]);
  const [quantity_in_stock, setQuantity_in_stock] = useState([]);

  useEffect(() => {
    // Gọi API để lấy danh sách nhà kho, nhà cung cấp, danh mục từ CSDL để hiển thị ở các selectbox
    const fetchDataSelectBox = async () => {
      try {
        const warehousesRes = await axios.get("http://localhost:3000/api/warehouses", { headers });

        setWarehouses(warehousesRes.data);
      } catch (error) {
        toast.error("Không thể tải dữ liệu từ server!");
      }
    };
    fetchDataSelectBox();

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = decodeURIComponent(
          escape(window.atob(base64))
        );
        const userData = JSON.parse(decodedPayload);
        setUser(userData);
      } catch (error) {
        console.error("Lỗi khi giải mã token:", error);
      }
    }

    let intervalId;
    const startListening = () => {
      intervalId = setInterval(async () => {
        try {
          // Gửi yêu cầu đến API để quét mã vạch
          const response = await axios.get("http://localhost:3000/api/export_barcode_fetch");

          // Kiểm tra dữ liệu từ API
          if (response.data.success) {
            // Reset formProduct về giá trị mặc định
            setFormProduct({
              barcode: "",
              product_name: "",
              product_category: "",
              product_unit_price: "",
              supplier_name: "",
              production_date: "",
              expiration_date: "",
              warehouse_id: "",
              total_quantity_per_warehouse: 0,
              product_quantity: 0
            });
            warehouse_data = [];
            warehouse_id_data_received = [];
            quantity_in_stock_received = [];

            if (response.data.find) {
              const received_product = response.data.product;
              console.log("Sản phẩm tìm được", received_product); // Kiểm tra mã vạch nhận được từ API
              warehouse_data = JSON.parse(received_product.warehouse_data);
              console.log("Số kho có sản phẩm là: ", warehouse_data.length);
              for (const data of warehouse_data) {
                warehouse_id_data_received.push(data.warehouse_id);
                quantity_in_stock_received.push(data.quantity);
              }
              setWarehouse_id_data(warehouse_id_data_received);
              setQuantity_in_stock(quantity_in_stock_received);
              console.log(warehouse_id_data_received);
              console.log(quantity_in_stock_received);
              // Cập nhật thông tin sản phẩm vào form
              setFormProduct({
                barcode: received_product.barcode,
                product_name: received_product.product_name,
                product_category: received_product.product_category,
                product_unit_price: received_product.product_unit_price,
                supplier_name: received_product.supplier_name,
                production_date: received_product.production_date,
                expiration_date: received_product.expiration_date,
              });
              setIsNewProduct(false);
              toast.success("Tìm thấy sản phẩm trong kho hàng.");
              setShowModal(true); // Hiển thị modal
            } else if (!response.data.find) {
              setIsNewProduct(true);
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
    console.log("Danh sách sản phẩm được chọn ", selectedProducts); // Kiểm tra danh sách sản phẩm đã chọn

    // Dọn dẹp khi component bị unmount
    return () => clearInterval(intervalId);


  }, [selectedProducts]);

  // Tìm kiếm sản phẩm (chọn sản phẩm để thêm sản phẩm vào danh sách hiển thị bên dưới)
  const searchProducts = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3000/api/search_export_products`, {
        params: { query: term },
        headers,
      });
      console.log("Kết quả tìm kiếm: ", response.data)

      if (response.data && response.data.length > 0) {
        // Lọc các sản phẩm đã được chọn ra khỏi kết quả tìm kiếm
        const filteredResults = response.data.filter(
          (product) => !selectedProducts.some((selected) => selected.barcode === product.barcode && selected.warehouse_id === product.warehouse_id)
        );
        setSearchResults(filteredResults);
      } else {
        setSearchResults([]);
      }

    } catch (error) {
      console.error("Lỗi khi tìm kiếm sản phẩm:", error);
      toast.error("Đã xảy ra lỗi khi tìm kiếm sản phẩm.");
    }
  };

  // Chọn sản phẩm từ danh sách tìm kiếm và thêm vào danh sách hiển thị bên dưới
  const handleSelectProduct = (product) => {

    setSelectedProducts((prevProducts) => {
      // Kiểm tra xem sản phẩm đã tồn tại trong danh sách hay chưa
      const isProductExists = prevProducts.some(
        (item) => item.barcode === product.barcode && item.warehouse_id === product.warehouse_id
      );

      if (isProductExists) {
        toast.error("Sản phẩm này đã được chọn.");
        return prevProducts; // Không thay đổi danh sách
      }

      // console.log('Thêm sản phẩm mới vào danh sách');
      return [...prevProducts, product];

    });

    // Reset trường tìm kiếm và danh sách kết quả
    setSearchTerm("");
    setSearchResults([]);
  };

  // Cập nhật số lượng thủ công (nếu người dùng nhập số lượng trực tiếp)
  const handleQuantityInputChange = (barcode, warehouse_id, value) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    setSelectedProducts((prevProducts) =>
      prevProducts.map((product) =>
      (product.barcode === barcode && product.warehouse_id === warehouse_id)
          ? { ...product, product_quantity: quantity }
          : product
      )
    );
  };

  // Xóa sản phẩm vào danh sách hiển thị bên dưới
  const handleDeleteProduct = (barcode, warehouse_id) => {
    console.log("Xóa sp mã vạch: ", barcode, " ở kho: ", warehouse_id);
    setSelectedProducts((prevProducts) =>
      prevProducts.filter(
        (product) => !(product.barcode === barcode && product.warehouse_id === warehouse_id)
      )
    );
  };

  //Nhập thông tin khách hàng
  const handleEnterCustomerInfor = async () => {
    setShowModalCus_Infor(true);
  };

  //Thêm sản phẩm khi quét mã
  const handleSaveProduct = async () => {
    if (!formProduct.total_quantity_per_warehouse) {
      toast.info("Chọn kho có sản phẩm để xuất hàng!");
      return;
    }
    setShowModal(false);
    const warehouse_name = warehouses.find(w => w.warehouse_id === formProduct.warehouse_id).name;
    handleSelectProduct({...formProduct, warehouse_name: warehouse_name});
    setFormProduct({
      barcode: "",
      name: "",
      category_id: "",
      unit_price: "",
      supplier_id: "",
      production_date: "",
      expiration_date: "",
      warehouse_data: "",
    });
    warehouse_data = [];
    warehouse_id_data_received = [];
    quantity_in_stock_received = [];
  };

  // Xác nhận xuất hàng và lưu vào CSDL
  const handleConfirmExport = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Không có sản phẩm nào để xuất hàng.");
      return;
    }
    if (!enteredCus_Infor) {
      toast.error("Hãy nhập thông tin khách hàng!");
      return;
    }
    try {
      const export_id = `IP-${uuidv4().replace(/-/g, '').slice(0, 12)}`;

      const token = localStorage.getItem("token");
      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = decodeURIComponent(escape(atob(base64)));
      const userData = JSON.parse(decodedPayload);

      const contents = {
        export_id,
        user_id: userData.user_id,
        total_quantity: selectedProducts.reduce((sum, product) => sum + product.product_quantity, 0),
        total_value: selectedProducts.reduce((sum, product) => sum + product.product_unit_price * (product?.product_quantity || 1), 0),
        date: new Date().toLocaleDateString("vi-VN"),
        customer_infor: CustomerInfor,
        notes: export_notes.length > 0 ? export_notes.notes : `Phiếu xuất hàng ${new Date().toLocaleDateString("vi-VN")}`
      };

      console.log("Thông tin xuất hàng: ", contents);
      console.log("Sản phẩm xuất kho: ", selectedProducts);

      // Gửi yêu cầu xác nhận xuất hàng
      const response = await axios.post(
        "http://localhost:3000/api/exports_confirm",
        { contents, products: selectedProducts },
        { headers }
      );


      if (response.data.message) {
        toast.success("Xuất hàng thành công!");

        // Xóa danh sách sản phẩm đã chọn
        setSelectedProducts([]);
      }
    } catch (err) {
      console.error("Lỗi khi xuất hàng:", err);
      toast.error("Không thể xuất hàng.");
    }
  };

  // Xác nhận xuất hàng và lưu vào CSDL
  const handleSaveCustomer_Infor = async () => {

    if (!formCustomerInfor.cus_name || !formCustomerInfor.cus_phone || !formCustomerInfor.cus_addres_province || !formCustomerInfor.cus_addres_district
      || !formCustomerInfor.cus_addres_ward || !formCustomerInfor.cus_addres_house_number || !formCustomerInfor.cus_delivery_option || !formCustomerInfor.cus_payment_option) {
      toast.error("Không được để trống thông tin");
      return;
    }

    let cus_inf = ""
    cus_inf = `Họ tên: ${formCustomerInfor.cus_name} -- SĐT: ${formCustomerInfor.cus_phone} -- Địa chỉ: ${formCustomerInfor.cus_addres_house_number}/${formCustomerInfor.cus_addres_ward}/${formCustomerInfor.cus_addres_district}/${formCustomerInfor.cus_addres_province} -- Phương thức vận chuyển ${formCustomerInfor.cus_delivery_option} -- Phương thức thanh toán: ${formCustomerInfor.cus_payment_option}`;
    console.log("Thông tin khách hàng", cus_inf);
    setCustomerInfor(cus_inf);
    setShowModalCus_Infor(false);
    setEnteredCus_Infor(true);
  };

  return (
    <div className="container mt-4">
      <ToastContainer />
      <h1 className="text-center mb-4">Quản Lý Xuất Hàng</h1>
      <div className="d-flex justify-content-between mb-3">
        <Button variant="primary"
          onClick={() => {
            setShowModal(true);
            setFormProduct({
              barcode: "",
              name: "",
              category_id: "",
              unit_price: "",
              supplier_id: "",
              warehouse_id: "",
              production_date: "",
              expiration_date: "",
              quantity: 1,
            });
          }}>
          <FontAwesomeIcon icon={faQrcode} className="me-2" />
          Quét mã vạch sản phẩm
        </Button>
      </div>

      <Row>
        {/* Tìm kiếm sản phẩm sẽ hiển thị sản phẩm có thể bấm vào sản phẩm để thêm sản phẩm vào danh sách hiển thị bên dưới */}
        <Col md={8}>
          <Form className="mb-3 d-flex justify-content-end align-items-center">
            <Form.Group controlId="searchBar" className="d-flex align-items-center" style={{ position: "relative" }}>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm sản phẩm xuất..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  searchProducts(e.target.value);
                }}
                style={{ width: "700px" }}
              />
              <Button variant="info" className="ms-2" onClick={() => {
                searchProducts(searchTerm);
              }}
              >
                <FontAwesomeIcon icon={faSearch} className="me-2" /> Tìm kiếm
              </Button>
              {/* Dropdown hiển thị kết quả tìm kiếm */}
              {searchResults.length > 0 && searchTerm && (
                <div
                  className="position-absolute bg-white border rounded shadow-sm"
                  style={{
                    display: "block",
                    top: "calc(100% + 5px)",
                    left: "0",
                    width: "700px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 1050,
                  }}
                >
                  {searchResults.map((results, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSelectProduct(results)}
                    >
                      <div>
                        <strong>{results.product_name} - {results.product_category}</strong>
                        <Row>
                          <Col xs={20}>
                            <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                              {results.product_unit_price} VNĐ - {results.supplier_name}
                            </p>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs={20}>
                            <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                              {new Date(results.production_date).toLocaleDateString("vi-VN")} - {new Date(results.expiration_date).toLocaleDateString("vi-VN")}
                            </p>
                          </Col>
                        </Row>
                        <Row>
                          <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                            Số lượng hiện có: {results.total_quantity_per_warehouse} - {results.warehouse_name}
                          </p>
                        </Row>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>
          </Form>
          {/* Hiển thị các sản phẩm được chọn */}
          {selectedProducts.length === 0 ? (
            <p className="text-center">Chưa có sản phẩm nào được chọn.</p>
          ) : (
            <div className="container mt-4" style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "10px" }}>
              <Row xs={1} md={2} lg={1} className="g-3">
                {selectedProducts.map((selectedProducts, index) => (
                  <Col key={index}>
                    <Card>
                      <Card.Body>
                        <Row>
                          <Col xs={5}>
                            <h4>{selectedProducts.product_name}</h4>
                          </Col>
                          <Col className="text-end">
                            <Col>
                              Số lượng
                              <span>
                                <Form.Control
                                  name="quantity_detail"
                                  type="number"
                                  value={selectedProducts.product_quantity || 1} // log lỗi
                                  min={1}
                                  max={selectedProducts.total_quantity_per_warehouse || 10000}
                                  onChange={(e) => {
                                    handleQuantityInputChange(selectedProducts.barcode, selectedProducts.warehouse_id, e.target.value);
                                    // setFormProduct({ ...formProduct, product_quantity: e.target.value });
                                  }}
                                  style={{ width: "80px", display: "inline-block" }}
                                />
                              </span>
                            </Col>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs={6}>
                            <p>Đơn giá: {selectedProducts.product_unit_price} VNĐ</p>
                            <p>Danh mục: {selectedProducts.product_category}</p>
                            <p>Nhà kho: {selectedProducts.warehouse_name}</p>
                          </Col>
                          <Col xs={6}>
                            <p>Nhà cung cấp: {selectedProducts.supplier_name}</p>
                            <p>Ngày sản xuất: {selectedProducts.production_date
                              ? new Date(selectedProducts.production_date).toLocaleDateString("vi-VN")
                              : ""}</p>
                            <p>Ngày hết hạn: {selectedProducts.expiration_date
                              ? new Date(selectedProducts.expiration_date).toLocaleDateString("vi-VN")
                              : ""}</p>
                          </Col>
                          <Col className="text-end">
                            <Col>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteProduct(selectedProducts.barcode, selectedProducts.warehouse_id)}
                              >
                                <FontAwesomeIcon icon={faTrash} /> Xóa
                              </Button>
                            </Col>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Col>
        {/* Thông tin hóa đơn */}
        <Col md={4}>
          <aside className="sticky-top">
            <Card>
              <Card.Body>
                <h3 className="text-center mb-4">Thông tin hóa đơn</h3>
                <p>Số lượng sản phẩm: {selectedProducts.reduce((sum, product) => sum + product.product_quantity, 0) ? selectedProducts.reduce((sum, product) => sum + product.product_quantity, 0) : 0}</p>
                <p>Tổng tiền: {selectedProducts.reduce((sum, product) => sum + product.product_unit_price * (product?.product_quantity || 1), 0)} VNĐ</p>
                <p>Người thực hiện: {user ? user.fullname : "Không xác định"}</p>
                <p>Ngày thực hiện: {new Date().toLocaleDateString("vi-VN")}</p>
                <Form.Group>
                  <Form.Label>Nhập thông tin khách hàng {enteredCus_Infor ? "✅" : "❌"}
                  </Form.Label>
                  <Button variant="outline-info" className="mt-3 w-100" onClick={handleEnterCustomerInfor}>
                    <FontAwesomeIcon icon={faPerson} className="me-2" />
                    Nhập thông tin khách hàng
                  </Button>
                  <Form.Label>Nhập nội dung phiếu xuất hàng</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Ghi chú thêm..."
                    className="mb-3"
                    value={export_notes?.notes || ""}
                    onChange={(e) => setExportNotes({ notes: e.target.value })}
                  />
                </Form.Group>
                <Button variant="success" className="mt-3 w-100" onClick={handleConfirmExport}>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Xác nhận xuất hàng
                </Button>
              </Card.Body>
            </Card>
          </aside>
        </Col>
      </Row>
      {/* Quét sản phẩm */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Thông tin sản phẩm</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mã vạch</Form.Label>
                  <Form.Control
                    type="text"
                    value={formProduct.barcode}
                    placeholder="Tự động nhận mã vạch"
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tên sản phẩm</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tên sản phẩm"
                    value={formProduct.product_name}
                    readOnly />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tên danh mục"
                    value={formProduct.product_category}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Đơn giá</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Đơn giá sản phẩm"
                    value={formProduct.product_unit_price}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nhà cung cấp</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Tên nhà cung cấp"
                    value={formProduct.supplier_name}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nhà kho</Form.Label>
                  <Form.Select
                    value={formProduct.warehouse_id}
                    onChange={(e) => {
                      const selectedWarehouseId = e.target.value;
                      const index = warehouse_id_data.indexOf(selectedWarehouseId);
                      setFormProduct({
                        ...formProduct,
                        warehouse_id: selectedWarehouseId,
                        total_quantity_per_warehouse: index >= 0 ? quantity_in_stock[index] : 0,
                      });
                    }}
                  >
                    <option value="">Chọn nhà kho</option>
                    {warehouse_id_data.map(warehouse => (
                      <option key={warehouse} value={warehouse}>
                        {warehouses.find(w => w.warehouse_id === warehouse).name}
                        {/* {warehouse}  */}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Ngày sản xuất</Form.Label>
                  <Form.Control
                    type="date"
                    value={formProduct.production_date ? formProduct.production_date.split('T')[0] : ''}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Ngày hết hạn</Form.Label>
                  <Form.Control
                    type="date"
                    value={formProduct.expiration_date ? formProduct.expiration_date.split('T')[0] : ''}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Số lượng trong kho</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Số lượng sản phẩm"
                    value={formProduct.total_quantity_per_warehouse}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => handleSaveProduct()}>
            Thêm sản phẩm
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Xác nhận xuất hàng mới */}
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
      {/* Nhập thông tin khách hàng */}
      <Modal show={showModalCus_Infor} onHide={() => setShowModalCus_Infor(false)} size="lg">
        <Modal.Header>
          <Modal.Title>Thông tin khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Họ tên</Form.Label>
                  <Form.Control
                    type="text"
                    value={formCustomerInfor.cus_name}
                    placeholder="Nhập họ và tên khách hàng"
                    onChange={(e) => setFormCustomerInfor({ ...formCustomerInfor, cus_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Số điện thoại</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập số điện thoại"
                    value={formCustomerInfor.cus_phone}
                    onChange={(e) => setFormCustomerInfor({ ...formCustomerInfor, cus_phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            {/* Tỉnh/Thành phố */}
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tỉnh/Thành phố</Form.Label>
                  <Form.Select
                    value={formCustomerInfor.cus_addres_province}
                    onChange={(e) =>
                      setFormCustomerInfor({
                        ...formCustomerInfor,
                        cus_addres_province: e.target.value,
                        cus_addres_district: "",
                        cus_addres_ward: "",
                      })
                    }
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {Location.map((province) => (
                      <option key={province.Code} value={province.FullName}>
                        {province.FullName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Quận/Huyện */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quận/Huyện</Form.Label>
                  <Form.Select
                    value={formCustomerInfor.cus_addres_district}
                    onChange={(e) =>
                      setFormCustomerInfor({
                        ...formCustomerInfor,
                        cus_addres_district: e.target.value,
                        cus_addres_ward: "",
                      })
                    }
                    disabled={!selectedProvince}
                  >
                    <option value="">Chọn quận/huyện</option>
                    {districts.map((district) => (
                      <option key={district.Code} value={district.FullName}>
                        {district.FullName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              {/* Phường/Xã */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phường/Xã</Form.Label>
                  <Form.Select
                    value={formCustomerInfor.cus_addres_ward}
                    onChange={(e) =>
                      setFormCustomerInfor({
                        ...formCustomerInfor,
                        cus_addres_ward: e.target.value,
                      })
                    }
                    disabled={!selectedDistrict}
                  >
                    <option value="">Chọn phường/xã</option>
                    {wards.map((ward) => (
                      <option key={ward.Code} value={ward.FullName}>
                        {ward.FullName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Số nhà */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Số nhà</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập số nhà"
                    value={formCustomerInfor.cus_addres_house_number}
                    onChange={(e) =>
                      setFormCustomerInfor({
                        ...formCustomerInfor,
                        cus_addres_house_number: e.target.value,
                      })
                    }
                    disabled={(formCustomerInfor.cus_addres_ward.length === 0)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phương thức vận chuyển</Form.Label>
                  <Form.Select
                    value={formCustomerInfor.cus_delivery_option}
                    onChange={(e) => setFormCustomerInfor({ ...formCustomerInfor, cus_delivery_option: e.target.value })}
                  >
                    <option value="">Chọn phương thức vận chuyển</option>
                    <option value="Hỏa tốc">Hỏa tốc⚡</option>
                    <option value="Vận chuyển nhanh">Vận chuyển nhanh⏱️</option>
                    <option value="Giao hàng tiết kiệm">Giao hàng tiết kiệm 🚚</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Phương thức thanh toán</Form.Label>
                  <Form.Select
                    value={formCustomerInfor.cus_payment_option}
                    onChange={(e) => setFormCustomerInfor({ ...formCustomerInfor, cus_payment_option: e.target.value })}
                  >
                    <option value="">Chọn phương thức thanh toán</option>
                    <option value="Thanh toán khi nhận hàng">Thanh toán khi nhận hàng 💵</option>
                    <option value="Thẻ Tín dụng/Ghi nợ">Thẻ Tín dụng/Ghi nợ 💳</option>
                    <option value="Chuyển khoản ngân hàng">Chuyển khoản ngân hàng 🏦</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalCus_Infor(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => handleSaveCustomer_Infor()}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Export;
