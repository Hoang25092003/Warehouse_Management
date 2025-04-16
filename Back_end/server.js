const express = require('express');
const path = require('path');
const cors = require('cors');
const sql = require('mssql');
const axios = require('axios');
// const bcrypt = require('bcrypt');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Để phục vụ các tệp tĩnh như HTML, CSS, JS

const port = 3000;
const SECRET_KEY = 'SP_GV.DT25-47';

app.use(cors());
app.use(express.json());

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
sql.connect(dbConfig).then(p => {
  pool = p;
  console.log('✅ Đã kết nối tới CSDL SQL Server');
}).catch(err => console.error('❌ Lỗi kết nối CSDL:', err));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Có lỗi xảy ra trên máy chủ');
});

app.listen(port, () => {
  console.log(`✅ Server chạy tại http://localhost:${port}`);
});
/////////////////////////////////////////LOG IN//////////////////////////////////////////////////
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập username và password' });
  }

  try {
    const request = pool.request();
    request.input('username', sql.VarChar, username);
    const result = await request.query(
      'SELECT * FROM [User] WHERE username = @username'
    );

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    const user = result.recordset[0];

    // Nếu mật khẩu đang lưu là plain text
    if (password !== user.password) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }

    // Nếu dùng bcrypt:
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) return res.status(401).json({ error: 'Mật khẩu không đúng' });

    // Tạo response data đúng cấu trúc
    const responseData = {
      message: 'Đăng nhập thành công',
      token: jwt.sign(
        {
          user_id: user.user_id,
          username: user.username,
          role: user.role || 'staff' // Fallback role
        },
        SECRET_KEY,
        { expiresIn: '8h' }
      ),
      user: {
        user_id: user.user_id,
        username: user.username,
        fullname: user.fullname,
        email: user.email,
        role: user.role || 'staff' // Fallback role
      }
    };

    console.log('Login response:', responseData); // Debug
    res.json(responseData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // đính kèm user vào request
    next();
  });
}

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: `Hello ${req.user.fullname}, đây là dữ liệu bảo mật.` });
});

////////////////////////////////////////////////////XUẤT-NHẬP-KIỂM HÀNG////////////////////////////////////////////////////////
// API endpoint để tra cứu sản phẩm
app.post('/api/product', async (req, res) => {
  const { barcode, device_id } = req.body;

  if (!barcode || typeof barcode !== 'string' || barcode.trim().length === 0) {
    return res.status(400).json({
      message: 'Mã vạch không hợp lệ',
      device_id
    });
  }

  console.log(`[${new Date().toISOString()}] Yêu cầu từ thiết bị: ${device_id}, mã vạch: ${barcode}`);

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Tìm trong CSDL nội bộ
    const localResult = await pool.request()
      .input('barcode', sql.VarChar, barcode)
      .query(`SELECT * FROM Products WHERE barcode = @barcode`);

    if (localResult.recordset.length > 0){

      return res.json({
        source: 'local',
        message: 'Tìm thấy sản phẩm trong CSDL nội bộ',
        data: localResult.recordset[0],
        device_id
      });
    }

    // 2. Nếu không có => Gọi API bên ngoài
    const externalResponse = await axios.get(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { timeout: 5000 }
    );

    const product = externalResponse.data;

    if (product.status === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin mã vạch',
        source: 'external',
        device_id
      });
    }

    const productData = product.product || {};
    const productInfo = {
      name: productData.product_name || 'Chưa rõ tên',
      category: productData.categories || 'Chưa rõ',
      unit_price: 0,
      barcode: barcode,
    };

    // 3. Trả kết quả
    return res.json({
      source: 'external',
      message: 'Tìm thấy sản phẩm từ API OpenFoodFacts',
      data: productInfo,
      device_id
    });

  } catch (err) {
    console.error('Lỗi xử lý:', err);
    return res.status(500).json({
      message: 'Lỗi server hoặc kết nối dữ liệu',
      device_id
    });
  }
});
// Get all warehouses
app.get('/api/warehouses', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Warehouse');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching warehouses:', err);
    res.status(500).json({ message: 'Failed to fetch warehouses' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM Category');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching Category:', err);
    res.status(500).json({ message: 'Failed to fetch Category' });
  }
});

