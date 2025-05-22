const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getPool } = require('../config/db');
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const SECRET_KEY = "WarehouseManagermentIoT"
const AUTH_TOKEN = "TokenIoTVMU"


// Giới hạn 5 lần mỗi 10 giây / IP
const barcodeLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 5,
    message: { error: "Too many requests, please wait." }
});

// Tạo hash SHA1 server để kiểm tra lại
function createSignature(barcode, device_id, device_type) {
    const raw = `${barcode}${device_id}${device_type}${SECRET_KEY}`;
    return crypto.createHash('sha1').update(raw).digest('hex');
}

// Nhận thông tin mã vạch sản phẩm từ ESP8266 và xử lý dựa trên `device_type`
router.post("/receive_barcode_ESP", barcodeLimiter, async (req, res) => {
    const { barcode, device_id, device_type } = req.body;
    const token = req.headers.authorization;
    const signature = req.headers["x-signature"];

    // Kiểm tra token
    if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
        return res.status(401).json({ message: "Unauthorized token" });
    }

    // Kiểm tra thông tin mã vạch và thiết bị
    if (!barcode) {
        return res.status(400).json({ message: "Barcode is required", device_type });
    }
    if (!device_id) {
        return res.status(400).json({ message: "Device ID is required" });
    }
    if (!device_type) {
        return res.status(400).json({ message: "Device Type is required" });
    }

    // Kiểm tra chữ ký (hash)
    const serverSignature = createSignature(barcode, device_id, device_type);
    if (signature !== serverSignature) {
        return res.status(403).json({ message: "Invalid signature" });
    }

    try {
        // Kiểm tra định dạng mã vạch
        console.log(`Received barcode: ${barcode} from device_id: ${device_id} - ${device_type}`);
        const cleanBarcode = barcode.replace(/[^\x20-\x7E]/g, ""); // Loại bỏ các ký tự không thuộc ASCII in được
        console.log(`Cleaned barcode: ${cleanBarcode}`);

        const pool = getPool();
        // Cập nhật lại loại thiết bị
        const updatedevie = await pool.request()
            .input("device_id", device_id)
            .input("device_type", device_type)
            .query(`UPDATE Devices
            SET device_type = @device_type
            WHERE device_id = @device_id`);
        
        // Truy vấn kiểm tra thiết bị đã được phân quyền cho user nào chưa
        const result = await pool.request()
            .input("device_id", device_id)
            .query(`SELECT assigned_userID FROM DevicesAuthorization WHERE device_id = @device_id`);

        const userID = result.recordset;
        // Nếu không có ai được phân quyền thiết bị này, thì bỏ qua xử lý
        if (userID.length === 0) {
            console.log(`Thiết bị ${device_id} chưa được phân quyền. Bỏ qua...`);
            return res.status(403).json({ message: "Thiết bị chưa được phân quyền", device_id });
        }

        if (cleanBarcode.length === 13) {
            console.log("Barcode is valid:", cleanBarcode);
            // Xử lý theo `device_type`
            let apiEndpoint = null;
            switch (device_type) {
                case "import":
                    apiEndpoint = "/api/barcode_import"; break;
                case "export":
                    apiEndpoint = "/api/barcode_export"; break;
                case "check":
                    apiEndpoint = "/api/barcode_check"; break;
                default:
                    return res.status(400).json({ message: "Invalid device ID", device_id });
            }

            // Tạo signature khi gửi tới API nội bộ
            const internalSignature = createSignature(cleanBarcode, device_id, device_type);

            // Gửi dữ liệu tới endpoint nội bộ (đã xác thực trước)
            try {
                const response = await axios.post(
                    `https://warehouse-management-r8on.onrender.com${apiEndpoint}`,
                    {
                        barcode: cleanBarcode,
                        device_id: device_id,
                        userid: userID,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${AUTH_TOKEN}`,
                            'x-signature': internalSignature,
                        },
                        timeout: 10000
                    }
                );

                console.log("API Response:", response.data);
                
                if (response.status !== 200) {
                    console.error("Failed to process barcode:", response.status, response.data);
                    return res.status(response.status).json({ error: "Failed to process barcode" });
                }
            } catch (error) {
                console.error("Error while calling API:", error.response ? error.response.data : error.message);
                return res.status(500).json({ error: "Error processing barcode" });
            }

        } else {
            console.error("Invalid barcode length:", cleanBarcode);
        }

        res.json({
            message: `Successfully processed action for device_type: ${device_type}`,
            barcode,
        });
    } catch (error) {
        console.error("Error processing barcode:", error);
        res.status(500).json({ error: "Error processing barcode", device_type });
    }
});

module.exports = router;
