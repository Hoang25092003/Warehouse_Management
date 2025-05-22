const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
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

router.get('/search_actionLog', authenticateToken, async (req, res) => {
    const { action_type, user_id, start_date, end_date } = req.query;

    try {
        const pool = getPool();
        const request = pool.request();

        if (action_type) request.input('action_type', action_type);
        if (user_id) request.input('user_id', user_id);
        if (start_date) request.input('start_date', start_date);
        if (end_date) request.input('end_date', end_date);

        let query = `
            SELECT ActionLog.*, [User].fullname, [User].username 
            FROM ActionLog 
            INNER JOIN [User] ON ActionLog.user_id = [User].user_id 
            WHERE 1=1`;

        if (action_type) query += ` AND action_type = @action_type`;
        if (user_id) query += ` AND ActionLog.user_id = @user_id`;

        if (start_date && end_date) {
            query += ` AND action_time BETWEEN @start_date AND @end_date`;
        } else if (start_date) {
            query += ` AND action_time >= @start_date`;
        } else if (end_date) {
            query += ` AND action_time <= @end_date`;
        }

        query += ` ORDER BY action_time ASC`;

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.log("Lỗi khi tìm kiếm log:", error);
        res.status(500).json({ error: "Lỗi server khi tìm kiếm log" });
    }
});
module.exports = router;
