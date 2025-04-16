import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  let user = null;

  if (token) {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      user = JSON.parse(decodedPayload);
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
      localStorage.removeItem("token");
    }
  }

  // Chưa đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role nếu có yêu cầu
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Nếu là staff thì chuyển về displayProducts
    if (user.role === 'staff') {
      return <Navigate to="/displayProducts" replace />;
    }
    // Admin thì về trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;