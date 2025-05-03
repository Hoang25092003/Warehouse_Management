import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Lấy token từ cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/profile", {
          method: "GET",
          credentials: "include", // Quan trọng để gửi cookie
        });

        if (!res.ok) throw new Error("Không hợp lệ");

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.log("Không thể lấy thông tin người dùng:", err);
        setUser(null);
      } finally {
        setLoading(false); // Kết thúc gọi API
      }
    };

    fetchUser();
  }, [user]);

  if (loading) return <div>Đang kiểm tra đăng nhập...</div>;

  // Chưa đăng nhập
  if (!user) {
    console.log("Không thể đăng nhập");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;