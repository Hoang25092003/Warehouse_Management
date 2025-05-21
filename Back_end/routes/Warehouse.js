const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const setSessionContext = require('../middleware/setSessionContext');

// Lấy danh sách kho
router.get('/warehouses', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT * FROM Warehouse ORDER BY name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu kho hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách kho" });
  }
});

// Thêm kho mới
router.post('/warehouses', authenticateToken, setSessionContext, async (req, res) => {
  try {
    const { name, location, capacity, current_capacity, status } = req.body;
    const warehouse_id = 'WH-' + Date.now().toString().slice(-6);

    const pool = getPool();
    await pool.request()
      .input('warehouse_id', warehouse_id)
      .input('name', name)
      .input('location', location)
      .input('capacity', capacity)
      .input('current_capacity', current_capacity)
      .input('status', status)
      .query(`
        INSERT INTO Warehouse (warehouse_id, name, location, capacity, current_capacity, status)
        VALUES (@warehouse_id, @name, @location, @capacity, @current_capacity, @status)
      `);
    res.status(201).json({ message: "Đã thêm kho thành công" });
  } catch (error) {
    console.error("Lỗi khi thêm kho:", error);
    res.status(500).json({ error: "Lỗi server khi thêm kho" });
  }
});

// Cập nhật kho
router.put('/warehouses/:id', authenticateToken, setSessionContext, async (req, res) => {
  const { id } = req.params;
  const { name, location, capacity, status } = req.body;
  try {
    const pool = getPool();
    await pool.request()
      .input('warehouse_id', id)
      .input('name', name)
      .input('location', location)
      .input('capacity', capacity)
      .input('status', status)
      .query(`
        UPDATE Warehouse
        SET name = @name, location = @location, capacity = @capacity, status = @status
        WHERE warehouse_id = @warehouse_id
      `);
    res.json({ message: "Đã cập nhật kho thành công" });
  } catch (error) {
    console.error("Lỗi khi cập nhật kho:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật kho" });
  }
});

// Xóa kho
router.delete('/warehouses/:id', authenticateToken, setSessionContext, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.request()
      .input('warehouse_id', id)
      .query(`
        DELETE FROM Warehouse WHERE warehouse_id = @warehouse_id
      `);
    res.json({ message: "Đã xóa kho thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa kho:", error);
    res.status(500).json({ error: "Lỗi server khi xóa kho" });
  }
});

module.exports = router;
