CREATE DATABASE WarehouseManagement;
USE WarehouseManagement;

-- Bảng Người dùng
CREATE TABLE [User] (
    user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    [password] VARCHAR(255) NOT NULL,
    fullname NVARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'staff')),
);

-- Bảng Nhà cung cấp
CREATE TABLE Supplier (
    supplier_id VARCHAR(20) PRIMARY KEY,
    supplier_name NVARCHAR(255) NOT NULL,
    contact_person NVARCHAR(100) NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE,
    address NVARCHAR(500) NULL
);

-- Bảng Kho hàng
CREATE TABLE Warehouse (
    warehouse_id VARCHAR(20) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    location NVARCHAR(500) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    current_capacity INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL,
);

-- Bảng Danh mục sản phẩm
CREATE TABLE Category (
    category_id VARCHAR(20) PRIMARY KEY,
    category_name NVARCHAR(255) NOT NULL,
    description NVARCHAR(500) NULL
);

-- Bảng Sản phẩm
CREATE TABLE Products (
    product_id VARCHAR(20) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    category_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    production_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    supplier_id VARCHAR(20) NULL,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
        ON DELETE NO ACTION ON UPDATE CASCADE
);

-- Bảng Tồn kho
CREATE TABLE Inventory (
    warehouse_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    PRIMARY KEY (warehouse_id, product_id),
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Nhập hàng
CREATE TABLE Import (
    import_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    total_value DECIMAL(18,2) NOT NULL CHECK (total_value >= 0),
    import_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    supplier_id VARCHAR(20) NULL,
    notes NVARCHAR(1000) NULL,
    FOREIGN KEY (user_id) REFERENCES [User](user_id) 
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) 
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) 
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Bảng Xuất hàng
CREATE TABLE Export (
    export_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    warehouse_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    total_value DECIMAL(18,2) NOT NULL CHECK (total_value >= 0),
    export_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_info NVARCHAR(500) NULL,
    notes NVARCHAR(1000) NULL,
    FOREIGN KEY (user_id) REFERENCES [User](user_id) 
        ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(product_id) 
        ON DELETE NO ACTION ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) 
        ON DELETE NO ACTION ON UPDATE CASCADE
);

-- Bảng Báo cáo
CREATE TABLE Report (
    report_id VARCHAR(20) PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('import', 'export', 'monthly', 'quarterly', 'annual', 'summary', 'inventory')),
    generated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(20) NOT NULL,
    content NVARCHAR(MAX) NULL,
    FOREIGN KEY (user_id) REFERENCES [User](user_id) 
        ON DELETE NO ACTION ON UPDATE CASCADE
);

-- Tạo các index để tối ưu hiệu suất
CREATE INDEX idx_product_name ON Products(name);
CREATE INDEX idx_product_category ON Products(category_id);
CREATE INDEX idx_product_barcode ON Products(barcode);
CREATE INDEX idx_import_date ON Import(import_date);
CREATE INDEX idx_export_date ON Export(export_date);
CREATE INDEX idx_inventory_product ON Inventory(product_id);
CREATE INDEX idx_inventory_warehouse ON Inventory(warehouse_id);

INSERT INTO [User] (user_id, username, [password], fullname, phone, email, role)
VALUES
('US001', 'admin1', 'hashed_password_1', N'Nguyễn Văn A', '0912345678', 'admin1@company.com', 'admin'),
('US002', 'staff1', 'hashed_password_2', N'Trần Thị B', '0912345679', 'staff1@company.com', 'staff'),
('US003', 'staff2', 'hashed_password_3', N'Lê Văn C', '0912345680', 'staff2@company.com', 'staff'),
('US004', 'admin2', 'hashed_password_4', N'Phạm Thị D', '0912345681', 'admin2@company.com', 'admin'),
('US005', 'staff3', 'hashed_password_5', N'Hoàng Văn E', '0912345682', 'staff3@company.com', 'staff'),
('US006', 'staff4', 'hashed_password_6', N'Vũ Thị F', '0912345683', 'staff4@company.com', 'staff'),
('US007', 'staff5', 'hashed_password_7', N'Đặng Văn G', '0912345684', 'staff5@company.com', 'staff'),
('US008', 'admin3', 'hashed_password_8', N'Bùi Thị H', '0912345685', 'admin3@company.com', 'admin'),
('US009', 'staff6', 'hashed_password_9', N'Mai Văn I', '0912345686', 'staff6@company.com', 'staff'),
('US010', 'staff7', 'hashed_password_10', N'Lý Thị K', '0912345687', 'staff7@company.com', 'staff');

