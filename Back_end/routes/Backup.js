const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Thư mục backup
const BACKUP_DIR = path.join(__dirname, '../backup');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

// Backup thủ công về máy
router.get('/backup', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const tables = [
            'User', 'Supplier', 'Warehouse', 'Category', 'Products', 'Inventory',
            'Import', 'Import_Detail', 'Export', 'Export_Detail', 'Report',
            'Devices', 'DevicesAuthorization', 'ActionLog'
        ];
        const backupData = {};
        for (const table of tables) {
            const result = await pool.request().query(`SELECT * FROM [${table}]`);
            backupData[table] = result.recordset;
        }

        const filename = `backup_${Date.now()}.json`;
        const filePath = path.join(BACKUP_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');

        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                return res.status(500).json({ error: 'Error downloading file' });
            }
            // Xóa file sau khi tải xong
            fs.unlinkSync(filePath);
        });
    } catch (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ error: 'Backup failed' });
    }

});

// Lấy lịch sử backup
router.get('/list_backup', authenticateToken, (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => ({
                fileName: f,
                timestamp: f.match(/\d+/) ? Number(f.match(/\d+/)[0]) : Date.now(),
                destination: f.includes('drive') ? 'Google Drive' : 'Thiết bị'
            }));
        res.json(files);
    } catch (err) {
        console.error('Error reading backup directory:', err);
        res.status(500).json({ error: 'Cannot list backup files' });
    }
});

// Khôi phục từ file upload
router.post('/restore_backup', authenticateToken, upload.single('backupFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
        const jsonData = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
        const pool = getPool();
        const tables = [
            'User', 'Supplier', 'Warehouse', 'Category', 'Products', 'Inventory',
            'Import', 'Import_Detail', 'Export', 'Export_Detail', 'Report',
            'Devices', 'DevicesAuthorization', 'ActionLog'
        ];
        // Xóa dữ liệu cũ
        for (const table of tables) {
            await pool.request().query(`DELETE FROM [${table}]`);
        }
        // Chèn dữ liệu mới
        for (const table of tables) {
            const data = jsonData[table];
            if (data && data.length > 0) {
                for (const row of data) {
                    const keys = Object.keys(row);
                    const columns = keys.map(k => `[${k}]`).join(',');
                    const values = keys.map((k, idx) => `@v${idx}`).join(',');
                    const request = pool.request();
                    keys.forEach((k, idx) => request.input(`v${idx}`, row[k]));
                    await request.query(`INSERT INTO [${table}] (${columns}) VALUES (${values})`);
                }
            }
        }
        fs.unlinkSync(req.file.path);
        res.json({ success: true });
    } catch (err) {
        console.error('Error restoring backup:', err);
        return res.status(500).json({ error: 'Restore failed' });
    }
});

module.exports = router;
