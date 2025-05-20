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

// Tìm kiếm sản phẩm
router.get("/search_export_products", authenticateToken, async (req, res) => {
    const { query } = req.query;
    try {
        const pool = getPool();
        const result = await pool.request()
            .input("searchTerm", `%${query}%`)
            .query(`
        SELECT 
            W.warehouse_id,
            W.name AS warehouse_name,
            P.barcode,
            P.name AS product_name,
            P.unit_price AS product_unit_price,
            P.quantity AS product_quantity,
            P.production_date,
            P.expiration_date,
            S.supplier_name,
            S.contact_person AS supplier_contact,
            C.category_name AS product_category,
            SUM(ID.quantity) AS total_quantity_per_warehouse -- Tính tổng số lượng sản phẩm trong kho
        FROM Import_Detail ID
        INNER JOIN Import I ON ID.import_id = I.import_id
        INNER JOIN [User] U ON I.user_id = U.user_id
        INNER JOIN Warehouse W ON I.warehouse_id = W.warehouse_id
        INNER JOIN Products P ON ID.barcode = P.barcode
        LEFT JOIN Supplier S ON P.supplier_id = S.supplier_id
        LEFT JOIN Category C ON P.category_id = C.category_id
        WHERE P.name LIKE @searchTerm OR ID.barcode LIKE @searchTerm
        GROUP BY 
            W.warehouse_id,
            W.name,
            P.barcode,
            P.name,
            P.unit_price,
            P.quantity,
            P.production_date,
            P.expiration_date,
            S.supplier_name,
            S.contact_person,
            C.category_name
        ORDER BY W.warehouse_id ASC, P.name ASC;

    `);
        console.log("Kết quả tìm kiếm", result.recordset)
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi khi tìm kiếm sản phẩm:', error);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi tìm kiếm sản phẩm.' });
    }
});

let cachedBarcode = null;
let cachedUser = null;
// Nhận mã vạch từ ESP8266 và kiểm tra sản phẩm trong cơ sở dữ liệu
router.post("/barcode_export", async (req, res) => {
    const { barcode, device_id, userid } = req.body;
    const token = req.headers.authorization;
    const signature = req.headers["x-signature"];
    const device_type = "export";

    // Kiểm tra token
    if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
        return res.status(401).json({ message: "Unauthorized token" });
    }

    // Kiểm tra thông tin
    if (!barcode) {
        console.error("Barcode is missing in the request body.");
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
router.get("/export_barcode_fetch", authenticateToken, async (req, res) => {
    try {
        if (cachedBarcode) {
            const result = cachedBarcode;
            console.log(`Sending cached barcode: ${result}`);
            cachedBarcode = null; // Xóa mã vạch sau khi gửi để tránh xử lý lại
            // Tìm kiếm sản phẩm trong cơ sở dữ liệu
            const pool = getPool();
            const localResult = await pool.request()
                .input("barcode", result)
                .query(`
                SELECT 
                    P.product_id,
                    P.barcode,
                    P.name AS product_name,
                    P.category_id,
                    P.unit_price AS product_unit_price,
                    P.quantity AS product_quantity,
                    P.production_date,
                    P.expiration_date,
                    P.supplier_id,
                    S.supplier_name,
                    S.contact_person AS supplier_contact,
                    C.category_name AS product_category,
                    ISNULL(JSON_QUERY(
                        (SELECT 
                            I.warehouse_id AS warehouse_id,
                            SUM(ID.quantity) AS quantity
                        FROM Import_Detail ID
                        INNER JOIN Import I ON ID.import_id = I.import_id
                        WHERE ID.barcode = P.barcode
                        GROUP BY I.warehouse_id
                        FOR JSON PATH)
                    ), JSON_QUERY('[{"warehouse_id": null, "quantity": 0}]')) AS warehouse_data
                FROM Products P
                LEFT JOIN Supplier S ON P.supplier_id = S.supplier_id
                LEFT JOIN Category C ON P.category_id = C.category_id
                WHERE P.barcode = @barcode;
                    `);

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

// Format ngày tháng theo định dạng YYYY-MM-DD
const formatDate = (date) => {
    const [day, month, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
};

const generateExportDetailId = () => {
    const shortUuid = uuidv4().replace(/-/g, '').slice(0, 12);
    return `EPDT-${shortUuid}`;
};

// Xác nhận xuất hàng
router.post("/exports_confirm", authenticateToken, setSessionContext, async (req, res) => {
    const { contents, products } = req.body;

    if (!contents || !products) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const pool = getPool();
    const export_id = contents.export_id;

    try {
        console.log("Received export data:", { contents, products });

        // Thêm dữ liệu vào bảng Export
        try {
            await pool.request()
                .input("export_id", export_id)
                .input("userId", contents.user_id)
                .input("totalQuantity", contents.total_quantity)
                .input("totalValue", contents.total_value)
                .input("date", formatDate(contents.date))
                .input("customer_infor", contents.customer_infor)
                .input("notes", contents.notes)
                .query(`INSERT INTO Export (export_id, user_id, total_quantity, total_value, export_date, customer_info, notes)
                        VALUES (@export_id, @userId, @totalQuantity, @totalValue, @date, @customer_infor, @notes)`);

            console.log("Đã thêm vào bảng Export.");
        } catch (error) {
            console.error("Lỗi khi thêm dữ liệu vào bảng Export:", error);
            return res.status(500).json({ message: "Error adding data to Export table" });
        }

        // Thêm dữ liệu vào bảng Export_Detail
        let exportDetailErrors = [];
        for (const product of products) {
            try {
                console.log("Đang thêm sản phẩm vào Export_Detail:", product);
                await pool.request()
                    .input("export_detail_id", generateExportDetailId())
                    .input("export_id", export_id)
                    .input("barcode", product.barcode)
                    .input("warehouse_id", product.warehouse_id)
                    .input("quantity", product.product_quantity)
                    .input("unit_price", product.product_unit_price)
                    .query(`INSERT INTO Export_Detail (export_detail_id, export_id, barcode, warehouse_id, quantity, unit_price)
                            VALUES (@export_detail_id, @export_id, @barcode, @warehouse_id, @quantity, @unit_price)`);

                console.log(`Sản phẩm ${product.name} đã được thêm vào Export_Detail.`);
            } catch (error) {
                console.error(`Lỗi khi thêm sản phẩm ${product.name} vào Export_Detail:`, error);
                exportDetailErrors.push({ product: product.name, error: error.message });
            }
        }

        if (exportDetailErrors.length > 0) {
            return res.status(400).json({
                message: "Some products failed to export details.",
                errors: exportDetailErrors,
            });
        }

        res.json({ message: "Export confirmed successfully" });
        console.log("Export confirmed successfully.");
    } catch (error) {
        console.error("Error confirming export:", error);
        res.status(500).json({ error: "Error confirming export" });
    }
});
module.exports = router;