// Import inventory
app.post('/api/inventory/import', async (req, res) => {
  const { product_id, warehouse_id, quantity, unit_price } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // 1. Check if product exists in warehouse
      const checkResult = await transaction.request()
        .input('product_id', sql.VarChar, product_id)
        .input('warehouse_id', sql.VarChar, warehouse_id)
        .query('SELECT stock_quantity FROM Inventory WHERE product_id = @product_id AND warehouse_id = @warehouse_id');
      
      if (checkResult.recordset.length > 0) {
        // Update existing inventory
        await transaction.request()
          .input('product_id', sql.VarChar, product_id)
          .input('warehouse_id', sql.VarChar, warehouse_id)
          .input('quantity', sql.Int, quantity)
          .query('UPDATE Inventory SET stock_quantity = stock_quantity + @quantity WHERE product_id = @product_id AND warehouse_id = @warehouse_id');
      } else {
        // Insert new inventory record
        await transaction.request()
          .input('product_id', sql.VarChar, product_id)
          .input('warehouse_id', sql.VarChar, warehouse_id)
          .input('quantity', sql.Int, quantity)
          .query('INSERT INTO Inventory (warehouse_id, product_id, stock_quantity) VALUES (@warehouse_id, @product_id, @quantity)');
      }
      
      // 2. Update product quantity
      await transaction.request()
        .input('product_id', sql.VarChar, product_id)
        .input('quantity', sql.Int, quantity)
        .query('UPDATE Products SET quantity = quantity + @quantity WHERE product_id = @product_id');
      
      // 3. Create import record
      const importId = `IMP_${Date.now()}`;
      const totalValue = quantity * unit_price;
      
      await transaction.request()
        .input('import_id', sql.VarChar, importId)
        .input('user_id', sql.VarChar, req.user?.user_id || 'system')
        .input('product_id', sql.VarChar, product_id)
        .input('warehouse_id', sql.VarChar, warehouse_id)
        .input('quantity', sql.Int, quantity)
        .input('unit_price', sql.Decimal, unit_price)
        .input('total_value', sql.Decimal, totalValue)
        .query(`INSERT INTO Import (import_id, user_id, product_id, warehouse_id, quantity, unit_price, total_value)
                VALUES (@import_id, @user_id, @product_id, @warehouse_id, @quantity, @unit_price, @total_value)`);
      
      // Commit transaction
      await transaction.commit();
      
      res.json({ success: true, message: 'Import successful' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error importing inventory:', err);
    res.status(500).json({ message: 'Failed to import inventory' });
  }
});

// Export inventory
app.post('/api/inventory/export', async (req, res) => {
  const { product_id, warehouse_id, quantity, unit_price } = req.body;
  
  try {
    const pool = await sql.connect(dbConfig);
    
    // Start transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // 1. Check available quantity
      const inventoryResult = await transaction.request()
        .input('product_id', sql.VarChar, product_id)
        .input('warehouse_id', sql.VarChar, warehouse_id)
        .query('SELECT stock_quantity FROM Inventory WHERE product_id = @product_id AND warehouse_id = @warehouse_id');
      
      if (inventoryResult.recordset.length === 0 || inventoryResult.recordset[0].stock_quantity < quantity) {
        throw new Error('Insufficient stock in warehouse');
      }
      
      // 2. Update inventory
      await transaction.request()
        .input('product_id', sql.VarChar, product_id)
        .input('warehouse_id', sql.VarChar, warehouse_id)
        .input('quantity', sql.Int, quantity)
        .query('UPDATE Inventory SET stock_quantity = stock_quantity - @quantity WHERE product_id = @product_id AND warehouse_id = @warehouse_id');
      
      // 3. Update product quantity
      await transaction.request()
        .input('product_id', sql.VarChar, product_id)
        .input('quantity', sql.Int, quantity)
        .query('UPDATE Products SET quantity = quantity - @quantity WHERE product_id = @product_id');
      
      // 4. Create export record
      const exportId = `EXP_${Date.now()}`;
      const totalValue = quantity * unit_price;
      
      await transaction.request()
        .input('export_id', sql.VarChar, exportId)
        .input('user_id', sql.VarChar, req.user?.user_id || 'system')
        .input('product_id', sql.VarChar, product_id)
        .input('warehouse_id', sql.VarChar, warehouse_id)
        .input('quantity', sql.Int, quantity)
        .input('unit_price', sql.Decimal, unit_price)
        .input('total_value', sql.Decimal, totalValue)
        .query(`INSERT INTO Export (export_id, user_id, product_id, warehouse_id, quantity, unit_price, total_value)
                VALUES (@export_id, @user_id, @product_id, @warehouse_id, @quantity, @unit_price, @total_value)`);
      
      // Commit transaction
      await transaction.commit();
      
      res.json({ success: true, message: 'Export successful' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error exporting inventory:', err);
    res.status(500).json({ message: err.message || 'Failed to export inventory' });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////
// Hàm xác định URL chuyển hướng dựa trên loại thiết bị
function getRedirectUrl(deviceType) {
  switch (deviceType) {
    case 'check':
      return '/product-check';
    case 'import':
      return '/product-import';
    case 'export':
      return '/product-export';
    default:
      return '/product-default';
  }
}
////////////////////////////////////////////////////TRANG CHỦ////////////////////////////////////////////////////////
app.get('/api/dashboard', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Lấy thống kê theo danh mục
    const categoryQuery = `
    SELECT 
    c.category_id,
    c.category_name,
    SUM(p.quantity) as total_quantity
    FROM Category c
    LEFT JOIN Products p ON c.category_id = p.category_id
    GROUP BY c.category_id, c.category_name
    `;
    
    // Lấy thống kê kho hàng
    const warehouseQuery = `
      SELECT 
        warehouse_id,
        name as warehouse_name,
        capacity,
        current_capacity
      FROM Warehouse
    `;

    // Đếm tổng số sản phẩm
    const productsCountQuery = 'SELECT COUNT(*) as total FROM Products';

    // Đếm tổng số kho
    const warehouseCountQuery = 'SELECT COUNT(*) as total FROM Warehouse';

    // Lấy thống kê nhập/xuất hôm nay
    const today = new Date().toISOString().split('T')[0];
    const importsTodayQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(quantity) as total
      FROM Import
      WHERE CONVERT(date, import_date) = '${today}'
    `;

    const exportsTodayQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(quantity) as total
      FROM Export
      WHERE CONVERT(date, export_date) = '${today}'
    `;

    // Thực thi tất cả các query song song
    const [
      categoryResult,
      warehouseResult,
      productsCountResult,
      warehouseCountResult,
      importsTodayResult,
      exportsTodayResult
    ] = await Promise.all([
      pool.request().query(categoryQuery),
      pool.request().query(warehouseQuery),
      pool.request().query(productsCountQuery),
      pool.request().query(warehouseCountQuery),
      pool.request().query(importsTodayQuery),
      pool.request().query(exportsTodayQuery)
    ]);

    res.json({
      categoryStats: categoryResult.recordset,
      warehouseStats: warehouseResult.recordset,
      totalProducts: productsCountResult.recordset[0].total,
      totalWarehouses: warehouseCountResult.recordset[0].total,
      todayImports: importsTodayResult.recordset[0].total || 0,
      todayExports: exportsTodayResult.recordset[0].total || 0,
      todayImportsCount: importsTodayResult.recordset[0].count || 0,
      todayExportsCount: exportsTodayResult.recordset[0].count || 0
    });

  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu dashboard:", error);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu dashboard" });
  } finally {
  }
});

////////////////////////////////////////////////////QUẢN LÝ SẢN PHẨM////////////////////////////////////////////////////////
app.get('/api/products', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        p.product_id,
        p.name,
        p.barcode,
        c.category_name,
        p.quantity,
        p.unit_price,
        CONVERT(varchar, p.production_date, 23) as production_date,
        CONVERT(varchar, p.expiration_date, 23) as expiration_date,
        s.supplier_name
      FROM Products p
      INNER JOIN Category c ON p.category_id = c.category_id
      LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
      ORDER BY p.name
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu sản phẩm:", error);
    res.status(500).json({ error: "Lỗi server khi lấy sản phẩm" });
  }
});

