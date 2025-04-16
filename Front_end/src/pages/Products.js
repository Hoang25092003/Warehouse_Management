import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortUp,
  faSortDown,
  faSearch,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

function Products() {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/products");
        setProducts(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === "asc" ? faSortUp : faSortDown;
  };

  const handleEdit = (product) => {
    alert(`Sửa sản phẩm: ${product.name}`);
    // Add your edit logic here
  };

  const handleDelete = (product) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm: ${product.name}?`)) {
      alert(`Xóa sản phẩm: ${product.name}`);
      // Add your delete logic here
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    if (valueA == null || valueB == null) return 0;

    const valA = typeof valueA === "string" ? valueA.toLowerCase() : valueA;
    const valB = typeof valueB === "string" ? valueB.toLowerCase() : valueB;

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

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
        <Alert variant="danger">Lỗi khi tải sản phẩm: {error}</Alert>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">📋 Quản lý sản phẩm</h1>
      <Form className="mb-3 d-flex justify-content-end align-items-center">
        <Form.Group controlId="searchBar" className="d-flex align-items-center">
          <Form.Control
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "250px" }}
          />
          <Button variant="primary" className="ms-2">
            <FontAwesomeIcon icon={faSearch} />
          </Button>
        </Form.Group>
      </Form>
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("product_id")}>
              Mã sản phẩm <FontAwesomeIcon icon={getSortIcon("product_id")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
              Tên sản phẩm <FontAwesomeIcon icon={getSortIcon("name")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_name")}>
              Danh mục <FontAwesomeIcon icon={getSortIcon("category_name")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("quantity")}>
              Số lượng <FontAwesomeIcon icon={getSortIcon("quantity")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("unit_price")}>
              Giá bán <FontAwesomeIcon icon={getSortIcon("unit_price")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("production_date")}>
              Ngày sản xuất <FontAwesomeIcon icon={getSortIcon("production_date")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("expiration_date")}>
              Hạn sử dụng <FontAwesomeIcon icon={getSortIcon("expiration_date")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("supplier_name")}>
              Nhà cung cấp <FontAwesomeIcon icon={getSortIcon("supplier_name")} />
            </th>
            <th style={{ cursor: "pointer" }} onClick={() => handleSort("barcode")}>
              Mã vạch <FontAwesomeIcon icon={getSortIcon("barcode")} />
            </th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((product) => (
            <tr key={product.product_id}>
              <td>{product.product_id}</td>
              <td>{product.name}</td>
              <td>{product.category_name}</td>
              <td>{product.quantity}</td>
              <td>{product.unit_price.toLocaleString("vi-VN")} VND</td>
              <td>{new Date(product.production_date).toLocaleDateString("vi-VN")}</td>
              <td>{new Date(product.expiration_date).toLocaleDateString("vi-VN")}</td>
              <td>{product.supplier_name}</td>
              <td>{product.barcode}</td>
              <td className="text-center">
                <Button variant="warning" size="sm" className="me-2" onClick={() => handleEdit(product)}>
                  <FontAwesomeIcon icon={faEdit} /> Sửa
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(product)}>
                  <FontAwesomeIcon icon={faTrash} /> Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Products;
