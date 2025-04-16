import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LogIn.css';

const LogIn = () => {
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      // Kiểm tra response status trước khi parse JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Lỗi đăng nhập (HTTP ${response.status})`);
        return;
      }

      const data = await response.json();

      // Kiểm tra cấu trúc data trước khi sử dụng
      if (!data || !data.user || !data.token) {
        setError('Dữ liệu trả về không hợp lệ');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Chuyển hướng theo role
      if (data.user.role === 'staff') {
        navigate('/displayProducts');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Lỗi kết nối:', err);
      setError(err.message.includes('Failed to fetch')
        ? 'Không thể kết nối đến máy chủ'
        : 'Đã xảy ra lỗi khi đăng nhập');
    }
  };

  const handlePasswordRecovery = (e) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setError('Vui lòng nhập email để khôi phục mật khẩu');
      return;
    }
    alert(`Hướng dẫn khôi phục mật khẩu đã được gửi đến email: ${recoveryEmail}`);
    setIsRecoveringPassword(false);
    setRecoveryEmail('');
    setError('');
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser(decoded);
      } catch (error) {
        console.error("Token không hợp lệ:", error);
        localStorage.removeItem("token");
      }
    }
  }, []);


  return (
    <div className="login-container">
      <form
        className="login-form"
        onSubmit={isRecoveringPassword ? handlePasswordRecovery : handleSubmit}
      >
        <h2>{isRecoveringPassword ? 'Khôi Phục Mật Khẩu' : 'Đăng Nhập'}</h2>

        {!isRecoveringPassword ? (
          <>
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <div className="form-group remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">Nhớ tài khoản</label>
            </div>
          </>
        ) : (
          <div className="form-group">
            <label htmlFor="recoveryEmail">Email khôi phục</label>
            <input
              type="email"
              id="recoveryEmail"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              required
            />
          </div>
        )}

        <button type="submit" className="login-button">
          {isRecoveringPassword ? 'Gửi yêu cầu' : 'Đăng Nhập'}
        </button>

        <div className="forgot-password">
          {!isRecoveringPassword ? (
            <button onClick={() => setIsRecoveringPassword(true)}>
              Quên mật khẩu?
            </button>
          ) : (
            <button onClick={() => setIsRecoveringPassword(false)}>
              Quay lại đăng nhập
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LogIn;
