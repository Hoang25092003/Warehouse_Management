const { getPool, sql } = require('../config/db');

async function setSessionContext(req, res, next) {
  try {
    if (!req.user || !req.user.user_id) return next();

    const userId = req.user.user_id;

    const pool = getPool();
    await pool.request()
      .input('user_id', sql.VarChar, userId)  // nhớ phải có sql.VarChar hoặc kiểu dữ liệu tương ứng
      .query(`EXEC sp_set_session_context 'user_id', @user_id`);
  } catch (err) {
    console.error('[SetSessionContext] Lỗi khi gán user_id vào session context:', err.message);
  }
  next();
}

module.exports = setSessionContext;
