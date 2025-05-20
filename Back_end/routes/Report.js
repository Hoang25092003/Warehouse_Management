const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
////////////////////////////////////////////////////TẠO BÁO CÁO////////////////////////////////////////////////////////
// Báo cáo nhập hàng
router.get('/reports/imports', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        Import.*,
        [User].[fullname] as fullname
      FROM Import 
      JOIN [User] ON Import.[user_id] = [User].[user_id]
      JOIN Warehouse ON Import.warehouse_id = Warehouse.warehouse_id
      ORDER BY Import.import_date DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo nhập hàng" });
  }
});

// Báo cáo xuất hàng
router.get('/reports/exports', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        Export.*,
        [User].[fullname] as fullname
      FROM Export 
      JOIN [User] ON Export.[user_id] = [User].[user_id]
      ORDER BY Export.export_date DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo xuất hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo xuất hàng" });
  }
});

// Báo cáo tồn kho
router.get('/reports/inventory', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT Inventory.*, Warehouse.name as warehouse_name, Products.name as product_name
    FROM Inventory
    INNER JOIN Warehouse ON Inventory.warehouse_id = Warehouse.warehouse_id
    INNER JOIN Products ON Products.product_id = Inventory.product_id
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo tồn kho:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo tồn kho" });
  }
});
////////////////////////////////////////////////////TẢI BÁO CÁO////////////////////////////////////////////////////////
// Lấy danh sách báo cáo đã lưu
router.get('/savedreports', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT Report.*, [User].fullname as user_name 
      FROM Report
      LEFT JOIN [User] ON Report.user_id = [User].user_id
      ORDER BY Report.generated_date DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách báo cáo:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách báo cáo" });
  }
});

// Lưu báo cáo mới
router.post('/reports', authenticateToken, async (req, res) => {
  try {
    const { report_type, user_id, content } = req.body;
    const report_id = 'REP-' + Date.now().toString().slice(-6);

    const pool = getPool();
    await pool.request()
      .input('report_id', report_id)
      .input('report_type', report_type)
      .input('user_id', user_id)
      .input('content', content)
      .query(`
        INSERT INTO Report (report_id, report_type, user_id, content)
        VALUES (@report_id, @report_type, @user_id, @content)
      `);

    res.json({ success: true, report_id });
  } catch (error) {
    console.error("Lỗi khi lưu báo cáo:", error);
    res.status(500).json({ error: "Lỗi server khi lưu báo cáo" });
  }
});

// Báo cáo chi tiết nhập hàng
router.post('/import_detail/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID chi tiết báo cáo nhập hàng: ", id);
    const pool = getPool();
    const result = await pool.request()
      .input("report_id", id)
      .query(`
      SELECT 
          ID.import_detail_id,
          ID.import_id,
          ID.barcode,
          ID.quantity AS quantity_detail,
          ID.unit_price AS unit_price_detail,
          ID.total_value AS total_value_import_detail,
          I.total_value AS total_value_import,
          I.import_date,
          I.total_quantity AS total_quantity_import,
          U.fullname AS user_fullname,
          W.name AS warehouse_name,
          P.name AS product_name,
          P.unit_price AS product_unit_price,
          P.quantity AS product_quantity,
          P.production_date,
          P.expiration_date,
          S.supplier_name,
          S.contact_person AS supplier_contact,
          C.category_name AS product_category
      FROM Import_Detail ID
      INNER JOIN Import I ON ID.import_id = I.import_id
      INNER JOIN [User] U ON I.user_id = U.user_id
      INNER JOIN Warehouse W ON I.warehouse_id = W.warehouse_id
      INNER JOIN Products P ON ID.barcode = P.barcode
      LEFT JOIN Supplier S ON P.supplier_id = S.supplier_id
      LEFT JOIN Category C ON P.category_id = C.category_id
      WHERE I.import_id = @report_id
      ORDER BY I.import_date DESC;
    `);

    console.log("Dữ liệu chi tiết báo cáo nhập: ", result.recordset[0]);
    console.log("Dữ liệu chi tiết báo cáo nhập: ", result.recordset[1]);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo chi tiết nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo chi tiết nhập hàng" });
  }
});

// Báo cáo chi tiết xuất hàng
router.post('/export_detail/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("ID chi tiết báo cáo xuất hàng: ", id);
    const pool = getPool();
    const result = await pool.request()
      .input("report_id", id)
      .query(`
      SELECT 
          ED.export_detail_id,
          ED.export_id,
          ED.barcode,
          ED.quantity AS quantity_detail,
          ED.unit_price AS unit_price_detail,
          ED.total_value AS total_value_export_detail,
          E.total_value AS total_value_export,
          E.export_date,
          E.total_quantity AS total_quantity_export,
          U.fullname AS user_fullname,
          W.name AS warehouse_name,
          P.name AS product_name,
          P.unit_price AS product_unit_price,
          P.quantity AS product_quantity,
          P.production_date,
          P.expiration_date,
          S.supplier_name,
          S.contact_person AS supplier_contact,
          C.category_name AS product_category
      FROM Export_Detail ED
      INNER JOIN Export E ON ED.export_id = E.export_id
      INNER JOIN [User] U ON E.user_id = U.user_id
      INNER JOIN Warehouse W ON E.warehouse_id = W.warehouse_id
      INNER JOIN Products P ON ED.barcode = P.barcode
      LEFT JOIN Supplier S ON P.supplier_id = S.supplier_id
      LEFT JOIN Category C ON P.category_id = C.category_id
      WHERE E.export_id = @report_id
      ORDER BY E.export_date DESC;

    `);

    console.log("Dữ liệu chi tiết báo cáo xuất: ", result.recordset);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo chi tiết nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo chi tiết nhập hàng" });
  }
});

module.exports = router;
