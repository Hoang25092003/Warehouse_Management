const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {setSessionContext } = require('../middleware/setSessionContext');

// Lấy danh sách tài khoản
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
          SELECT * FROM [User] ORDER BY username
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách tài khoản:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách tài khoản" });
    }
});

// Tạo tài khoản
router.post('/users', authenticateToken, setSessionContext, async (req, res) => {
    const { username, email, password, role, fullname, phone } = req.body;

    try {
        const pool = getPool();

        const user_id = 'USER-' + Date.now().toString().slice(-6);
        await pool.request()
            .input('user_id', user_id)
            .input('username', username)
            .input('email', email)
            .input('password', password)
            .input('fullname', fullname)
            .input('phone', phone)
            .input('role', role)
            .query(`
            INSERT INTO [User] (
              user_id, username, email, [password], fullname, phone, role) VALUES (
              @user_id, @username, @email, @password, @fullname, @phone, @role)
          `);

        res.status(201).json({ message: "Đã thêm tài khoản thành công" });
    } catch (error) {
        console.error("Lỗi khi tạo tài khoản:", error);
        res.status(500).json({ error: "Lỗi server khi tạo tài khoản" });
    }
});

// Cập nhật tài khoản
router.put('/users/:id', authenticateToken, setSessionContext, async (req, res) => {
    const user_id = req.params.id;
    const { username, password, fullname, phone, email, role } = req.body;

    try {
        const pool = getPool();
        await pool.request()
            .input('user_id', user_id)
            .input('username', username)
            .input('password', password)
            .input('fullname', fullname)
            .input('phone', phone)
            .input('email', email)
            .input('role', role)
            .query(`
                UPDATE [User]
                SET username = @username, password = @password, fullname = @fullname,
                    phone = @phone, email = @email, role = @role
                WHERE user_id = @user_id`);

        res.json({ message: "Đã cập nhật tài khoản thành công" });
    } catch (error) {
        console.error("Lỗi khi cập nhật tài khoản:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật tài khoản" });
    }
});

//Xóa tài khoản
router.delete('/users/:id', authenticateToken, setSessionContext, async (req, res) => {
    const user_id = req.params.id;

    try {
        const pool = getPool();
        // Không cho xóa tài khoản admin
        const isAdmin = await pool.request()
            .input('user_id', user_id)
            .query(`SELECT 1 FROM [User] WHERE user_id = @user_id AND role = 'admin'`);

        if (isAdmin.recordset.length > 0) {
            return res.status(400).json({ error: "Không thể xóa tài khoản admin" });
        }

        // Xóa user
        await pool.request()
            .input('user_id', user_id)
            .query('DELETE FROM [User] WHERE user_id = @user_id');

            res.json({ message: "Đã xóa tài khoản thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa tài khoản:", error);
        res.status(500).json({ error: "Lỗi server khi xóa tài khoản" });
    }
});

module.exports = router;
