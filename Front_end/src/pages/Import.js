import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Row, Col, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faPlus, faSearch, faTrash, faBars, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

function Import() {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState(null);
  const [import_warehouses, setImportWarehouses] = useState([]);
  const [import_notes, setImportNotes] = useState([]);
  const [queueBarcode, setQueueBarcode] = useState([]);
  const [showQueue, setShowQueue] = useState(false);
  const [formProduct, setFormProduct] = useState({
    barcode: "",
    name: "",
    category_id: "",
    unit_price: "",
    supplier_id: "",
    production_date: "",
    expiration_date: "",
    quantity: 1,
    newProduct: false,
  });

  useEffect(() => {
    // Gọi API để lấy danh sách nhà kho, nhà cung cấp, danh mục từ CSDL để hiển thị ở các selectbox
    const fetchDataSelectBox = async () => {
      try {
        const categoriesRes = await axios.get("http://localhost:3000/api/categories", {
          withCredentials: true,
        });
        const suppliersRes = await axios.get("http://localhost:3000/api/suppliers", {
          withCredentials: true,
        });
        const warehousesRes = await axios.get("http://localhost:3000/api/warehouses", {
          withCredentials: true,
        });

        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);
        setWarehouses(warehousesRes.data);
      } catch (error) {
        toast.error("Không thể tải dữ liệu từ server!");
      }finally {
        setLoading(false);
      }
    };
    fetchDataSelectBox();

    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/profile", {
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

    let intervalId;
    const startListening = () => {
      intervalId = setInterval(async () => {
        try {
          // Gửi yêu cầu đến API để quét mã vạch
          const response = await axios.get("http://localhost:3000/api/barcode_fetch", {
            withCredentials: true,
          });

          // Kiểm tra dữ liệu từ API
          if (response.data && response.data.success) {
            // Reset formProduct về giá trị mặc định
            setFormProduct({
              // barcode: "",
              name: "",
              category_id: "",
              unit_price: "",
              supplier_id: "",
              production_date: "",
              expiration_date: "",
              quantity: 1,
            });

            if (response.data.find) {
              const received_product = response.data.product;
              console.log("Sản phẩm tìm được", received_product); // Kiểm tra mã vạch nhận được từ API
              const productData = {
                barcode: received_product.barcode,
                name: received_product.name,
                category_id: received_product.category_id,
                unit_price: received_product.unit_price,
                supplier_id: received_product.supplier_id,
                production_date: received_product.production_date,
                expiration_date: received_product.expiration_date,
                quantity: 1,
                newProduct: false,
              };

              // Kiểm tra hàng chờ
              if (!showModal) {
                // Cập nhật thông tin sản phẩm vào form
                setFormProduct(productData);
                setShowModal(true); // Hiển thị modal
                toast.success("Tìm thấy sản phẩm trong kho.");
              } else {
                // Cập nhật thông tin sản phẩm vào hàng chờ
                setQueueBarcode((prev) => {
                  const exists = prev.some((item) => item.barcode === productData.barcode);
                  return exists ? prev : [...prev, productData];
                });

                toast.info("Một sản phẩm đã được thêm vào hàng chờ");
              }
              setIsNewProduct(false);
            } else if (!response.data.find) {
              const barcode = response.data.barcode;

              const productData = {
                barcode,
                name: "",
                category_id: "",
                unit_price: "",
                supplier_id: "",
                production_date: "",
                expiration_date: "",
                quantity: 1,
                newProduct: true,
              };
              // Kiểm tra hàng chờ
              if (!showModal) {
                // Cập nhật mã vạch vào form
                setFormProduct(productData);
                setShowModal(true);
                toast.info("Không tìm thấy sản phẩm trong kho. Vui lòng nhập thông tin.");
              } else {
                // Cập nhật mã vạch vào form
                setQueueBarcode((prev) => {
                  const exists = prev.some((item) => item.barcode === productData.barcode);
                  return exists ? prev : [...prev, productData];
                });

                toast.info("Một sản phẩm mới đã được thêm vào hàng chờ");
              }
              setIsNewProduct(true);
            }
          }
        } catch (error) {
          // console.error("Lỗi khi quét mã vạch:", error);
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
      }, 1000);
    };

    startListening();

    // Dọn dẹp khi component bị unmount
    return () => clearInterval(intervalId);


  }, [showModal]);

  // Tìm kiếm sản phẩm (chọn sản phẩm để thêm sản phẩm vào danh sách hiển thị bên dưới)
  const searchProducts = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3000/api/search_products`, {
        params: { query: term },
        withCredentials: true,
      });

      if (response.data && response.data.length > 0) {
        // Lọc các sản phẩm đã được chọn ra khỏi kết quả tìm kiếm
        const filteredResults = response.data.filter(
          (product) => !selectedProducts.some((selected) => selected.product_id === product.product_id)
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

  // Xóa sản phẩm vào danh sách hiển thị bên dưới
  const handleDeleteProduct = (productId) => {
    setSelectedProducts((prevProducts) =>
      prevProducts.filter((product) => product.product_id !== productId)
    );
  };

  // Chọn sản phẩm từ danh sách tìm kiếm và thêm vào danh sách hiển thị bên dưới
  const handleSelectProduct = (product) => {
    if (import_warehouses.length === 0) {
      toast.error("Vui lòng chọn nhà kho trước khi thêm sản phẩm.");
      return;
    }
    setSelectedProducts((prevProducts) => {
      // Kiểm tra xem sản phẩm đã tồn tại trong danh sách hay chưa
      const isProductExists = prevProducts.some(
        (item) => item.barcode === product.barcode
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
  const handleQuantityInputChange = (productId, value) => {
    const quantity = parseInt(value, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    setSelectedProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.product_id === productId
          ? { ...product, quantity: quantity }
          : product
      )
    );
  };

  // Lưu sản phẩm mới vào state
  const handleSaveNewProduct = async () => {

    if (import_warehouses.length === 0) {
      toast.error("Vui lòng chọn nhà kho trước khi thêm sản phẩm.");
      return;
    }

    const { barcode, name, category_id, unit_price, supplier_id, production_date, expiration_date, quantity } = formProduct;

    // Kiểm tra xem người dùng đã nhập đủ các trường dữ liệu chưa
    if (!barcode || !name || !category_id || !unit_price || !supplier_id || !production_date || !expiration_date || !quantity) {
      toast.error("Vui lòng nhập đầy đủ thông tin sản phẩm!");
      return;
    }

    // Nếu là sản phẩm mới, hiển thị hộp thoại xác nhận trước khi thêm vào CSDL
    if (isNewProduct) {
      toast.info("Đây là sản phẩm mới sẽ được lưu vào CSDL khi xác nhận nhập hàng!");

      // Lưu sản phẩm mới vào State
      setNewProducts((prevNewProducts) => {
        return [...prevNewProducts, { ...formProduct }];
      });
    }

    // Đóng Modal
    setShowModal(false);
    // Thêm sản phẩm vừa được lưu vào danh sách hiển thị
    handleSelectProduct(formProduct); // Thêm sản phẩm vào danh sách đã chọn
    // Reset formProduct về giá trị mặc định
    setFormProduct({
      barcode: "",
      name: "",
      category_id: "",
      unit_price: "",
      supplier_id: "",
      production_date: "",
      expiration_date: "",
      quantity: 1,
    });
  };

  // Xác nhận hàng và thực hiện lưu vào CSDL
  const handleConfirmImport = async () => {
    // Kiểm tra xem có sản phẩm nào được chọn để nhập hàng hay không
    if (selectedProducts.length === 0) {
      toast.error("Không có sản phẩm nào để nhập hàng.");
      return;
    }

    try {
      let syncedProducts = [...selectedProducts];
      if (newProducts.length > 0) {
        // Đồng bộ quantity giữa selectedProducts và newProducts
        const newProductWithIds = newProducts.map((newProduct) => {
          const pruuid = uuidv4().replace(/-/g, '').slice(0, 12);
          const product_id = `P-${pruuid}`;

          const matchedProduct = selectedProducts.find(
            (selected) => selected.barcode === newProduct.barcode
          );
          return matchedProduct
            ? { ...newProduct, product_id, quantity: matchedProduct.quantity }
            : { ...newProduct, product_id };
        });

        // Lưu sản phẩm mới vào cơ sở dữ liệu
        const newProductResponses = await Promise.all(
          newProductWithIds.map(async (product) => {
            try {
              await axios.post(
                "http://localhost:3000/api/save_new_product",
                product,
                { withCredentials: true, }
              );
              toast.success(`Sản phẩm mới ${product.name} đã được lưu.`);
              return { success: true, product };
            } catch (error) {
              console.error(`Lỗi khi lưu sản phẩm mới ${product.name}:`, error);
              toast.error(`Không thể lưu sản phẩm mới ${product.name}.`);
              return { success: false, product };
            }
          })
        );

        // Lọc các sản phẩm mới lưu thành công
        const successfulNewProducts = newProductResponses
          .filter((res) => res.success)
          .map((res) => res.product);

        // Cập nhật danh sách sản phẩm đã chọn với `product_id` từ sản phẩm mới
        syncedProducts = syncedProducts.map((product) => {
          const matchedNewProduct = successfulNewProducts.find(
            (newProduct) => newProduct.barcode === product.barcode
          );
          return matchedNewProduct
            ? { ...product, product_id: matchedNewProduct.product_id }
            : product;
        });

        // Cập nhật state
        setNewProducts(successfulNewProducts);
        setSelectedProducts(syncedProducts);

        if (successfulNewProducts.length < newProducts.length) {
          toast.error("Một số sản phẩm mới không được lưu thành công.");
          return;
        }
      }

      // Sau khi lưu sản phẩm mới thành công, tiến hành lưu tất cả sản phẩm đã chọn
      // Xử lý thông tin nhập hàng
      const import_id = `IP-${uuidv4().replace(/-/g, '').slice(0, 12)}`;

      const contents = {
        import_id,
        user_id: user.user_id,
        warehouse_id: import_warehouses.warehouse_id,
        total_quantity: syncedProducts.reduce((sum, product) => sum + product.quantity, 0),
        total_value: syncedProducts.reduce((sum, product) => sum + product.unit_price * product.quantity, 0),
        date: new Date().toLocaleDateString("vi-VN"),
        notes: import_notes.length > 0 ? import_notes.notes : `Phiếu nhập hàng ${new Date().toLocaleDateString("vi-VN")}`
      };
      console.log("Thông tin nhập kho:", contents); // Kiểm tra thông tin nhập hàng
      console.log("Thông tin sản phẩm nhập kho", selectedProducts)
      // Gửi yêu cầu xác nhận nhập hàng
      const response = await axios.post(
        "http://localhost:3000/api/imports_confirm",
        { contents, products: syncedProducts },
        { withCredentials: true, }
      );


      if (response.data.message) {
        toast.success("Nhập hàng thành công!");

        // Xóa danh sách sản phẩm đã chọn và sản phẩm mới
        setSelectedProducts([]);
        setNewProducts([]);
      }
    } catch (error) {
      console.error("Lỗi khi nhập hàng:", error);
      toast.error("Không thể nhập hàng.");
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
    <div className="container mt- 4">
      <h1 className="text-center mb-4">Quản Lý Nhập Hàng</h1>
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
              production_date: "",
              expiration_date: "",
              quantity: 1,
            });
          }
          }>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm sản phẩm
        </Button>

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
                        setFormProduct(item);
                        setQueueBarcode((prevProducts) =>
                          prevProducts.filter((product) => product.barcode !== item.barcode)
                        );
                        setShowModal(true);
                        setShowQueue(false);
                        if (item.newProduct) {
                          toast.info("Đây là sản phẩm mới. Vui lòng nhập thêm thông tin.");
                        } else {
                          toast.info("Sản phẩm có sẵn trong kho. Vui lòng kiểm tra thông tin.")
                        }
                      }}
                    >
                      <strong>Mã vạch:</strong> {item.barcode}
                      <br />
                      <strong>{item.newProduct ? "(Sản phẩm mới)" : "Tên:"}</strong> {item.newProduct ? "" : item.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

      </div>
      <Row>
        {/* Tìm kiếm sản phẩm sẽ hiển thị sản phẩm có thể bấm vào sản phẩm để thêm sản phẩm vào danh sách hiển thị bên dưới */}
        <Col md={8}>
          <Form className="mb-3 d-flex justify-content-end align-items-center">
            <Form.Group className="d-flex align-items-center" style={{ position: "relative" }}>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
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
                    maxHeight: "300px",
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
                        <strong>{results.name} - {results.barcode}</strong>
                        <Row>
                          <Col xs={20}>
                            <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                              {results.unit_price} VNĐ - {suppliers.find(s => s.supplier_id === results.supplier_id).supplier_name} - {categories.find(c => c.category_id === results.category_id).category_name}
                            </p>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs={20}>
                            <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                              NSX: {new Date(results.production_date).toLocaleDateString("vi-VN")} - NHH: {new Date(results.expiration_date).toLocaleDateString("vi-VN")}
                            </p>
                          </Col>
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
                            <h4>{selectedProducts.name}</h4>
                          </Col>
                          <Col className="text-end">
                            <Col>
                              Số lượng
                              <span>
                                <Form.Control
                                  name="quantity_product"
                                  type="number"
                                  value={selectedProducts.quantity || 1}
                                  onChange={(e) => {
                                    handleQuantityInputChange(selectedProducts.product_id, e.target.value);
                                    setFormProduct({ ...formProduct, quantity: e.target.value });
                                  }}
                                  style={{ width: "60px", display: "inline-block" }}
                                />
                              </span>
                            </Col>
                          </Col>
                        </Row>
                        <Row>
                          <Col xs={6}>
                            <p>Đơn giá: {selectedProducts.unit_price} VNĐ</p>
                            <p>Danh mục: {categories.find(c => c.category_id === selectedProducts.category_id).category_name}</p>
                            <p>Nhà kho: {warehouses.find(w => w.warehouse_id === import_warehouses.warehouse_id).name}</p>
                          </Col>
                          <Col xs={6}>
                            <p>Nhà cung cấp: {suppliers.find(s => s.supplier_id === selectedProducts.supplier_id).supplier_name}</p>
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
                                onClick={() => handleDeleteProduct(selectedProducts.product_id)}
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
        {/* Hiển thị thông tin hóa đơn bên phải */}
        <Col md={4}>
          <aside className="sticky-top">
            <Card>
              <Card.Body>
                <h3 className="text-center mb-4">Thông tin hóa đơn</h3>
                <p>Số lượng sản phẩm: {selectedProducts.length}</p>
                <p>Tổng tiền: {selectedProducts.reduce((sum, product) => sum + product.unit_price * product.quantity, 0)} VNĐ</p>
                <p>Người thực hiện: {user ? user.fullname : "Không xác định"}</p>
                <p>Ngày thực hiện: {new Date().toLocaleDateString("vi-VN")}</p>
                <Form.Group>
                  <Form.Label>Nhà kho</Form.Label>
                  <Form.Select
                    value={import_warehouses?.warehouse_id || ""}
                    onChange={(e) => setImportWarehouses({ warehouse_id: e.target.value })}
                  >
                    <option value="">Chọn nhà kho</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Label>Nhập nội dung phiếu xuất hàng</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Ghi chú thêm..."
                    className="mb-3"
                    value={import_notes?.notes || ""}
                    onChange={(e) => setImportNotes({ notes: e.target.value })}
                  />
                </Form.Group>
                <Button variant="success" className="mt-3 w-100" onClick={handleConfirmImport}>
                  <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                  Xác nhận nhập hàng
                </Button>
              </Card.Body>
            </Card>
          </aside>
        </Col>
      </Row>
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title> {isNewProduct ? "Thêm sản phẩm mới" : "Thông tin sản phẩm quét được"}</Modal.Title>
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
                    onChange={(e) => setFormProduct({ ...formProduct, barcode: e.target.value })}
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
                    value={formProduct.name}
                    onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Danh mục</Form.Label>
                  <Form.Select
                    value={formProduct.category_id}
                    onChange={(e) => setFormProduct({ ...formProduct, category_id: e.target.value })}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Đơn giá</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Nhập đơn giá"
                    value={formProduct.unit_price}
                    onChange={(e) => setFormProduct({ ...formProduct, unit_price: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Form.Group>
                <Form.Label>Nhà cung cấp</Form.Label>
                <Form.Select
                  value={formProduct.supplier_id}
                  onChange={(e) => setFormProduct({ ...formProduct, supplier_id: e.target.value })}
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.supplier_id} value={supplier.supplier_id}>
                      {supplier.supplier_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ngày sản xuất</Form.Label>
                  <Form.Control
                    type="date"
                    value={formProduct.production_date ? formProduct.production_date.split('T')[0] : ''}
                    onChange={(e) => setFormProduct({ ...formProduct, production_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ngày hết hạn</Form.Label>
                  <Form.Control
                    type="date"
                    value={formProduct.expiration_date ? formProduct.expiration_date.split('T')[0] : ''}
                    onChange={(e) => setFormProduct({ ...formProduct, expiration_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowModal(false);
          }}>
            Hủy
          </Button>
          <Button variant="primary" onClick={() => handleSaveNewProduct()}>
            Thêm sản phẩm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Import;
