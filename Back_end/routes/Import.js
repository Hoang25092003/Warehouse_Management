const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const SECRET_KEY = "WarehouseManagermentIoT"
const AUTH_TOKEN = "TokenIoTVMU"

// Hàm kiểm tra chữ ký
function createSignature(barcode, device_id, device_type) {
    return crypto.createHash("sha1").update(`${barcode}${device_id}${device_type}${SECRET_KEY}`).digest("hex");
}

// Lấy danh sách danh mục
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT * FROM Category');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching Category:', err);
        res.status(500).json({ message: 'Failed to fetch Category' });
    }
});
// Lấy danh sách nhà cung cấp
router.get('/suppliers', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT * FROM Supplier');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ message: 'Failed to fetch suppliers' });
    }
});
// Lấy danh sách nhà kho
router.get('/warehouses', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT * FROM Warehouse');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching warehouses:', err);
        res.status(500).json({ message: 'Failed to fetch warehouses' });
    }
});

// Tìm kiếm sản phẩm
router.get("/search_products", authenticateToken, async (req, res) => {
    const { query } = req.query;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input("searchTerm", `%${query}%`)
            .query("SELECT * FROM Products WHERE name LIKE @searchTerm OR barcode LIKE @searchTerm");
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm.' });
    }
});

let cachedBarcode = null;
let cachedUser = null;
// Nhận mã vạch từ ESP8266 và kiểm tra sản phẩm trong cơ sở dữ liệu
router.post("/barcode_import", async (req, res) => {
    const { barcode, device_id, userid } = req.body;
    const token = req.headers.authorization;
    const signature = req.headers["x-signature"];
    const device_type = "import";

    // Kiểm tra token
    if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
        return res.status(401).json({ message: "Unauthorized token" });
    }

    // Kiểm tra thông tin
    if (!barcode) {
        console.log("Barcode is missing in the request body.");
        return res.status(400).json({ message: "Barcode is required" });
    }

    if (!device_id) {
        console.log("device ID is missing in the request body.");
        return res.status(400).json({ message: "device ID is required" });
    }

    if (!userid) {
        console.log("userid is missing in the request body.");
        return res.status(400).json({ message: "userid is required" });
    }

    // Kiểm tra chữ ký
    const expectedSignature = createSignature(barcode, device_id, device_type);
    if (signature !== expectedSignature) {
        return res.status(403).json({ message: "Invalid signature" });
    }


    try {
        console.log(`Received import barcode: ${barcode} - Device_id: ${device_id}`);

        cachedBarcode = barcode; // Lưu mã vạch vào biến tạm thời
        cachedUser = userid;
        console.log("Barcode gửi đi: ",cachedBarcode);
        console.log("User gửi đi: ", cachedUser);

        res.status(200).json({ message: "Barcode received successfully." });
    } catch (error) {
        console.error("Error processing barcode:", error);
        res.status(500).json({ error: "Error processing barcode." });
    }
});

// API lấy mã vạch từ cache (được ứng dụng web gọi)
router.get("/barcode_fetch", authenticateToken, async (req, res) => {
    try {
        if (cachedBarcode) {
            const result = cachedBarcode;
            console.log(`Sending cached barcode: ${result}`);
            cachedBarcode = null; // Xóa mã vạch sau khi gửi để tránh xử lý lại
            // Tìm kiếm sản phẩm trong cơ sở dữ liệu
            const pool = getPool();
            const localResult = await pool.request()
                .input("barcode", result)
                .query("SELECT * FROM Products WHERE barcode = @barcode");

            if (localResult.recordset.length > 0) {
                return res.status(200).json({
                    success: true,
                    find: true,
                    product: localResult.recordset[0],
                    assignedUser: cachedUser
                });
            } else {
                return res.status(200).json({
                    success: true,
                    find: false,
                    barcode: result,
                    message: "Product not found in the database",
                    assignedUser: cachedUser
                });
            }
        } else {
            return res.status(204).json({
                success: false,
                message: "No barcode available."
            });
        }
    } catch (error) {
        console.error("Error fetching barcode:", error);
        res.status(500).json({ error: "Error fetching barcode." });
    }
});

