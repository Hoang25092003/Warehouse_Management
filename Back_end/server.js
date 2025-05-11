// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connectDB } = require('./config/db');
const app = express();
const compression = require('compression');
const cookieParser = require('cookie-parser');


// Cấu hình CORS
const corsOptions = {
<<<<<<< HEAD
  origin: ['http://warehousemanagerment.site', 'https://warehousemanagerment.site', 'http://localhost:3000', 'http://localhost:3001'], 
=======
  origin: ['http://warehousemanagerment.site', 'http://localhost:3000', 'https://warehousemanagerment.site'], // Cho phép truy cập từ frontend (localhost:3001)
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Cho phép gửi cookie
};

// Middleware
app.set('trust proxy', 1);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Đọc cookie từ request


<<<<<<< HEAD
=======
// app.use(express.static(path.resolve(__dirname, '../Front_end/build')));

>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
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
app.use('/api', require('./routes/DeviceManagerment'));


// Xử lý lỗi toàn cục
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Có lỗi xảy ra trên máy chủ');
});

<<<<<<< HEAD
=======
// Nếu không match bất kỳ route API nào thì trả về index.html của Frontend
// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, '../Front_end/build/index.html'));
// });

>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33

// Khởi động
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server chạy tại http://localhost:${port}`);
});