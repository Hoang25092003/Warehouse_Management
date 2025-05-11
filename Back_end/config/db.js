const sql = require('mssql');

const dbConfig = {
  user: 'hoang03_SQLLogin_1', // Tên người dùng trên Somee
  password: 'hoanghuypham2509', // Mật khẩu bạn đặt cho tài khoản này
  server: 'warehousemanagerment.mssql.somee.com', // Server address từ trang Somee
  database: 'warehousemanagerment', // Tên chính xác của CSDL
  options: {
    encrypt: true,                   // Một số nhà cung cấp yêu cầu bật cái này
    trustServerCertificate: true,   // Bắt buộc phải bật vì Somee không có chứng chỉ SSL hợp lệ
    enableArithAbort: true
  }
};

let pool;

async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
<<<<<<< HEAD
    console.log('✅ Đã kết nối tới Database');
=======
    console.log('✅ Đã kết nối tới SQL Server trên Somee');
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
  } catch (err) {
    console.error('❌ Lỗi kết nối tới SQL Server:', err);
  }
}

function getPool() {
  if (!pool) throw new Error('Chưa kết nối tới cơ sở dữ liệu');
  return pool;
}

module.exports = { connectDB, getPool, sql };