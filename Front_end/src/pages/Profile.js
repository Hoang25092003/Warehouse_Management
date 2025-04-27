import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Form, Card, Tabs, Tab } from "react-bootstrap";
import axios from "axios";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

const Profile = () => {
    const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
    const [isEditingAccountInfo, setIsEditingAccountInfo] = useState(false);
    const [userInfo, setUserInfo] = useState({
        fullname: "",
        email: "",
        phone: "",
    });
    const [accountInfo, setAccountInfo] = useState({
        username: "",
        password: "",
        confirmPassword: "",
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserInfor = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("Bạn chưa đăng nhập!");
                }

                const payload = token.split(".")[1];
                const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
                const decodedPayload = decodeURIComponent(escape(atob(base64)));
                const userData = JSON.parse(decodedPayload);
                const response = await axios.get(`http://localhost:3000/api/UserInfo/${userData.user_id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const infor = response.data[0];
                setUserInfo({
                    fullname: infor.fullname || "",
                    email: infor.email || "",
                    phone: infor.phone || "",
                });
                setAccountInfo({
                    username: infor.username || "",
                    password: infor.password,
                    confirmPassword: "",
                });
            } catch (error) {
                console.error("Lỗi khi lấy thông tin người dùng:", error);
                if (error.response?.status === 401) {
                    alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
                    localStorage.removeItem("token");
                    navigate("/login");
                }
            }
        };

        fetchUserInfor();
    }, []);


    const handleInputChange = (e, type) => {
        const { name, value } = e.target;
        if (type === "userInfo") {
            setUserInfo((prev) => ({ ...prev, [name]: value }));
        } else if (type === "accountInfo") {
            setAccountInfo((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveUserInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Bạn chưa đăng nhập!");
            }

            const response = await axios.put(
                `http://localhost:3000/api/UserInfo`,
                { ...userInfo },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                toast.success("Thông tin người dùng đã được cập nhật thành công!");
                setIsEditingUserInfo(false);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin người dùng:", error);
            toast.error("Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.");
        }
    };

    const handleSaveAccountInfo = async () => {
        try {
            if (accountInfo.password !== accountInfo.confirmPassword) {
                toast.warn("Mật khẩu và xác nhận mật khẩu không khớp!");
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Bạn chưa đăng nhập!");
            }

            const response = await axios.put(
                `http://localhost:3000/api/AccountInfo`,
                {
                    username: accountInfo.username,
                    password: accountInfo.password,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                toast.success("Thông tin tài khoản đã được cập nhật thành công!");
                setIsEditingAccountInfo(false);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin tài khoản:", error);
            toast.error("Không thể cập nhật thông tin tài khoản. Vui lòng thử lại sau.");
        }
    };


    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="p-4 shadow">
                        <h3 className="text-center">Hồ Sơ Cá Nhân</h3>
                        <Tabs defaultActiveKey="userInfo" className="mb-3">
                            {/* Tab Thông tin người dùng */}
                            <Tab eventKey="userInfo" title="Thông tin người dùng">
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Họ và tên</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="fullname"
                                            value={userInfo.fullname}
                                            onChange={(e) => handleInputChange(e, "userInfo")}
                                            disabled={!isEditingUserInfo}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={userInfo.email}
                                            onChange={(e) => handleInputChange(e, "userInfo")}
                                            disabled={!isEditingUserInfo}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Số điện thoại</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="phone"
                                            value={userInfo.phone}
                                            onChange={(e) => handleInputChange(e, "userInfo")}
                                            disabled={!isEditingUserInfo}
                                        />
                                    </Form.Group>
                                    {!isEditingUserInfo ? (
                                        <Button variant="primary" onClick={() => setIsEditingUserInfo(true)}>
                                            Chỉnh sửa
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="success" className="me-2" onClick={handleSaveUserInfo}>
                                                Lưu
                                            </Button>
                                            <Button variant="secondary" onClick={() => setIsEditingUserInfo(false)}>
                                                Hủy
                                            </Button>
                                        </>
                                    )}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Button
                                            variant="danger"
                                            onClick={() => navigate("/")}
                                            className="ms-auto"
                                        >
                                            Trở về trang chủ
                                        </Button>
                                    </div>
                                </Form>
                            </Tab>

                            {/* Tab Thông tin tài khoản */}
                            <Tab eventKey="accountInfo" title="Thông tin tài khoản">
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tên đăng nhập</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="username"
                                            value={accountInfo.username}
                                            onChange={(e) => handleInputChange(e, "accountInfo")}
                                            disabled={!isEditingAccountInfo}
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Mật khẩu</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={accountInfo.password}
                                            onChange={(e) => handleInputChange(e, "accountInfo")}
                                            disabled={!isEditingAccountInfo}
                                        />
                                    </Form.Group>
                                    {!isEditingAccountInfo ? (
                                        <Button variant="primary" onClick={() => setIsEditingAccountInfo(true)}>
                                            Chỉnh sửa
                                        </Button>
                                    ) : (
                                        <>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Xác nhận mật khẩu</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={accountInfo.confirmPassword}
                                                    onChange={(e) => handleInputChange(e, "accountInfo")}
                                                    disabled={!isEditingAccountInfo}
                                                />
                                            </Form.Group>
                                            <Button variant="success" className="me-2" onClick={handleSaveAccountInfo}>
                                                Lưu
                                            </Button>
                                            <Button variant="secondary" onClick={() => setIsEditingAccountInfo(false)}>
                                                Hủy
                                            </Button>
                                        </>
                                    )}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Button
                                            variant="danger"
                                            onClick={() => navigate("/")}
                                            className="ms-auto"
                                        >
                                            Trở về trang chủ
                                        </Button>
                                    </div>
                                </Form>
                            </Tab>
                        </Tabs>
                    </Card>
                </Col>
            </Row>
        </Container >
    );
};

export default Profile;
