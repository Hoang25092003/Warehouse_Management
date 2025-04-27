const express = require('express');
const axios = require('axios');
const router = express.Router();
// const { getPool } = require('../config/db');

// Nhận thông tin mã vạch sản phẩm từ ESP8266 và xử lý dựa trên `device_id`
router.post("/receive_barcode_ESP", async (req, res) => {
    const { barcode, device_id } = req.body;

    if (!barcode) {
        return res.status(400).json({ message: "Barcode is required", device_id });
    }
    if (!device_id) {
        return res.status(400).json({ message: "Device ID is required" });
    }

    try {
        // Kiểm tra định dạng mã vạch
        console.log(`Received barcode: ${barcode} from device_id: ${device_id}`);
        const cleanBarcode = barcode.replace(/[^\x20-\x7E]/g, ""); // Loại bỏ các ký tự không thuộc ASCII in được
        console.log(`Cleaned barcode: ${cleanBarcode}`);
        if (cleanBarcode.length === 13) {
            console.log("Barcode is valid:", cleanBarcode);
            // Xử lý theo `device_id`
            switch (device_id) {
                case "import":
                    // Gọi API xử lý nhập hàng
                    await axios.post("http://localhost:3000/api/barcode_import", {
                        barcode: cleanBarcode,
                    });
                    break;

                case "export":
                    // Gọi API xử lý xuất hàng
                    await axios.post("http://localhost:3000/api/barcode_export", {
                        barcode: cleanBarcode,
                    });
                    break;

                case "check":
                    // Gọi API kiểm tra thông tin sản phẩm
                    await axios.post("http://localhost:3000/api/barcode_check", {
                        barcode: cleanBarcode,
                    });
                    break;

                default:
                    return res.status(400).json({ message: "Invalid device ID", device_id });

            }
        }else {
            console.error("Invalid barcode length:", cleanBarcode);
        }

        res.json({
            message: `Successfully processed action for device_id: ${device_id}`,
            barcode,
        });
    } catch (error) {
        console.error("Error processing barcode:", error);
        res.status(500).json({ error: "Error processing barcode", device_id });
    }
});

module.exports = router;
