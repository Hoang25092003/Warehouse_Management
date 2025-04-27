// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./config/db');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối CSDL
connectDB();

// Route
app.use('/api', require('./routes/Login'));
app.use('/api', require('./routes/Home'));
app.use('/api', require('./routes/Products'));
app.use('/api', require('./routes/Warehouse'));
app.use('/api', require('./routes/Supplier'));
app.use('/api', require('./routes/Account'));
app.use('/api', require('./routes/Categories'));
app.use('/api', require('./routes/Report'));
app.use('/api', require('./routes/Import'));
app.use('/api', require('./routes/Export'));
app.use('/api', require('./routes/Check'));
app.use('/api', require('./routes/receive_barcode'));
app.use('/api', require('./routes/Profile'));


// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Có lỗi xảy ra trên máy chủ');
});

// Khởi động
const port = 3000;
app.listen(port, () => {
  console.log(`✅ Server chạy tại http://localhost:${port}`);
});
