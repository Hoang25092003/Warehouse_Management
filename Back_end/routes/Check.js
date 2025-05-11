const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const SECRET_KEY = "WarehouseManagermentIoT"
const AUTH_TOKEN = "TokenIoTVMU"

// Hàm kiểm tra chữ ký
function createSignature(barcode, device_id, device_type) {
    return crypto.createHash("sha1").update(`${barcode}${device_id}${device_type}${SECRET_KEY}`).digest("hex");
}

let cachedBarcode = null;
let cachedUser = null;
// Nhận mã vạch từ ESP8266 và kiểm tra sản phẩm trong cơ sở dữ liệu
router.post("/barcode_check", async (req, res) => {
    const { barcode, device_id, userid } = req.body;
    const token = req.headers.authorization;
    const signature = req.headers["x-signature"];
    const device_type = "check";

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
router.get("/check_barcode_fetch", authenticateToken, async (req, res) => {
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
                    P.unit_price AS product_unit_price,
                    P.quantity AS product_quantity,
                    P.production_date,
                    P.expiration_date,
                    S.supplier_name,
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

module.exports = router;
