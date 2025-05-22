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

router.get('/search_actionLog', authenticateToken, async (req, res) => {
    const { action_type, user_id, start_date, end_date } = req.query;
    try {
        const pool = getPool();
        const request = pool.request();

        if (action_type) request.input('action_type', action_type);
        if (user_id) request.input('user_id', user_id);
        if (start_date) request.input('start_date', start_date);
        if (end_date) request.input('end_date', end_date);

        let query = `SELECT * FROM ActionLog WHERE 1=1`;

        if (action_type) query += ` AND action_type = @action_type`;
        if (user_id) query += ` AND user_id = @user_id`;
        if (start_date && end_date) {
            query += ` AND action_time BETWEEN @start_date AND @end_date`;
        }

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
        const log = await pool.request()
            .input('log_id', log_id)
            .query('SELECT * FROM ActionLog WHERE log_id = @log_id');

        if (!log.recordset.length) {
            return res.status(404).json({ error: 'Không tìm thấy log' });
        }

        const record = log.recordset[0];
        const table = record.table_name;
        const id = record.record_id;
        const type = record.action_type;
        const oldData = JSON.parse(record.old_data || '{}');

        const request = pool.request();

        if (type === 'INSERT') {
            await request.query(`DELETE FROM ${table} WHERE id = '${id}'`);
        } else if (type === 'DELETE') {
            const fields = Object.keys(oldData).join(', ');
            const values = Object.values(oldData).map(v => `'${v}'`).join(', ');
            await request.query(`INSERT INTO ${table} (${fields}) VALUES (${values})`);
        } else if (type === 'UPDATE') {
            const setClause = Object.entries(oldData).map(([key, val]) => `${key}='${val}'`).join(', ');
            await request.query(`UPDATE ${table} SET ${setClause} WHERE id = '${id}'`);
        }

        res.json({ success: true, message: 'Hoàn tác thành công' });
    } catch (err) {
        console.error("Lỗi khi hoàn tác:", err);
        res.status(500).json({ error: 'Lỗi server khi hoàn tác' });
    }
});
module.exports = router;
