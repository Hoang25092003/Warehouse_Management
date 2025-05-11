<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import { Spinner} from "react-bootstrap";
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Lấy token từ cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
          method: "GET",
          credentials: "include", // Quan trọng để gửi cookie
        });

        if (!res.ok) throw new Error("Không hợp lệ");

        const data = await res.json();
        if (data.user && data.user.user_id) {
          localStorage.setItem('user_id', data.user.user_id); // Lưu user_id vào localStorage
        }
        setUser(data.user);
      } catch (err) {
        console.log("Không thể lấy thông tin người dùng:", err);
        setUser(null);
      } finally {
        setLoading(false); // Kết thúc gọi API
      }
    };

    fetchUser();
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

  // Chưa đăng nhập
  if (!user) {
    console.log("Không thể đăng nhập");
    return <Navigate to="/login" replace />;
  }

  return children;
};

=======
import React, { useEffect, useState } from 'react';
import { Spinner} from "react-bootstrap";
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Lấy token từ cookie
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/profile`, {
          method: "GET",
          credentials: "include", // Quan trọng để gửi cookie
        });

        if (!res.ok) throw new Error("Không hợp lệ");

        const data = await res.json();
        if (data.user && data.user.user_id) {
          localStorage.setItem('user_id', data.user.user_id); // Lưu user_id vào localStorage
        }
        setUser(data.user);
      } catch (err) {
        console.log("Không thể lấy thông tin người dùng:", err);
        setUser(null);
      } finally {
        setLoading(false); // Kết thúc gọi API
      }
    };

    fetchUser();
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

  // Chưa đăng nhập
  if (!user) {
    console.log("Không thể đăng nhập");
    return <Navigate to="/login" replace />;
  }

  return children;
};

>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
export default ProtectedRoute;