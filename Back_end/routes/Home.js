const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Thống kê danh mục và tổng số lượng sản phẩm
    const categoryQuery = `
      SELECT 
        c.category_id,
        c.category_name,
        COALESCE(SUM(p.quantity), 0) AS total_quantity
      FROM Category c
      LEFT JOIN Products p ON c.category_id = p.category_id
      GROUP BY c.category_id, c.category_name
    `;

    // Thống kê kho
    const warehouseQuery = `
      SELECT 
        warehouse_id,
        name AS warehouse_name,
        capacity,
        current_capacity,
        status
      FROM Warehouse
    `;

    // Tổng số sản phẩm
    const productsCountQuery = 'SELECT COUNT(*) AS total FROM Products';

    // Tổng số kho
    const warehouseCountQuery = 'SELECT COUNT(*) AS total FROM Warehouse';

    // Nhập hàng trong ngày
    const importsTodayQuery = `
      SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(total_quantity), 0) AS total
      FROM Import
      WHERE CAST(import_date AS DATE) = '${today}'
    `;

    // Xuất hàng trong ngày
    const exportsTodayQuery = `
      SELECT 
        COUNT(*) AS count,
        COALESCE(SUM(total_quantity), 0) AS total
      FROM Export
      WHERE CAST(export_date AS DATE) = '${today}'
    `;

    const [
      categoryResult,
      warehouseResult,
      productsCountResult,
      warehouseCountResult,
      importsTodayResult,
      exportsTodayResult
    ] = await Promise.all([
      pool.request().query(categoryQuery),
      pool.request().query(warehouseQuery),
      pool.request().query(productsCountQuery),
      pool.request().query(warehouseCountQuery),
      pool.request().query(importsTodayQuery),
      pool.request().query(exportsTodayQuery)
    ]);

    res.json({
      categoryStats: categoryResult.recordset,
      warehouseStats: warehouseResult.recordset,
      totalProducts: productsCountResult.recordset[0].total,
      totalWarehouses: warehouseCountResult.recordset[0].total,
      todayImports: importsTodayResult.recordset[0].total || 0,
      todayExports: exportsTodayResult.recordset[0].total || 0,
      todayImportsCount: importsTodayResult.recordset[0].count || 0,
      todayExportsCount: exportsTodayResult.recordset[0].count || 0
    });

  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu dashboard" });
  }
});

module.exports = router;
