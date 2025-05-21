const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {setSessionContext } = require('../middleware/setSessionContext');

// Lấy danh sách sản phẩm
router.get('/UserInfo/:user_id', authenticateToken, async (req, res) => {
    const { user_id } = req.params;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input("user_id", user_id)
            .query(`
      SELECT [User].username, [User].[password], [User].fullname, [User].phone, [User].email 
      FROM [User]
      WHERE [User].user_id = @user_id
    `);
        res.json(result.recordset);
    } catch (error) {
        console.log("Lỗi khi lấy thông tin người dùng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy thông tin người dùng" });
    }
});

router.put('/UserInfo', authenticateToken, setSessionContext, async (req, res) => {
    const { fullname, email, phone } = req.body;
    const user_id = req.user.user_id;

    try {
        const pool = getPool();
        await pool.request()
            .input("fullname", fullname)
            .input("email", email)
            .input("phone", phone)
            .input("user_id", user_id)
            .query(`
          UPDATE [User]
          SET fullname = @fullname, email = @email, phone = @phone
          WHERE user_id = @user_id
        `);

        res.status(200).json({ message: "Thông tin người dùng đã được cập nhật!" });
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin người dùng:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật thông tin người dùng" });
    }
});

router.put('/AccountInfo', authenticateToken, setSessionContext, async (req, res) => {
    const { username, password } = req.body;
    const user_id = req.user.user_id; 

    try {
        const pool = getPool();
        await pool.request()
            .input("username", username)
            .input("password", password)
            .input("user_id", user_id)
            .query(`
          UPDATE [User]
          SET username = @username, password = @password
          WHERE user_id = @user_id
        `);

        res.status(200).json({ message: "Thông tin tài khoản đã được cập nhật!" });
    } catch (error) {
        console.error("Lỗi khi cập nhật thông tin tài khoản:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật thông tin tài khoản" });
    }
});


module.exports = router;
