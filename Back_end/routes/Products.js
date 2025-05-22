const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const setSessionContext  = require('../middleware/setSessionContext');

// Lấy danh sách sản phẩm
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        p.product_id,
        p.name,
        p.barcode,
        c.category_name,
        p.quantity,
        p.unit_price,
        CONVERT(varchar, p.production_date, 23) as production_date,
        CONVERT(varchar, p.expiration_date, 23) as expiration_date,
        s.supplier_name,
        p.category_id,
        p.supplier_id
      FROM Products p
      INNER JOIN Category c ON p.category_id = c.category_id
      LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
      ORDER BY p.name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server khi lấy sản phẩm" });
  }
});

// Sửa sản phẩm
router.put('/products/:id', authenticateToken, setSessionContext, async (req, res) => {
  const { id } = req.params;
  const {
    name, unit_price, production_date,
    expiration_date, barcode, category_id, supplier_id
  } = req.body;

  try {
    const pool = getPool();
    await pool.request()
      .input('id', id)
      .input('name', name)
      .input('unit_price', unit_price)
      .input('production_date', production_date)
      .input('expiration_date', expiration_date)
      .input('barcode', barcode)
      .input('category_id', category_id)
      .input('supplier_id', supplier_id)
      .query(`
        UPDATE Products
        SET name = @name,
            unit_price = @unit_price,
            production_date = @production_date,
            expiration_date = @expiration_date,
            barcode = @barcode, category_id= @category_id,
            supplier_id = @supplier_id
        WHERE product_id = @id
      `);

    res.sendStatus(200);
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err);
    res.status(500).json({ error: 'Lỗi khi cập nhật sản phẩm' });
  }
});

// Xóa sản phẩm
router.delete('/products/:id', authenticateToken, setSessionContext, async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getPool();
    const result = await pool
      .request()
      .input('product_id', id)
      .query('DELETE FROM Products WHERE product_id = @product_id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa.' });
    }

    res.json({ message: 'Xóa sản phẩm thành công.' });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm.' });
  }
});

module.exports = router;
