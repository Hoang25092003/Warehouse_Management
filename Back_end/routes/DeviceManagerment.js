const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {setSessionContext } = require('../middleware/setSessionContext');
const { v4: uuidv4 } = require('uuid');

router.get('/devices', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
          SELECT * FROM Devices ORDER BY device_id
        `);
        res.json(result.recordset);
    } catch (error) {
        console.log("Lỗi khi lấy dữ liệu thiết bị:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách thiết bị" });
    }
});

router.post('/devices', authenticateToken, setSessionContext, async (req, res) => {
    try {
        const { device_id, device_name, device_type, device_description } = req.body;

        const pool = getPool();
        await pool.request()
            .input('device_id', device_id)
            .input('device_name', device_name)
            .input('device_type', device_type)
            .input('device_description', device_description)
            .query(`
                INSERT INTO Devices (device_id, device_name, device_type, device_description) VALUES
                (@device_id, @device_name, @device_type, @device_description)
            `);
        res.status(201).json({ message: "Đã thêm thiết bị thành công" });
    } catch (error) {
        console.log("Lỗi khi thêm thiết bị:", error);
        res.status(500).json({ error: "Lỗi server khi thêm thiết bị" });
    }
});

router.put('/devices/:id', authenticateToken, setSessionContext, async (req, res) => {
    const { id } = req.params;
    const { device_name, device_type, device_description } = req.body;
    try {
        const pool = getPool();
        await pool.request()
            .input('device_id', id)
            .input('device_name', device_name)
            .input('device_type', device_type)
            .input('device_description', device_description)
            .query(`
                UPDATE Devices
                SET device_name = @device_name, device_type = @device_type, device_description = @device_description
                WHERE device_id = @device_id
            `);
        res.json({ message: "Đã cập nhật thiết bị thành công" });
    } catch (error) {
        console.log("Lỗi khi cập nhật thiết bị:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật thiết bị" });
    }
});

router.delete('/devices/:id', authenticateToken, setSessionContext, async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
        await pool.request()
            .input('device_id', id)
            .query(`
                DELETE FROM Devices
                WHERE device_id = @device_id
            `);
        res.json({ message: "Đã xóa thiết bị thành công" });
    } catch (error) {
        console.log("Lỗi khi xóa thiết bị:", error);
        res.status(500).json({ error: "Lỗi server khi xóa thiết bị" });
    }
});

// Lấy danh sách phân quyền
router.get('/devicesAuth', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
          SELECT * FROM DevicesAuthorization
        `);
        res.json(result.recordset);
    } catch (error) {
        console.log("Lỗi khi lấy danh sách phân quyền:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách phân quyền" });
    }
});

router.put('/devicesAuth/:id', authenticateToken, setSessionContext, async (req, res) => {
    const { id } = req.params;
    const { device_id, user_id } = req.body;
    try {
        const pool = getPool();
        await pool.request()
            .input('DA_id', id)
            .input('device_id', device_id)
            .input('assigned_userID', user_id)
            .query(`
                UPDATE DevicesAuthorization
                SET device_id = @device_id, assigned_userID = @assigned_userID
                WHERE DA_id = @DA_id
            `);
        res.json({ message: "Đã cập nhật thiết bị thành công" });
    } catch (error) {
        console.log("Lỗi khi cập nhật phân quyền:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật phân quyền" });
    }
});

router.delete('/devicesAuth/:id', authenticateToken, setSessionContext, async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
        await pool.request()
            .input('DA_id', id)
            .query(`
                DELETE FROM DevicesAuthorization
                WHERE DA_id = @DA_id
            `);
        res.json({ message: "Đã xóa phân quyền thành công" });
    } catch (error) {
        console.log("Lỗi khi xóa phân quyền:", error);
        res.status(500).json({ error: "Lỗi server khi xóa phân quyền" });
    }
});

const generateDeviceAuthId = () => {
    const shortUuid = uuidv4().replace(/-/g, '').slice(0, 12); // Lấy 12 ký tự đầu tiên
    return `DA-${shortUuid}`;
};

router.post('/devicesAuth', authenticateToken, setSessionContext, async (req, res) => {
    try {
        const { device_id, user_id } = req.body;
        const pool = getPool();
        await pool.request()
            .input("DA_id", generateDeviceAuthId())
            .input('device_id', device_id)
            .input('assigned_userID', user_id)
            .query(`
                INSERT INTO DevicesAuthorization (DA_id, device_id, assigned_userID) VALUES
                (@DA_id, @device_id, @assigned_userID)
            `);
        res.status(201).json({ message: "Đã thêm phân quyền thành công" });
    } catch (error) {
        console.log("Lỗi khi thêm phân quyền:", error);
        res.status(500).json({ error: "Lỗi server khi thêm phân quyền" });
    }
});

// Lấy danh sách người dùng
router.get('/assign_users', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
          SELECT [User].user_id, [User].fullname FROM [User] ORDER BY username
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách người dùng" });
    }
});
module.exports = router;