INSERT INTO Supplier (supplier_id, supplier_name, contact_person, phone, email, address)
VALUES
('SUP001', N'Công ty TNHH Thực phẩm ABC', N'Nguyễn Văn X', '0987654321', 'abc.food@supplier.com', N'123 Đường Lê Lợi, Q.1, TP.HCM'),
('SUP002', N'Công ty CP Đồ uống DEF', N'Trần Thị Y', '0987654322', 'def.drink@supplier.com', N'456 Đường Nguyễn Huệ, Q.1, TP.HCM'),
('SUP003', N'Công ty TNHH Điện máy GHI', N'Lê Văn Z', '0987654323', 'ghi.elec@supplier.com', N'789 Đường Pasteur, Q.3, TP.HCM'),
('SUP004', N'Công ty CP Văn phòng phẩm JKL', N'Phạm Thị W', '0987654324', 'jkl.stationery@supplier.com', N'321 Đường CMT8, Q.10, TP.HCM'),
('SUP005', N'Công ty TNHH Mỹ phẩm MNO', N'Hoàng Văn V', '0987654325', 'mno.cosmetic@supplier.com', N'654 Đường Lê Văn Sỹ, Q.3, TP.HCM'),
('SUP006', N'Công ty CP Thời trang PQR', N'Vũ Thị U', '0987654326', 'pqr.fashion@supplier.com', N'987 Đường Hai Bà Trưng, Q.1, TP.HCM'),
('SUP007', N'Công ty TNHH Gia dụng STU', N'Đặng Văn T', '0987654327', 'stu.houseware@supplier.com', N'147 Đường Lê Duẩn, Q.1, TP.HCM'),
('SUP008', N'Công ty CP Thiết bị văn phòng VWX', N'Bùi Thị S', '0987654328', 'vwx.office@supplier.com', N'258 Đường Nguyễn Đình Chiểu, Q.3, TP.HCM'),
('SUP009', N'Công ty TNHH Đồ chơi trẻ em YZA', N'Mai Văn R', '0987654329', 'yza.toys@supplier.com', N'369 Đường Võ Văn Tần, Q.3, TP.HCM'),
('SUP010', N'Công ty CP Sách và Văn hóa phẩm BCD', N'Lý Thị Q', '0987654330', 'bcd.books@supplier.com', N'159 Đường Trần Hưng Đạo, Q.5, TP.HCM');

INSERT INTO Warehouse (warehouse_id, name, location, capacity, current_capacity, status)
VALUES
('WH001', N'Kho trung tâm Q1', N'Tầng hầm tòa nhà A, Q.1, TP.HCM', 5000, 2500, 'active'),
('WH002', N'Kho phía Đông', N'Số 1 Đường Xuyên Á, Q.2, TP.HCM', 3000, 1200, 'active'),
('WH003', N'Kho phía Tây', N'Số 15 Đường Lê Trọng Tấn, Q.Tân Phú, TP.HCM', 4000, 1800, 'active'),
('WH004', N'Kho lạnh thực phẩm', N'Số 22 Đường Nguyễn Thị Minh Khai, Q.3, TP.HCM', 2000, 800, 'active'),
('WH005', N'Kho hàng điện tử', N'Số 5 Đường Võ Văn Kiệt, Q.5, TP.HCM', 3500, 2000, 'active'),
('WH006', N'Kho tổng hợp Q7', N'Số 78 Đường Nguyễn Thị Thập, Q.7, TP.HCM', 4500, 3000, 'active'),
('WH007', N'Kho hàng dễ vỡ', N'Số 12 Đường Lê Văn Việt, Q.9, TP.HCM', 1500, 500, 'maintenance'),
('WH008', N'Kho hàng hóa chất', N'Số 45 Đường Điện Biên Phủ, Q.Bình Thạnh, TP.HCM', 2500, 1000, 'active'),
('WH009', N'Kho hàng giá trị cao', N'Tầng 3 tòa nhà B, Q.1, TP.HCM', 1000, 400, 'active'),
('WH010', N'Kho dự phòng', N'Số 90 Đường Phạm Văn Đồng, Q.Thủ Đức, TP.HCM', 5000, 0, 'closed');