////////////////////////////////////////////////////QUẢN LÝ KHO HÀNG////////////////////////////////////////////////////////
app.get('/api/warehouses', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT * FROM Warehouse ORDER BY name
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu kho hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách kho" });
  }
});

////////////////////////////////////////////////////QUẢN LÝ NHÀ CUNG CẤP////////////////////////////////////////////////////////
app.get('/api/suppliers', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        supplier_id,
        supplier_name,
        contact_person,
        phone,
        email,
        address
      FROM Supplier
      ORDER BY supplier_name
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu nhà cung cấp:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách nhà cung cấp" });
  }
});

////////////////////////////////////////////////////TẠO BÁO CÁO////////////////////////////////////////////////////////
app.get('/api/reports', async (req, res) => {
  try {
    const { type } = req.query;
    const pool = await sql.connect(dbConfig);
    let query;

    switch (type) {
      case 'import':
        query = `
          SELECT 
            i.import_id,
            p.name as product_name,
            w.name as warehouse_name,
            i.quantity,
            i.unit_price,
            i.total_value,
            i.import_date,
            s.supplier_name
          FROM Import i
          JOIN Products p ON i.product_id = p.product_id
          JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
          LEFT JOIN Supplier s ON i.supplier_id = s.supplier_id
          ORDER BY i.import_date DESC
        `;
        break;

      case 'export':
        query = `
          SELECT 
            e.export_id,
            p.name as product_name,
            w.name as warehouse_name,
            e.quantity,
            e.unit_price,
            e.total_value,
            e.export_date,
            e.customer_info
          FROM Export e
          JOIN Products p ON e.product_id = p.product_id
          JOIN Warehouse w ON e.warehouse_id = w.warehouse_id
          ORDER BY e.export_date DESC
        `;
        break;

      case 'inventory':
        query = `
          SELECT 
            w.name as warehouse_name,
            p.name as product_name,
            i.stock_quantity,
            p.unit_price,
            c.category_name
          FROM Inventory i
          JOIN Products p ON i.product_id = p.product_id
          JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
          JOIN Category c ON p.category_id = c.category_id
          ORDER BY w.name, p.name
        `;
        break;

      case 'monthly':
        query = `
          SELECT 
            FORMAT(date, 'yyyy-MM') as period,
            SUM(CASE WHEN type = 'import' THEN total ELSE 0 END) as total_import,
            SUM(CASE WHEN type = 'export' THEN total ELSE 0 END) as total_export,
            COUNT(*) as transaction_count
          FROM (
            SELECT 
              CONVERT(date, import_date) as date,
              'import' as type,
              total_value as total
            FROM Import
            UNION ALL
            SELECT 
              CONVERT(date, export_date) as date,
              'export' as type,
              total_value as total
            FROM Export
          ) as combined
          GROUP BY FORMAT(date, 'yyyy-MM')
          ORDER BY period DESC
        `;
        break;

      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    const result = await pool.request().query(query);
    res.json(result.recordset);

  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu báo cáo:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo" });
  }
});
////////////////////////////////////////////////////TẢI BÁO CÁO////////////////////////////////////////////////////////
const excel = require('exceljs');
const { pdfpath } = require('pdfkit');

// Lấy danh sách báo cáo đã lưu
app.get('/api/reports', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT r.*, u.fullname as user_name 
      FROM Report r
      LEFT JOIN [User] u ON r.user_id = u.user_id
      ORDER BY r.generated_date DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách báo cáo:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách báo cáo" });
  }
});

