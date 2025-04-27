const sql = require('mssql');

const dbConfig = {
  user: 'WarehouseManagementRemote',
  password: 'fit@vmiaru',
  server: '100.119.167.61',
  database: 'WarehouseManagement',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool;

async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ Đã kết nối tới CSDL SQL Server');
  } catch (err) {
    console.error('❌ Lỗi kết nối CSDL:', err);
  }
}

function getPool() {
  if (!pool) throw new Error('Chưa kết nối tới cơ sở dữ liệu');
  return pool;
}

module.exports = { connectDB, getPool, sql };
