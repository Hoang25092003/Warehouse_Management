import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  let user = null;

  if (token) {
    try {

      const payload = token.split('.')[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/'); // sửa lỗi định dạng base64url
      const decodedPayload = atob(base64);
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

  return children;
};

export default ProtectedRoute;