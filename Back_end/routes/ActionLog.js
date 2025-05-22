const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/actionLog', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
          SELECT ActionLog.*, [User].fullname, [User].username FROM ActionLog
        INNER JOIN [User] ON ActionLog.user_id = [User].user_id
        ORDER BY action_time DESC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.log("Lỗi khi lấy log:", error);
        res.status(500).json({ error: "Lỗi server khi lấy log" });
    }
});


module.exports = router;
