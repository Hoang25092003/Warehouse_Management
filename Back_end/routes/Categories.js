const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const setSessionContext = require('../middleware/setSessionContext');

// Lấy danh sách danh mục
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM Category ORDER BY category_name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu danh mục sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách danh mục sản phẩm" });
  }
});

// Thêm danh mục mới
router.post('/categories', authenticateToken, setSessionContext, async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const category_id = 'CAT-' + Date.now().toString().slice(-6);

    const pool = getPool();

    const response = await pool.request()
    .input("category_name", category_name)
    .query(`
      SELECT * FROM Category WHERE category_name = @category_name
      `);
    if (response.recordset.length > 0){
      return res.status(400).json({ message: "Danh mục đã tồn tại!" });
    }
    
    await pool.request()
      .input('category_id', category_id)
      .input('category_name', category_name)
      .input('description', description)
      .query(`
        INSERT INTO Category (category_id, category_name, description) VALUES
        (@category_id, @category_name, @description)
      `);
      res.status(201).json({ 
        message: "Đã thêm danh mục thành công", 
        category: { category_id, category_name, description }
      });
  } catch (error) {
    console.error("Lỗi khi thêm danh mục:", error);
    res.status(500).json({ error: "Lỗi server khi thêm danh mục" });
  }
});

// Cập nhật danh mục
router.put('/categories/:id', authenticateToken, setSessionContext, async (req, res) => {
  const { id } = req.params;
  const { category_name, description } = req.body;
  try {
    const pool = getPool();
    await pool.request()
      .input('category_id', id)
      .input('category_name', category_name)
      .input('description', description)
      .query(`
        UPDATE Category
        SET category_name = @category_name, description = @description
        WHERE category_id = @category_id
      `);
    res.json({ message: "Đã cập nhật danh mục thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật danh mục" });
  }
});

// Xóa danh mục
router.delete('/categories/:id', authenticateToken, setSessionContext, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.request()
      .input('category_id', id)
      .query(`
        DELETE FROM Category WHERE category_id = @category_id
      `);
    res.json({ message: "Đã xóa danh mục thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa danh mục:", error);
    res.status(500).json({ error: "Lỗi server khi xóa danh mục" });
  }
});

module.exports = router;