// Lưu báo cáo mới
app.post('/api/reports', async (req, res) => {
  try {
    const { report_type, start_date, end_date, user_id, content } = req.body;
    const report_id = 'REP-' + Date.now().toString().slice(-6);

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('report_id', sql.VarChar(20), report_id)
      .input('report_type', sql.VarChar(20), report_type)
      .input('user_id', sql.VarChar(20), user_id)
      .input('content', sql.NVarChar(sql.MAX), content)
      .query(`
        INSERT INTO Report (report_id, report_type, user_id, content)
        VALUES (@report_id, @report_type, @user_id, @content)
      `);

    res.json({ success: true, report_id });
  } catch (error) {
    console.error("Lỗi khi lưu báo cáo:", error);
    res.status(500).json({ error: "Lỗi server khi lưu báo cáo" });
  }
});

// Báo cáo nhập hàng
app.get('/api/reports/imports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = '';

    if (startDate && endDate) {
      whereClause = `WHERE CONVERT(date, i.import_date) BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      whereClause = `WHERE CONVERT(date, i.import_date) >= '${startDate}'`;
    } else if (endDate) {
      whereClause = `WHERE CONVERT(date, i.import_date) <= '${endDate}'`;
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        i.import_id,
        p.name as product_name,
        w.name as warehouse_name,
        i.quantity,
        i.unit_price,
        i.total_value,
        i.import_date,
        s.supplier_name,
        i.notes
      FROM Import i
      JOIN Products p ON i.product_id = p.product_id
      JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
      LEFT JOIN Supplier s ON i.supplier_id = s.supplier_id
      ${whereClause}
      ORDER BY i.import_date DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo nhập hàng" });
  }
});

// Báo cáo xuất hàng
app.get('/api/reports/exports', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let whereClause = '';

    if (startDate && endDate) {
      whereClause = `WHERE CONVERT(date, e.export_date) BETWEEN '${startDate}' AND '${endDate}'`;
    } else if (startDate) {
      whereClause = `WHERE CONVERT(date, e.export_date) >= '${startDate}'`;
    } else if (endDate) {
      whereClause = `WHERE CONVERT(date, e.export_date) <= '${endDate}'`;
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        e.export_id,
        p.name as product_name,
        w.name as warehouse_name,
        e.quantity,
        e.unit_price,
        e.total_value,
        e.export_date,
        e.customer_info,
        e.notes
      FROM Export e
      JOIN Products p ON e.product_id = p.product_id
      JOIN Warehouse w ON e.warehouse_id = w.warehouse_id
      ${whereClause}
      ORDER BY e.export_date DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo xuất hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo xuất hàng" });
  }
});

// Báo cáo tồn kho
app.get('/api/reports/inventory', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        p.product_id,
        p.name as product_name,
        c.category_name,
        w.warehouse_id,
        w.name as warehouse_name,
        i.stock_quantity,
        p.unit_price,
        p.expiration_date,
        p.status as product_status
      FROM Inventory i
      JOIN Products p ON i.product_id = p.product_id
      JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
      JOIN Category c ON p.category_id = c.category_id
      ORDER BY w.name, p.name
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo tồn kho:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo tồn kho" });
  }
});

// Báo cáo tổng hợp
app.get('/api/reports/summary', async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    let groupBy = '';
    let dateFormat = '';
    let whereClause = '';

    switch (period) {
      case 'monthly':
        groupBy = 'YEAR(import_date), MONTH(import_date)';
        dateFormat = 'CONCAT(MONTH(import_date), "/", YEAR(import_date)) as period';
        break;
      case 'quarterly':
        groupBy = 'YEAR(import_date), DATEPART(QUARTER, import_date)';
        dateFormat = 'CONCAT("Q", DATEPART(QUARTER, import_date), " ", YEAR(import_date)) as period';
        break;
      case 'annual':
        groupBy = 'YEAR(import_date)';
        dateFormat = 'YEAR(import_date) as period';
        break;
      default:
        return res.status(400).json({ error: "Invalid period parameter" });
    }

    if (startDate && endDate) {
      whereClause = `WHERE CONVERT(date, import_date) BETWEEN '${startDate}' AND '${endDate}'`;
    }

    const pool = await sql.connect(dbConfig);

    // Lấy dữ liệu nhập
    const importsResult = await pool.request().query(`
      SELECT 
        ${dateFormat},
        SUM(quantity) as total_import,
        SUM(total_value) as import_value
      FROM Import
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `);

    // Lấy dữ liệu xuất
    const exportsResult = await pool.request().query(`
      SELECT 
        ${dateFormat},
        SUM(quantity) as total_export,
        SUM(total_value) as export_value
      FROM Export
      ${whereClause}
      GROUP BY ${groupBy}
      ORDER BY ${groupBy}
    `);

    // Lấy dữ liệu tồn kho
    const inventoryResult = await pool.request().query(`
      SELECT 
        ${dateFormat.replace('import_date', 'GETDATE()')},
        SUM(stock_quantity) as total_inventory,
        SUM(stock_quantity * p.unit_price) as inventory_value
      FROM Inventory i
      JOIN Products p ON i.product_id = p.product_id
      GROUP BY ${groupBy.replace('import_date', 'GETDATE()')}
      ORDER BY ${groupBy.replace('import_date', 'GETDATE()')}
    `);

    // Kết hợp kết quả
    const reportData = importsResult.recordset.map(imp => {
      const exp = exportsResult.recordset.find(e => e.period === imp.period) || {};
      const inv = inventoryResult.recordset.find(i => i.period === imp.period) || {};

      return {
        period: imp.period,
        total_import: imp.total_import || 0,
        total_export: exp.total_export || 0,
        total_inventory: inv.total_inventory || 0,
        revenue: (exp.export_value || 0) - (imp.import_value || 0)
      };
    });

    res.json(reportData);
  } catch (error) {
    console.error("Lỗi khi lấy báo cáo tổng hợp:", error);
    res.status(500).json({ error: "Lỗi server khi lấy báo cáo tổng hợp" });
  }
});
////////////////////////////////////////////////////ĐANG XEM XÉT XÓA////////////////////////////////////////////////////////

// Lấy danh sách nhập hàng
app.get('/api/imports', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        i.import_id,
        i.product_id,
        p.name as product_name,
        i.warehouse_id,
        w.name as warehouse_name,
        i.quantity,
        i.unit_price,
        i.total_value,
        i.import_date,
        i.user_id,
        i.supplier_id,
        s.supplier_name
      FROM Import i
      JOIN Products p ON i.product_id = p.product_id
      JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
      LEFT JOIN Supplier s ON i.supplier_id = s.supplier_id
      ORDER BY i.import_date DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách nhập hàng" });
  }
});

// Thêm mới nhập hàng
app.post('/api/imports', async (req, res) => {
  const { product_id, warehouse_id, quantity, operator } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Kiểm tra sản phẩm và kho
    const productCheck = await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .query('SELECT unit_price FROM Products WHERE product_id = @product_id');

    if (productCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Sản phẩm không tồn tại" });
    }

    const warehouseCheck = await pool.request()
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .query('SELECT capacity, current_capacity FROM Warehouse WHERE warehouse_id = @warehouse_id');

    if (warehouseCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Kho không tồn tại" });
    }

    const warehouse = warehouseCheck.recordset[0];
    if (warehouse.current_capacity + quantity > warehouse.capacity) {
      return res.status(400).json({ error: "Kho không đủ sức chứa" });
    }

    // 2. Tính toán giá trị
    const unit_price = productCheck.recordset[0].unit_price;
    const total_value = unit_price * quantity;
    const import_id = 'IMP-' + Date.now().toString().slice(-6);

    // 3. Thêm vào bảng Import
    await pool.request()
      .input('import_id', sql.VarChar(20), import_id)
      .input('product_id', sql.VarChar(20), product_id)
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .input('unit_price', sql.Decimal(15, 2), unit_price)
      .input('total_value', sql.Decimal(18, 2), total_value)
      .input('user_id', sql.VarChar(20), operator)
      .query(`
        INSERT INTO Import (
          import_id, product_id, warehouse_id, quantity, 
          unit_price, total_value, user_id
        ) VALUES (
          @import_id, @product_id, @warehouse_id, @quantity,
          @unit_price, @total_value, @user_id
        )
      `);

    // 4. Cập nhật số lượng sản phẩm
    await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Products SET quantity = quantity + @quantity WHERE product_id = @product_id');

    // 5. Cập nhật sức chứa kho
    await pool.request()
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Warehouse SET current_capacity = current_capacity + @quantity WHERE warehouse_id = @warehouse_id');

    res.json({ success: true, import_id });
  } catch (error) {
    console.error("Lỗi khi thêm nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi thêm nhập hàng" });
  }
});

// Cập nhật nhập hàng
app.put('/api/imports/:id', async (req, res) => {
  const import_id = req.params.id;
  const { product_id, warehouse_id, quantity, operator } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Lấy thông tin nhập hàng cũ
    const oldImport = await pool.request()
      .input('import_id', sql.VarChar(20), import_id)
      .query('SELECT product_id, warehouse_id, quantity FROM Import WHERE import_id = @import_id');

    if (oldImport.recordset.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phiếu nhập" });
    }

    const oldData = oldImport.recordset[0];
    const quantityDiff = quantity - oldData.quantity;

    // 2. Kiểm tra kho mới (nếu có thay đổi)
    if (warehouse_id !== oldData.warehouse_id || quantityDiff !== 0) {
      const warehouseCheck = await pool.request()
        .input('warehouse_id', sql.VarChar(20), warehouse_id)
        .query('SELECT capacity, current_capacity FROM Warehouse WHERE warehouse_id = @warehouse_id');

      if (warehouseCheck.recordset.length === 0) {
        return res.status(400).json({ error: "Kho không tồn tại" });
      }

      const warehouse = warehouseCheck.recordset[0];
      const newCapacity = warehouse.current_capacity + quantityDiff;

      if (newCapacity > warehouse.capacity) {
        return res.status(400).json({ error: "Kho không đủ sức chứa" });
      }
    }

    // 3. Cập nhật phiếu nhập
    const productCheck = await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .query('SELECT unit_price FROM Products WHERE product_id = @product_id');

    if (productCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Sản phẩm không tồn tại" });
    }

    const unit_price = productCheck.recordset[0].unit_price;
    const total_value = unit_price * quantity;

    await pool.request()
      .input('import_id', sql.VarChar(20), import_id)
      .input('product_id', sql.VarChar(20), product_id)
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .input('unit_price', sql.Decimal(15, 2), unit_price)
      .input('total_value', sql.Decimal(18, 2), total_value)
      .input('user_id', sql.VarChar(20), operator)
      .query(`
        UPDATE Import SET
          product_id = @product_id,
          warehouse_id = @warehouse_id,
          quantity = @quantity,
          unit_price = @unit_price,
          total_value = @total_value,
          user_id = @user_id
        WHERE import_id = @import_id
      `);

    // 4. Cập nhật số lượng sản phẩm và kho
    if (quantityDiff !== 0) {
      await pool.request()
        .input('product_id', sql.VarChar(20), product_id)
        .input('quantity_diff', sql.Int, quantityDiff)
        .query('UPDATE Products SET quantity = quantity + @quantity_diff WHERE product_id = @product_id');
    }

    if (warehouse_id !== oldData.warehouse_id || quantityDiff !== 0) {
      // Giảm sức chứa kho cũ
      await pool.request()
        .input('warehouse_id', sql.VarChar(20), oldData.warehouse_id)
        .input('quantity', sql.Int, oldData.quantity)
        .query('UPDATE Warehouse SET current_capacity = current_capacity - @quantity WHERE warehouse_id = @warehouse_id');

      // Tăng sức chứa kho mới
      await pool.request()
        .input('warehouse_id', sql.VarChar(20), warehouse_id)
        .input('quantity', sql.Int, quantity)
        .query('UPDATE Warehouse SET current_capacity = current_capacity + @quantity WHERE warehouse_id = @warehouse_id');
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi cập nhật nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật nhập hàng" });
  }
});

// Xóa nhập hàng
app.delete('/api/imports/:id', async (req, res) => {
  const import_id = req.params.id;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Lấy thông tin nhập hàng
    const importData = await pool.request()
      .input('import_id', sql.VarChar(20), import_id)
      .query('SELECT product_id, warehouse_id, quantity FROM Import WHERE import_id = @import_id');

    if (importData.recordset.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phiếu nhập" });
    }

    const { product_id, warehouse_id, quantity } = importData.recordset[0];

    // 2. Xóa phiếu nhập
    await pool.request()
      .input('import_id', sql.VarChar(20), import_id)
      .query('DELETE FROM Import WHERE import_id = @import_id');

    // 3. Cập nhật số lượng sản phẩm
    await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Products SET quantity = quantity - @quantity WHERE product_id = @product_id');

    // 4. Cập nhật sức chứa kho
    await pool.request()
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Warehouse SET current_capacity = current_capacity - @quantity WHERE warehouse_id = @warehouse_id');

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi xóa nhập hàng:", error);
    res.status(500).json({ error: "Lỗi server khi xóa nhập hàng" });
  }
});

////////////////////////////////////////////////////ĐANG XEM XÉT XÓA ////////////////////////////////////////////////////////

// Thêm các endpoint sau vào file server.js

// Lấy danh sách xuất hàng
app.get('/api/exports', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        e.export_id,
        e.product_id,
        p.name as product_name,
        e.warehouse_id,
        w.name as warehouse_name,
        e.quantity,
        e.unit_price,
        e.total_value,
        e.export_date,
        e.user_id,
        e.customer_info
      FROM Export e
      JOIN Products p ON e.product_id = p.product_id
      JOIN Warehouse w ON e.warehouse_id = w.warehouse_id
      ORDER BY e.export_date DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách xuất hàng:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách xuất hàng" });
  }
});

// Thêm mới xuất hàng
app.post('/api/exports', async (req, res) => {
  const { product_id, warehouse_id, quantity, customer_info, operator } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Kiểm tra sản phẩm và kho
    const productCheck = await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .query('SELECT unit_price, quantity FROM Products WHERE product_id = @product_id');

    if (productCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Sản phẩm không tồn tại" });
    }

    const product = productCheck.recordset[0];
    if (product.quantity < quantity) {
      return res.status(400).json({ error: "Sản phẩm không đủ số lượng tồn kho" });
    }

    const warehouseCheck = await pool.request()
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .query('SELECT current_capacity FROM Warehouse WHERE warehouse_id = @warehouse_id');

    if (warehouseCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Kho không tồn tại" });
    }

    const warehouse = warehouseCheck.recordset[0];
    if (warehouse.current_capacity < quantity) {
      return res.status(400).json({ error: "Kho không đủ số lượng tồn" });
    }

    // 2. Tính toán giá trị
    const unit_price = product.unit_price;
    const total_value = unit_price * quantity;
    const export_id = 'EXP-' + Date.now().toString().slice(-6);

    // 3. Thêm vào bảng Export
    await pool.request()
      .input('export_id', sql.VarChar(20), export_id)
      .input('product_id', sql.VarChar(20), product_id)
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .input('unit_price', sql.Decimal(15, 2), unit_price)
      .input('total_value', sql.Decimal(18, 2), total_value)
      .input('user_id', sql.VarChar(20), operator)
      .input('customer_info', sql.NVarChar(500), customer_info)
      .query(`
        INSERT INTO Export (
          export_id, product_id, warehouse_id, quantity, 
          unit_price, total_value, user_id, customer_info
        ) VALUES (
          @export_id, @product_id, @warehouse_id, @quantity,
          @unit_price, @total_value, @user_id, @customer_info
        )
      `);

    // 4. Cập nhật số lượng sản phẩm
    await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Products SET quantity = quantity - @quantity WHERE product_id = @product_id');

    // 5. Cập nhật sức chứa kho
    await pool.request()
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Warehouse SET current_capacity = current_capacity - @quantity WHERE warehouse_id = @warehouse_id');

    res.json({ success: true, export_id });
  } catch (error) {
    console.error("Lỗi khi thêm xuất hàng:", error);
    res.status(500).json({ error: "Lỗi server khi thêm xuất hàng" });
  }
});

// Cập nhật xuất hàng
app.put('/api/exports/:id', async (req, res) => {
  const export_id = req.params.id;
  const { product_id, warehouse_id, quantity, customer_info, operator } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Lấy thông tin xuất hàng cũ
    const oldExport = await pool.request()
      .input('export_id', sql.VarChar(20), export_id)
      .query('SELECT product_id, warehouse_id, quantity FROM Export WHERE export_id = @export_id');

    if (oldExport.recordset.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phiếu xuất" });
    }

    const oldData = oldExport.recordset[0];
    const quantityDiff = quantity - oldData.quantity;

    // 2. Kiểm tra sản phẩm và kho
    const productCheck = await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .query('SELECT unit_price, quantity FROM Products WHERE product_id = @product_id');

    if (productCheck.recordset.length === 0) {
      return res.status(400).json({ error: "Sản phẩm không tồn tại" });
    }

    const product = productCheck.recordset[0];
    if (product.quantity + oldData.quantity < quantity) {
      return res.status(400).json({ error: "Sản phẩm không đủ số lượng tồn kho" });
    }

    // 3. Kiểm tra kho mới (nếu có thay đổi)
    if (warehouse_id !== oldData.warehouse_id || quantityDiff !== 0) {
      const warehouseCheck = await pool.request()
        .input('warehouse_id', sql.VarChar(20), warehouse_id)
        .query('SELECT current_capacity FROM Warehouse WHERE warehouse_id = @warehouse_id');

      if (warehouseCheck.recordset.length === 0) {
        return res.status(400).json({ error: "Kho không tồn tại" });
      }

      const warehouse = warehouseCheck.recordset[0];
      if (warehouse.current_capacity < quantity) {
        return res.status(400).json({ error: "Kho không đủ số lượng tồn" });
      }
    }

    // 4. Cập nhật phiếu xuất
    const unit_price = product.unit_price;
    const total_value = unit_price * quantity;

    await pool.request()
      .input('export_id', sql.VarChar(20), export_id)
      .input('product_id', sql.VarChar(20), product_id)
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .input('unit_price', sql.Decimal(15, 2), unit_price)
      .input('total_value', sql.Decimal(18, 2), total_value)
      .input('user_id', sql.VarChar(20), operator)
      .input('customer_info', sql.NVarChar(500), customer_info)
      .query(`
        UPDATE Export SET
          product_id = @product_id,
          warehouse_id = @warehouse_id,
          quantity = @quantity,
          unit_price = @unit_price,
          total_value = @total_value,
          user_id = @user_id,
          customer_info = @customer_info
        WHERE export_id = @export_id
      `);

    // 5. Cập nhật số lượng sản phẩm và kho
    if (quantityDiff !== 0) {
      await pool.request()
        .input('product_id', sql.VarChar(20), product_id)
        .input('quantity_diff', sql.Int, quantityDiff)
        .query('UPDATE Products SET quantity = quantity - @quantity_diff WHERE product_id = @product_id');
    }

    if (warehouse_id !== oldData.warehouse_id || quantityDiff !== 0) {
      // Hoàn trả số lượng về kho cũ
      await pool.request()
        .input('warehouse_id', sql.VarChar(20), oldData.warehouse_id)
        .input('quantity', sql.Int, oldData.quantity)
        .query('UPDATE Warehouse SET current_capacity = current_capacity + @quantity WHERE warehouse_id = @warehouse_id');

      // Trừ số lượng ở kho mới
      await pool.request()
        .input('warehouse_id', sql.VarChar(20), warehouse_id)
        .input('quantity', sql.Int, quantity)
        .query('UPDATE Warehouse SET current_capacity = current_capacity - @quantity WHERE warehouse_id = @warehouse_id');
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi cập nhật xuất hàng:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật xuất hàng" });
  }
});

// Xóa xuất hàng
app.delete('/api/exports/:id', async (req, res) => {
  const export_id = req.params.id;

  try {
    const pool = await sql.connect(dbConfig);

    // 1. Lấy thông tin xuất hàng
    const exportData = await pool.request()
      .input('export_id', sql.VarChar(20), export_id)
      .query('SELECT product_id, warehouse_id, quantity FROM Export WHERE export_id = @export_id');

    if (exportData.recordset.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phiếu xuất" });
    }

    const { product_id, warehouse_id, quantity } = exportData.recordset[0];

    // 2. Xóa phiếu xuất
    await pool.request()
      .input('export_id', sql.VarChar(20), export_id)
      .query('DELETE FROM Export WHERE export_id = @export_id');

    // 3. Hoàn trả số lượng sản phẩm
    await pool.request()
      .input('product_id', sql.VarChar(20), product_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Products SET quantity = quantity + @quantity WHERE product_id = @product_id');

    // 4. Hoàn trả sức chứa kho
    await pool.request()
      .input('warehouse_id', sql.VarChar(20), warehouse_id)
      .input('quantity', sql.Int, quantity)
      .query('UPDATE Warehouse SET current_capacity = current_capacity + @quantity WHERE warehouse_id = @warehouse_id');

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi xóa xuất hàng:", error);
    res.status(500).json({ error: "Lỗi server khi xóa xuất hàng" });
  }
});

////////////////////////////////////////////////////QUẢN LÝ TÀI KHOẢN////////////////////////////////////////////////////////
// Lấy danh sách tài khoản
app.get('/api/users', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        *
      FROM [User]
      ORDER BY username
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài khoản:", error);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách tài khoản" });
  }
});

// Tạo tài khoản mới
app.post('/api/users', async (req, res) => {
  const { username, email, password, role, fullname, phone } = req.body;

  try {
    // Validate input
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "Vui lòng điền đầy đủ thông tin bắt buộc" });
    }

    const pool = await sql.connect(dbConfig);

    // Kiểm tra username tồn tại
    const userCheck = await pool.request()
      .input('username', sql.VarChar(50), username)
      .query('SELECT 1 FROM [User] WHERE username = @username');

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ error: "Tên tài khoản đã tồn tại" });
    }

    // Kiểm tra email tồn tại
    const emailCheck = await pool.request()
      .input('email', sql.VarChar(100), email)
      .query('SELECT 1 FROM [User] WHERE email = @email');

    if (emailCheck.recordset.length > 0) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // Hash password (sử dụng bcrypt trong thực tế)
    const hashedPassword = password; // Trong thực tế nên hash password

    // Tạo user mới
    const user_id = 'USER-' + Date.now().toString().slice(-6);
    await pool.request()
      .input('user_id', sql.VarChar(20), user_id)
      .input('username', sql.VarChar(50), username)
      .input('email', sql.VarChar(100), email)
      .input('password', sql.VarChar(255), hashedPassword)
      .input('fullname', sql.NVarChar(255), fullname || null)
      .input('phone', sql.VarChar(15), phone || null)
      .input('role', sql.VarChar(10), role)
      .query(`
        INSERT INTO [User] (
          user_id, username, email, [password], 
          fullname, phone, role, is_active
        ) VALUES (
          @user_id, @username, @email, @password,
          @fullname, @phone, @role, 1
        )
      `);

    res.json({ success: true, user_id });
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản:", error);
    res.status(500).json({ error: "Lỗi server khi tạo tài khoản" });
  }
});

// Cập nhật tài khoản
app.put('/api/users/:id', async (req, res) => {
  const user_id = req.params.id;
  const { email, password, role, fullname, phone } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // Kiểm tra user tồn tại
    const userCheck = await pool.request()
      .input('user_id', sql.VarChar(20), user_id)
      .query('SELECT 1 FROM [User] WHERE user_id = @user_id');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản" });
    }

    // Kiểm tra email trùng (nếu có thay đổi)
    if (email) {
      const emailCheck = await pool.request()
        .input('email', sql.VarChar(100), email)
        .input('user_id', sql.VarChar(20), user_id)
        .query('SELECT 1 FROM [User] WHERE email = @email AND user_id != @user_id');

      if (emailCheck.recordset.length > 0) {
        return res.status(400).json({ error: "Email đã được sử dụng bởi tài khoản khác" });
      }
    }

    // Build query cập nhật
    let updateQuery = 'UPDATE [User] SET ';
    const inputs = {};
    inputs.user_id = user_id;

    if (email) {
      updateQuery += 'email = @email, ';
      inputs.email = email;
    }

    if (password) {
      // Hash password trong thực tế
      updateQuery += '[password] = @password, ';
      inputs.password = password;
    }

    if (role) {
      updateQuery += 'role = @role, ';
      inputs.role = role;
    }

    if (fullname !== undefined) {
      updateQuery += 'fullname = @fullname, ';
      inputs.fullname = fullname || null;
    }

    if (phone !== undefined) {
      updateQuery += 'phone = @phone, ';
      inputs.phone = phone || null;
    }

    // Xóa dấu phẩy cuối cùng
    updateQuery = updateQuery.replace(/,\s*$/, '');
    updateQuery += ' WHERE user_id = @user_id';

    await pool.request()
      .input('user_id', sql.VarChar(20), inputs.user_id)
      .input('email', sql.VarChar(100), inputs.email)
      .input('password', sql.VarChar(255), inputs.password)
      .input('role', sql.VarChar(10), inputs.role)
      .input('fullname', sql.NVarChar(255), inputs.fullname)
      .input('phone', sql.VarChar(15), inputs.phone)
      .query(updateQuery);

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi cập nhật tài khoản:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật tài khoản" });
  }
});

// Xóa tài khoản
app.delete('/api/users/:id', async (req, res) => {
  const user_id = req.params.id;

  try {
    const pool = await sql.connect(dbConfig);

    // Kiểm tra user tồn tại
    const userCheck = await pool.request()
      .input('user_id', sql.VarChar(20), user_id)
      .query('SELECT 1 FROM [User] WHERE user_id = @user_id');

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản" });
    }

    // Không cho xóa tài khoản admin
    const isAdmin = await pool.request()
      .input('user_id', sql.VarChar(20), user_id)
      .query('SELECT 1 FROM [User] WHERE user_id = @user_id AND role = "admin"');

    if (isAdmin.recordset.length > 0) {
      return res.status(400).json({ error: "Không thể xóa tài khoản admin" });
    }

    // Xóa user
    await pool.request()
      .input('user_id', sql.VarChar(20), user_id)
      .query('DELETE FROM [User] WHERE user_id = @user_id');

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản:", error);
    res.status(500).json({ error: "Lỗi server khi xóa tài khoản" });
  }
});