INSERT INTO Category (category_id, category_name, description)
VALUES
('CAT001', N'Thực phẩm', N'Các loại thực phẩm đóng gói, đồ ăn nhanh'),
('CAT002', N'Đồ uống', N'Nước giải khát, nước đóng chai, đồ uống có cồn'),
('CAT003', N'Điện tử', N'Thiết bị điện tử gia dụng, linh kiện'),
('CAT004', N'Văn phòng phẩm', N'Dụng cụ văn phòng, giấy tờ, bút viết'),
('CAT005', N'Mỹ phẩm', N'Sản phẩm chăm sóc cá nhân, làm đẹp'),
('CAT006', N'Thời trang', N'Quần áo, phụ kiện thời trang'),
('CAT007', N'Gia dụng', N'Đồ dùng gia đình, nội thất nhỏ'),
('CAT008', N'Đồ chơi', N'Đồ chơi trẻ em, đồ chơi giáo dục'),
('CAT009', N'Sách', N'Sách văn học, sách giáo khoa, tạp chí'),
('CAT010', N'Hóa chất', N'Chất tẩy rửa, hóa chất gia dụng');

INSERT INTO Products (product_id, name, barcode, category_id, quantity, unit_price, production_date, expiration_date, supplier_id)
VALUES
('PD001', N'Mì gói Hảo Hảo', '8934586001001', 'CAT001', 500, 3500.00, '2023-01-15', '2024-01-15', 'SUP001'),
('PD002', N'Nước suối Lavie 500ml', '8938500011002', 'CAT002', 1000, 5000.00, '2023-02-20', '2024-02-20', 'SUP002'),
('PD003', N'Bếp từ Sunhouse', '8935256003003', 'CAT003', 50, 1200000.00, '2023-03-10', '2026-03-10', 'SUP003'),
('PD004', N'Bút bi Thiên Long', '8936074004004', 'CAT004', 2000, 5000.00, '2023-01-05', '2025-01-05', 'SUP004'),
('PD005', N'Son Black Rouge', '8809446005005', 'CAT005', 300, 250000.00, '2022-12-01', '2024-12-01', 'SUP005'),
('PD006', N'Áo thun nam cổ tròn', '8938523006006', 'CAT006', 150, 120000.00, '2023-04-15', '2025-04-15', 'SUP006'),
('PD007', N'Nồi cơm điện Toshiba', '4905527007007', 'CAT007', 80, 1500000.00, '2023-03-01', '2026-03-01', 'SUP007'),
('PD008', N'Xếp hình Lego', '5702016008008', 'CAT008', 120, 800000.00, '2023-02-15', '2028-02-15', 'SUP009'),
('PD009', N'Sách Đắc Nhân Tâm', '8935248009009', 'CAT009', 200, 80000.00, '2023-01-20', '2030-01-20', 'SUP010'),
('PD010', N'Nước rửa chén Sunlight', '8934865010010', 'CAT010', 400, 35000.00, '2023-04-01', '2025-04-01', 'SUP008');

INSERT INTO Inventory (warehouse_id, product_id, stock_quantity)
VALUES
('WH001', 'PD001', 200),
('WH001', 'PD002', 300),
('WH001', 'PD003', 20),
('WH002', 'PD004', 500),
('WH002', 'PD005', 100),
('WH003', 'PD006', 80),
('WH003', 'PD007', 30),
('WH004', 'PD008', 50),
('WH004', 'PD009', 100),
('WH005', 'PD010', 150);

INSERT INTO Import (import_id, user_id, product_id, warehouse_id, quantity, unit_price, total_value, supplier_id, notes)
VALUES
('IMP001', 'US002', 'PD001', 'WH001', 100, 3000.00, 300000.00, 'SUP001', N'Nhập hàng đầu tháng'),
('IMP002', 'US002', 'PD002', 'WH001', 200, 4500.00, 900000.00, 'SUP002', N'Nhập nước suối'),
('IMP003', 'US003', 'PD003', 'WH001', 10, 1000000.00, 10000000.00, 'SUP003', N'Nhập bếp từ'),
('IMP004', 'US003', 'PD004', 'WH002', 300, 4000.00, 1200000.00, 'SUP004', N'Nhập văn phòng phẩm'),
('IMP005', 'US004', 'PD005', 'WH002', 50, 200000.00, 10000000.00, 'SUP005', N'Nhập mỹ phẩm'),
('IMP006', 'US004', 'PD006', 'WH003', 40, 100000.00, 4000000.00, 'SUP006', N'Nhập thời trang'),
('IMP007', 'US005', 'PD007', 'WH003', 15, 1300000.00, 19500000.00, 'SUP007', N'Nhập gia dụng'),
('IMP008', 'US005', 'PD008', 'WH004', 20, 700000.00, 14000000.00, 'SUP009', N'Nhập đồ chơi'),
('IMP009', 'US006', 'PD009', 'WH004', 50, 70000.00, 3500000.00, 'SUP010', N'Nhập sách'),
('IMP010', 'US006', 'PD010', 'WH005', 100, 30000.00, 3000000.00, 'SUP008', N'Nhập hóa chất');

