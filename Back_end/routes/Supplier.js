const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {setSessionContext } = require('../middleware/setSessionContext');

router.get('/suppliers', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
          SELECT * FROM Supplier ORDER BY supplier_name
        `);
        res.json(result.recordset);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu nhà cung cấp:", error);
        res.status(500).json({ error: "Lỗi server khi lấy danh sách nhà cung cấp" });
      }
});

router.post('/suppliers', authenticateToken, setSessionContext, async (req, res) => {
    try {
        const { supplier_name, contact_person, phone, email, address } = req.body;
        const supplier_id = 'SUP-' + Date.now().toString().slice(-6);
        
        const pool = getPool();
        await pool.request()
            .input('supplier_id', supplier_id)
            .input('supplier_name', supplier_name)
            .input('contact_person', contact_person)
            .input('phone', phone)
            .input('email', email)
            .input('address', address)
            .query(`
                INSERT INTO Supplier (supplier_id, supplier_name, contact_person, phone, email, address)
                VALUES (@supplier_id, @supplier_name, @contact_person, @phone, @email, @address)
            `);
        res.status(201).json({ message: "Đã thêm nhà cung cấp thành công" });
    } catch (error) {
        console.error("Lỗi khi thêm nhà cung cấp:", error);
        res.status(500).json({ error: "Lỗi server khi thêm nhà cung cấp" });
    }
});

router.put('/suppliers/:id', authenticateToken, setSessionContext, async (req, res) => {
    const { id } = req.params;
    const { supplier_name, contact_person, phone, email, address } = req.body;
    try {
        const pool = getPool();
        await pool.request()
            .input('supplier_id', id)
            .input('supplier_name', supplier_name)
            .input('contact_person', contact_person)
            .input('phone', phone)
            .input('email', email)
            .input('address', address)
            .query(`
                UPDATE Supplier
                SET supplier_name = @supplier_name, contact_person = @contact_person,
                    phone = @phone, email = @email, address = @address
                WHERE supplier_id = @supplier_id
            `);
        res.json({ message: "Đã cập nhật nhà cung cấp thành công" });
    } catch (error) {
        console.error("Lỗi khi cập nhật nhà cung cấp:", error);
        res.status(500).json({ error: "Lỗi server khi cập nhật nhà cung cấp" });
    }
});

router.delete('/suppliers/:id', authenticateToken, setSessionContext, async (req, res) => {
    const { id } = req.params;
    try {
        const pool = getPool();
        await pool.request()
            .input('supplier_id', id)
            .query(`
                DELETE FROM Supplier
                WHERE supplier_id = @supplier_id
            `);
        res.json({ message: "Đã xóa nhà cung cấp thành công" });
    } catch (error) {
        console.error("Lỗi khi xóa nhà cung cấp:", error);
        res.status(500).json({ error: "Lỗi server khi xóa nhà cung cấp" });
    }
});
module.exports = router;
