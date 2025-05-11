// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
const { authenticateToken, SECRET_KEY } = require('../middleware/auth');

// Đăng nhập
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Vui lòng nhập username và password' });

  try {
    const pool = getPool();
    const request = pool.request();
    request.input('username', sql.VarChar, username);
    const result = await request.query('SELECT * FROM [User] WHERE username = @username');

    if (result.recordset.length === 0)
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });

    const user = result.recordset[0];
    if (password !== user.password)
      return res.status(401).json({ error: 'Mật khẩu không đúng' });

    const token = jwt.sign({
      user_id: user.user_id,
      username: user.username,
      fullname: user.fullname,
      role: user.role || 'staff'
    }, SECRET_KEY, { expiresIn: '8h' });

    // Gửi token vào cookie
    res.cookie('token', token, {
      httpOnly: true,
      // secure: false,             // Bật nếu dùng HTTPS
      // secure: process.env.NODE_ENV === 'production', // Đảm bảo chỉ bật secure khi môi trường là production
      // sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 giờ
    });

    res.json({
      message: 'Đăng nhập thành công',
      user: {
        user_id: user.user_id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role || 'staff'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Đăng xuất
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    // secure: false,       // Phải khớp với cấu hình ban đầu
    // sameSite: 'Strict'  // Khớp với lúc login
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });

  res.json({ message: 'Đăng xuất thành công' });
});

router.get('/profile', authenticateToken, (req, res) => {
  const user = req.user;
  res.json({user});
});

module.exports = router;