// Thêm sản phẩm mới vào cơ sở dữ liệu
router.post("/save_new_product", authenticateToken, async (req, res) => {
    const { product_id, barcode, name, category_id, quantity, unit_price, production_date, expiration_date, supplier_id } = req.body;

    if (!barcode || !name) {
        return res.status(400).json({ message: "Barcode and name are required" });
    }

    try {

        const pool = getPool();
        // Kiểm tra xem sản phẩm đã tồn tại chưa
        const existingProduct = await pool.request()
            .input("barcode", barcode)
            .query("SELECT * FROM Products WHERE barcode = @barcode");

        if (existingProduct.recordset.length > 0) {
            return res.status(400).json({ message: "Product already exists in the database" });
        }

        console.log("Thông tin sản phẩm mới nhận được: ", { product_id, barcode, name, category_id, quantity, unit_price, production_date, expiration_date, supplier_id })
        // Thêm sản phẩm mới vào cơ sở dữ liệu
        await pool.request()
            .input("product_id", product_id)
            .input("barcode", barcode)
            .input("name", name)
            .input("category_id", category_id || null)
            .input("quantity", quantity || 0)
            .input("unit_price", unit_price || 0)
            .input("production_date", production_date || null)
            .input("expiration_date", expiration_date || null)
            .input("supplier_id", supplier_id || null)
            .query(`
            INSERT INTO Products (product_id, name, barcode, category_id, quantity, unit_price, production_date, expiration_date, supplier_id)
            VALUES (@product_id, @name, @barcode, @category_id, @quantity, @unit_price, @production_date, @expiration_date, @supplier_id)
            `);
        res.json({ message: "Product added successfully" });
        console.log("Product added successfully:", { product_id, name, barcode, category_id, quantity, unit_price, production_date, expiration_date, supplier_id });
        console.log("New product added successfully")
    } catch (error) {
        console.error("Error saving new product:", error);
        res.status(500).json({ error: "Error saving product" });
    }
});

// Format ngày tháng theo định dạng YYYY-MM-DD
const formatDate = (date) => {
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
};

const generateImportDetailId = () => {
    const shortUuid = uuidv4().replace(/-/g, '').slice(0, 12); // Lấy 12 ký tự đầu tiên
    return `IPDT-${shortUuid}`;
};

// Xác nhận nhập hàng
router.post("/imports_confirm", authenticateToken, async (req, res) => {
    const { contents, products } = req.body;

    if (!contents || !products) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const pool = getPool();
    const import_id = contents.import_id;

    try {
        console.log("Received import data:", { contents, products });

        // Thêm dữ liệu vào bảng Import
        try {
            await pool.request()
                .input("import_id", import_id)
                .input("userId", contents.user_id)
                .input("warehouseId", contents.warehouse_id)
                .input("totalQuantity", contents.total_quantity)
                .input("totalValue", contents.total_value)
                .input("date", formatDate(contents.date))
                .input("notes", contents.notes)
                .query(`INSERT INTO Import (import_id, user_id, warehouse_id, total_quantity, total_value, import_date, notes)
                        VALUES (@import_id, @userId, @warehouseId, @totalQuantity, @totalValue, @date, @notes)`);

            console.log("Đã thêm vào bảng Import.");
        } catch (error) {
            console.error("Lỗi khi thêm dữ liệu vào bảng Import:", error);
            return res.status(500).json({ message: "Error adding data to Import table" });
        }

        // Thêm dữ liệu vào bảng Import_Detail
        let importDetailErrors = [];
        for (const product of products) {
            try {
                console.log("Đang thêm sản phẩm vào Import_Detail:", product);
                await pool.request()
                    .input("import_detail_id", generateImportDetailId())
                    .input("import_id", import_id)
                    .input("barcode", product.barcode)
                    .input("quantity", product.quantity)
                    .input("unit_price", product.unit_price)
                    .query(`INSERT INTO Import_Detail (import_detail_id, import_id, barcode, quantity, unit_price)
                            VALUES (@import_detail_id, @import_id, @barcode, @quantity, @unit_price)`);

                console.log(`Sản phẩm ${product.name} đã được thêm vào Import_Detail.`);
            } catch (error) {
                console.error(`Lỗi khi thêm sản phẩm ${product.name} vào Import_Detail:`, error);
                importDetailErrors.push({ product: product.name, error: error.message });
            }
        }

        if (importDetailErrors.length > 0) {
            return res.status(400).json({
                message: "Some products failed to import details.",
                errors: importDetailErrors,
            });
        }

        res.json({ message: "Import confirmed successfully" });
        console.log("Import confirmed successfully.");
    } catch (error) {
        console.error("Error confirming import:", error);
        res.status(500).json({ error: "Error confirming import" });
    }
});



module.exports = router;
