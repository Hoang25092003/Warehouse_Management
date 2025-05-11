<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Category() {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formCategory, setFormCategory] = useState({
        category_id: "",
        category_name: "",
        description: ""
    });


    const fetchcategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`, {
                withCredentials: true,
            });
            setCategories(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcategories();
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

    const handleEdit = (category) => {
        setEditingCategoryId(category.category_id);
        setFormCategory({
            category_id: category.category_id,
            category_name: category.category_name,
            description: category.description
        });
        setShowModal(true);
    };

    const handleDelete = async (category) => {
        console.log(`Xóa danh mục ID: ${category.warehouse_id}`);
        if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục: ${category.category_name}?`)) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/categories/${category.category_id}`, {
                    withCredentials: true,
                });
                // Cập nhật lại danh sách danh mục sau khi xóa
                setCategories((prev) => prev.filter(c => c.category_id !== category.category_id));
                toast.success("Đã xóa danh mục thành công!");
                fetchcategories();
            } catch (err) {
                console.error('❌ Chi tiết lỗi khi danh mục:', err);
                toast.error("Đã xảy ra lỗi khi xóa danh mục!");
            }
        }
    };

    const handleSave = () => {
        if (editingCategoryId) {
            handleSaveEdit(); // chỉnh sửa
        } else {
            handleAddCategory(); // thêm mới
        }
    };

    const handleAddCategory = async () => {
        try {
            if (!formCategory.category_name || formCategory.category_name.trim() === "") {
                toast.error("Tên danh mục không được để trống!");
                return;
            }
            if (formCategory.description.trim() === "") {
                formCategory.description = formCategory.category_name;
            }
            const newCategory = { ...formCategory };
            const response = await axios.post("${process.env.REACT_APP_API_URL}/api/categories", newCategory, {
                withCredentials: true,
            });
            setCategories(prev => [...prev, response.data.category]);
            handleClose();
            fetchcategories();
            toast.success(response.data.message);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Lỗi khi thêm danh mục mới!");
            }
            console.error(err);
        }
    };

    const handleSaveEdit = async () => {
        try {
            const updatedCategory = {
                category_id: formCategory.category_id,
                category_name: formCategory.category_name,
                description: formCategory.description
            };

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/categories/${editingCategoryId}`, updatedCategory,
                {
                    withCredentials: true,
                }
            );

            setCategories((prevcategories) =>
                prevcategories.map((c) =>
                    c.category_id === editingCategoryId ? { ...c, ...response.data } : c
                )
            );

            handleClose(); // Reset lại modal và form
            fetchcategories();
            toast.success("Đã cập nhật danh mục thành công!");
        } catch (err) {
            console.error("❌ Lỗi khi cập nhật danh mục:", err);
            toast.error("Đã xảy ra lỗi khi lưu chỉnh sửa.");
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingCategoryId(null);
        setFormCategory({
            category_id: "",
            category_name: "",
            description: ""
        });
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

    if (error) {
        return (
            <div className="container mt-4">
                <Alert variant="danger">
                    Error loading categories: {error}
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Quản Lý danh mục sản phẩm</h1>
            <div className="d-flex justify-content-between mb-3">
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Thêm danh mục mới
                </Button>
                <Form className="mb-3 d-flex justify-content-end align-items-center">
                    <Form.Group controlId="searchBar" className="d-flex align-items-center">
                        <Form.Control
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: "700px" }}
                        />
                    </Form.Group>
                </Form>
                <Button variant="info" onClick={fetchcategories} disabled={loading}>
                    <FontAwesomeIcon icon={faSync} className="me-2" />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </Button>
            </div>
            <Table striped bordered hover responsive>
                <thead className="table-dark text-center">
                    <tr>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_name")}>
                            Tên danh mục <FontAwesomeIcon icon={getSortIcon("category_name")} /></th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("description")}>
                            Mô tả danh mục <FontAwesomeIcon icon={getSortIcon("description")} /></th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories
                        .filter((category) =>
                            (category?.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                        ).sort((a, b) => {
                            if (!sortConfig.key) return 0;
                            const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
                            const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

                            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
                            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
                            return 0;
                        })
                        .map((category) => {
                            return (
                                <tr key={category.category_id}>
                                    <td>{category.category_name}</td>
                                    <td>{category.description}</td>
                                    <td className="text-center">
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> Sửa
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(category)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Xóa
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingCategoryId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên danh mục</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="category_name"
                                    placeholder="Nhập tên danh mục sản phẩm"
                                    value={formCategory.category_name}
                                    onChange={(e) => setFormCategory({ ...formCategory, category_name: e.target.value })}
                                />
                            </Form.Group>
                        </Row>
                        <Row>
                            <Form.Group>
                                <Form.Label>Mô tả</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    className="mb-3"
                                    name="description"
                                    placeholder={
                                        formCategory.description.trim() === ""
                                            ? formCategory.category_name.trim() === "" ? "Mô tả danh mục..." : formCategory.category_name
                                            : "Mô tả danh mục..."
                                    }
                                    value={formCategory.description}
                                    onChange={(e) => setFormCategory({ ...formCategory, description: e.target.value })}
                                />
                            </Form.Group>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                    <Button variant="primary" onClick={handleSave}>
                        {editingCategoryId ? "Lưu chỉnh sửa" : "Thêm danh mục"}
                    </Button>
                </Modal.Footer>
            </Modal>

        </div >
    );
}

=======
import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Form, Button, Row, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSort, faSortUp, faSortDown, faEdit, faTrash, faPlus, faSync } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { toast } from 'react-toastify';

function Category() {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formCategory, setFormCategory] = useState({
        category_id: "",
        category_name: "",
        description: ""
    });


    const fetchcategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`, {
                withCredentials: true,
            });
            setCategories(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcategories();
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

    const handleEdit = (category) => {
        setEditingCategoryId(category.category_id);
        setFormCategory({
            category_id: category.category_id,
            category_name: category.category_name,
            description: category.description
        });
        setShowModal(true);
    };

    const handleDelete = async (category) => {
        console.log(`Xóa danh mục ID: ${category.warehouse_id}`);
        if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục: ${category.category_name}?`)) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/categories/${category.category_id}`, {
                    withCredentials: true,
                });
                // Cập nhật lại danh sách danh mục sau khi xóa
                setCategories((prev) => prev.filter(c => c.category_id !== category.category_id));
                toast.success("Đã xóa danh mục thành công!");
                fetchcategories();
            } catch (err) {
                console.error('❌ Chi tiết lỗi khi danh mục:', err);
                toast.error("Đã xảy ra lỗi khi xóa danh mục!");
            }
        }
    };

    const handleSave = () => {
        if (editingCategoryId) {
            handleSaveEdit(); // chỉnh sửa
        } else {
            handleAddCategory(); // thêm mới
        }
    };

    const handleAddCategory = async () => {
        try {
            if (!formCategory.category_name || formCategory.category_name.trim() === "") {
                toast.error("Tên danh mục không được để trống!");
                return;
            }
            if (formCategory.description.trim() === "") {
                formCategory.description = formCategory.category_name;
            }
            const newCategory = { ...formCategory };
            const response = await axios.post("${process.env.REACT_APP_API_URL}/api/categories", newCategory, {
                withCredentials: true,
            });
            setCategories(prev => [...prev, response.data.category]);
            handleClose();
            fetchcategories();
            toast.success(response.data.message);
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Lỗi khi thêm danh mục mới!");
            }
            console.error(err);
        }
    };

    const handleSaveEdit = async () => {
        try {
            const updatedCategory = {
                category_id: formCategory.category_id,
                category_name: formCategory.category_name,
                description: formCategory.description
            };

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/categories/${editingCategoryId}`, updatedCategory,
                {
                    withCredentials: true,
                }
            );

            setCategories((prevcategories) =>
                prevcategories.map((c) =>
                    c.category_id === editingCategoryId ? { ...c, ...response.data } : c
                )
            );

            handleClose(); // Reset lại modal và form
            fetchcategories();
            toast.success("Đã cập nhật danh mục thành công!");
        } catch (err) {
            console.error("❌ Lỗi khi cập nhật danh mục:", err);
            toast.error("Đã xảy ra lỗi khi lưu chỉnh sửa.");
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEditingCategoryId(null);
        setFormCategory({
            category_id: "",
            category_name: "",
            description: ""
        });
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

    if (error) {
        return (
            <div className="container mt-4">
                <Alert variant="danger">
                    Error loading categories: {error}
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h1 className="text-center mb-4">Quản Lý danh mục sản phẩm</h1>
            <div className="d-flex justify-content-between mb-3">
                <Button variant="primary" onClick={() => setShowModal(true)}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Thêm danh mục mới
                </Button>
                <Form className="mb-3 d-flex justify-content-end align-items-center">
                    <Form.Group controlId="searchBar" className="d-flex align-items-center">
                        <Form.Control
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: "700px" }}
                        />
                    </Form.Group>
                </Form>
                <Button variant="info" onClick={fetchcategories} disabled={loading}>
                    <FontAwesomeIcon icon={faSync} className="me-2" />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </Button>
            </div>
            <Table striped bordered hover responsive>
                <thead className="table-dark text-center">
                    <tr>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("category_name")}>
                            Tên danh mục <FontAwesomeIcon icon={getSortIcon("category_name")} /></th>
                        <th style={{ cursor: "pointer" }} onClick={() => handleSort("description")}>
                            Mô tả danh mục <FontAwesomeIcon icon={getSortIcon("description")} /></th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {categories
                        .filter((category) =>
                            (category?.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
                        ).sort((a, b) => {
                            if (!sortConfig.key) return 0;
                            const valA = typeof a[sortConfig.key] === "string" ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
                            const valB = typeof b[sortConfig.key] === "string" ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

                            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
                            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
                            return 0;
                        })
                        .map((category) => {
                            return (
                                <tr key={category.category_id}>
                                    <td>{category.category_name}</td>
                                    <td>{category.description}</td>
                                    <td className="text-center">
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> Sửa
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(category)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Xóa
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingCategoryId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên danh mục</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="category_name"
                                    placeholder="Nhập tên danh mục sản phẩm"
                                    value={formCategory.category_name}
                                    onChange={(e) => setFormCategory({ ...formCategory, category_name: e.target.value })}
                                />
                            </Form.Group>
                        </Row>
                        <Row>
                            <Form.Group>
                                <Form.Label>Mô tả</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    className="mb-3"
                                    name="description"
                                    placeholder={
                                        formCategory.description.trim() === ""
                                            ? formCategory.category_name.trim() === "" ? "Mô tả danh mục..." : formCategory.category_name
                                            : "Mô tả danh mục..."
                                    }
                                    value={formCategory.description}
                                    onChange={(e) => setFormCategory({ ...formCategory, description: e.target.value })}
                                />
                            </Form.Group>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                    <Button variant="primary" onClick={handleSave}>
                        {editingCategoryId ? "Lưu chỉnh sửa" : "Thêm danh mục"}
                    </Button>
                </Modal.Footer>
            </Modal>

        </div >
    );
}

>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
export default Category;