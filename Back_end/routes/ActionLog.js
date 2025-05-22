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
        ORDER BY action_time ASC
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

router.post('/undo_action', authenticateToken, async (req, res) => {
    const { log_id } = req.body;

    try {
        const pool = getPool();

        // Lấy thông tin từ log
        const result = await pool.request()
            .input('log_id', sql.Int, log_id)
            .query(`SELECT * FROM ActionLog WHERE log_id = @log_id`);

        if (!result.recordset.length) {
            return res.status(404).json({ error: 'Không tìm thấy log' });
        }

        const log = result.recordset[0];
        const table = log.table_name;
        const record_id = log.record_id;
        const action_type = log.action_type;
        const old_data = log.old_data ? JSON.parse(log.old_data) : {};
        const new_data = log.new_data ? JSON.parse(log.new_data) : {};

        let query = '';

        if (action_type === 'INSERT') {
            // Undo = XÓA bản ghi vừa thêm
            query = `DELETE FROM ${table} WHERE ${Object.keys(new_data)[0]} = '${record_id}'`;

        } else if (action_type === 'DELETE') {
            // Undo = THÊM lại bản ghi đã xóa
            const fields = Object.keys(old_data).join(', ');
            const values = Object.values(old_data).map(v => `'${v}'`).join(', ');
            query = `INSERT INTO ${table} (${fields}) VALUES (${values})`;

        } else if (action_type === 'UPDATE') {
            // Undo = CẬP NHẬT về trạng thái cũ
            const setClause = Object.entries(old_data).map(([key, val]) => `${key}='${val}'`).join(', ');
            query = `UPDATE ${table} SET ${setClause} WHERE ${Object.keys(old_data)[0]} = '${record_id}'`;
        }

        if (!query) return res.status(400).json({ error: 'Không thể tạo truy vấn Undo' });

        await pool.request().query(query);

        return res.json({ success: true, message: 'Hoàn tác thành công' });

    } catch (err) {
        console.error('Lỗi khi hoàn tác:', err);
        return res.status(500).json({ error: 'Lỗi server khi hoàn tác' });
    }
});
module.exports = router;
