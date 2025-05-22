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
        const primaryKey = log.primary_key_column || Object.keys(JSON.parse(log.old_data || log.new_data))[0];
        const old_data = log.old_data ? JSON.parse(log.old_data) : {};

        let undoQuery = '';
        const request = pool.request();

        if (action_type === 'INSERT') {
            // Undo = XÓA bản ghi vừa thêm
            undoQuery = `DELETE FROM ${table} WHERE ${primaryKey} = @record_id`;
            request.input('record_id', record_id);

        } else if (action_type === 'DELETE') {
            // Undo = THÊM lại bản ghi đã xóa
            const fields = Object.keys(old_data);
            fields.forEach(key => request.input(key, old_data[key]));
            undoQuery = `INSERT INTO ${table} (${fields.join(',')}) VALUES (${fields.map(f => `@${f}`).join(',')})`;

        } else if (action_type === 'UPDATE') {
            // Undo = CẬP NHẬT về trạng thái cũ
            const setClause = Object.keys(old_data).map(key => `${key} = @${key}`).join(', ');
            Object.entries(old_data).forEach(([key, value]) => request.input(key, value));
            request.input('record_id', sql.NVarChar, record_id);
            undoQuery = `UPDATE ${table} SET ${setClause} WHERE ${primaryKey} = @record_id`;
        } else {
            return res.status(400).json({ error: 'Không hỗ trợ loại thao tác này' });
        }

        await request.query(undoQuery);
        return res.json({ success: true, message: 'Hoàn tác thành công' });

    } catch (err) {
        console.error('Lỗi khi hoàn tác:', err);
        return res.status(500).json({ error: 'Lỗi server khi hoàn tác' });
    }
});
module.exports = router;