INSERT INTO Export (export_id, user_id, product_id, warehouse_id, quantity, unit_price, total_value, customer_info, notes)
VALUES
('EXP001', 'US002', 'PD001', 'WH001', 50, 3500.00, 175000.00, N'Siêu thị Coopmart', N'Xuất cho siêu thị'),
('EXP002', 'US002', 'PD002', 'WH001', 100, 5000.00, 500000.00, N'Cửa hàng tiện lợi Circle K', N'Xuất nước suối'),
('EXP003', 'US003', 'PD003', 'WH001', 5, 1200000.00, 6000000.00, N'Đại lý điện máy Nguyễn Kim', N'Xuất bếp từ'),
('EXP004', 'US003', 'PD004', 'WH002', 100, 5000.00, 500000.00, N'Công ty TNHH ABC', N'Xuất văn phòng phẩm'),
('EXP005', 'US004', 'PD005', 'WH002', 30, 250000.00, 7500000.00, N'Cửa hàng mỹ phẩm Sasa', N'Xuất mỹ phẩm'),
('EXP006', 'US004', 'PD006', 'WH003', 20, 120000.00, 2400000.00, N'Shop thời trang Ivy', N'Xuất thời trang'),
('EXP007', 'US005', 'PD007', 'WH003', 10, 1500000.00, 15000000.00, N'Siêu thị Điện máy Xanh', N'Xuất gia dụng'),
('EXP008', 'US005', 'PD008', 'WH004', 15, 800000.00, 12000000.00, N'Cửa hàng đồ chơi Kids Plaza', N'Xuất đồ chơi'),
('EXP009', 'US006', 'PD009', 'WH004', 25, 80000.00, 2000000.00, N'Nhà sách Fahasa', N'Xuất sách'),
('EXP010', 'US006', 'PD010', 'WH005', 50, 35000.00, 1750000.00, N'Siêu thị Big C', N'Xuất hóa chất');

INSERT INTO Report (report_id, report_type, user_id, content)
VALUES
('REP001', 'monthly', 'US001', N'Báo cáo nhập xuất tồn tháng 1/2023'),
('REP002', 'monthly', 'US001', N'Báo cáo nhập xuất tồn tháng 2/2023'),
('REP003', 'monthly', 'US001', N'Báo cáo nhập xuất tồn tháng 3/2023'),
('REP004', 'quarterly', 'US004', N'Báo cáo quý 1 năm 2023'),
('REP005', 'import', 'US002', N'Báo cáo nhập hàng tháng 4/2023'),
('REP006', 'export', 'US003', N'Báo cáo xuất hàng tháng 4/2023'),
('REP007', 'inventory', 'US005', N'Kiểm kê kho tháng 4/2023'),
('REP008', 'monthly', 'US001', N'Báo cáo nhập xuất tồn tháng 4/2023'),
('REP009', 'summary', 'US004', N'Tổng hợp 6 tháng đầu năm 2023'),
('REP010', 'annual', 'US001', N'Báo cáo tổng kết năm 2023');

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

-- Tạo login trên server
CREATE LOGIN WarehouseManagementRemote WITH PASSWORD = 'fit@vmiaru';

-- Tạo user trong database (ví dụ: WarehouseManagement)
USE WarehouseManagement;
CREATE USER WarehouseManagementRemote FOR LOGIN WarehouseManagementRemote;

-- Cấp quyền (toàn quyền DB)
ALTER ROLE db_owner ADD MEMBER WarehouseManagementRemote;


SELECT name FROM sys.server_principals WHERE name = 'WarehouseManagementRemote';
EXEC sp_helplogins 'WarehouseManagementRemote';

SELECT r.*, u.fullname as user_name 
      FROM Report r
      LEFT JOIN [User] u ON r.user_id = u.user_id
      ORDER BY r.generated_date DESC

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