<<<<<<< HEAD
﻿-- Bảng Người dùng
=======

CREATE DATABASE WarehouseManagement;
USE WarehouseManagement;

-- Bảng Người dùng
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
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
    contact_person NVARCHAR(100),
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) UNIQUE,
    address NVARCHAR(500)
);

-- Bảng Kho hàng
CREATE TABLE Warehouse (
    warehouse_id VARCHAR(20) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    location NVARCHAR(500) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    current_capacity INT NOT NULL DEFAULT 0 CHECK (current_capacity >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'maintenance', 'closed')),
);

-- Bảng Danh mục sản phẩm
CREATE TABLE Category (
    category_id VARCHAR(20) PRIMARY KEY,
    category_name NVARCHAR(255) NOT NULL UNIQUE,
    description NVARCHAR(500)
);

-- Bảng Sản phẩm
CREATE TABLE Products (
    product_id VARCHAR(20) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    category_id VARCHAR(20),
    quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    production_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    supplier_id VARCHAR(20) NULL,
    CONSTRAINT FK_Product_Supplier FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT FK_Product_Category FOREIGN KEY (category_id) REFERENCES Category(category_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT CK_Product_Date CHECK (expiration_date > production_date)
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
    warehouse_id VARCHAR(20) NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity > 0),
    total_value DECIMAL(18,2) NOT NULL,
    import_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes NVARCHAR(1000),
    FOREIGN KEY (user_id) REFERENCES [User](user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Chi tiết Nhập hàng
CREATE TABLE Import_Detail (
    import_detail_id VARCHAR(20) PRIMARY KEY,
    import_id VARCHAR(20) NOT NULL,
    barcode VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    total_value AS (quantity * unit_price) PERSISTED,
    FOREIGN KEY (import_id) REFERENCES Import(import_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
);

-- Bảng Xuất hàng
CREATE TABLE Export (
    export_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity > 0),
    total_value DECIMAL(18,2) NOT NULL,
    export_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_info NVARCHAR(500),
    notes NVARCHAR(1000),
    FOREIGN KEY (user_id) REFERENCES [User](user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Chi tiết Xuất hàng
CREATE TABLE Export_Detail (
    export_detail_id VARCHAR(20) PRIMARY KEY,
    export_id VARCHAR(20) NOT NULL,
    barcode VARCHAR(100) NOT NULL,
	warehouse_id VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    total_value AS (quantity * unit_price) PERSISTED,
    FOREIGN KEY (export_id) REFERENCES Export(export_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
	FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Báo cáo
CREATE TABLE Report (
    report_id VARCHAR(20) PRIMARY KEY,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('import', 'export', 'inventory')),
    generated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(20) NOT NULL,
    content NVARCHAR(MAX),
    FOREIGN KEY (user_id) REFERENCES [User](user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Bảng Thiết bị
CREATE TABLE Devices (
    device_id VARCHAR(100) PRIMARY KEY NOT NULL,  
    device_name NVARCHAR(100) NOT NULL,   
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('import', 'export', 'check')), 
    device_description NVARCHAR(MAX)      
);
<<<<<<< HEAD

-- Bảng Phân quyền thiết bị
CREATE TABLE DevicesAuthorization (
    DA_id VARCHAR(20) PRIMARY KEY NOT NULL,  
    device_id VARCHAR(100) NOT NULL UNIQUE,      
    assigned_userID VARCHAR(20) NOT NULL,          
    FOREIGN KEY (device_id) REFERENCES Devices(device_id) 
	ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assigned_userID) REFERENCES [User](user_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
);
=======
SELECT * FROM Devices ORDER BY device_name
-- Bảng Phân quyền thiết bị
CREATE TABLE DevicesAuthorization (
    DA_id VARCHAR(20) PRIMARY KEY NOT NULL,  
    device_id VARCHAR(100) NOT NULL UNIQUE,      
    assigned_userID VARCHAR(20) NOT NULL,          
    FOREIGN KEY (device_id) REFERENCES Devices(device_id) 
	ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assigned_userID) REFERENCES [User](user_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
);
SELECT * FROM DevicesAuthorization

-- Tính tổng số lượng sản phẩm khi nhập hàng
CREATE TRIGGER trg_Update_Product_Quantity_Import
ON Import_Detail
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE p
    SET quantity = ISNULL((
        SELECT SUM(id.quantity)
        FROM Import_Detail id
        WHERE id.barcode = p.barcode
    ), 0)
    FROM Products p;
END;

-- Tính tổng số lượng sản phẩm khi xuất hàng
CREATE OR ALTER TRIGGER trg_Update_Product_Quantity_Export
ON Export_Detail
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE p
    SET quantity = ISNULL(imported.total_import, 0) - ISNULL(exported.total_export, 0)
    FROM Products p
    OUTER APPLY (
        SELECT SUM(id.quantity) AS total_import
        FROM Import_Detail id
        WHERE id.barcode = p.barcode
    ) imported
    OUTER APPLY (
        SELECT SUM(ed.quantity) AS total_export
        FROM Export_Detail ed
        WHERE ed.barcode = p.barcode
    ) exported;
END;

-- Tính toán các sản phẩm tồn kho (quá hạn - chỉ nhập không xuất)
CREATE OR ALTER TRIGGER trg_Add_Inventory_Expired_Or_OnlyImport
ON Import_Detail
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO Inventory (warehouse_id, product_id, stock_quantity)
    SELECT DISTINCT i.warehouse_id, p.product_id, 0
    FROM Import_Detail id
    JOIN Import i ON id.import_id = i.import_id
    JOIN Products p ON id.barcode = p.barcode
    WHERE
        (p.expiration_date < GETDATE())
        OR
        (NOT EXISTS (
            SELECT 1 FROM Export_Detail ed WHERE ed.barcode = id.barcode
        ))
    AND NOT EXISTS (
        SELECT 1 FROM Inventory inv
        WHERE inv.product_id = p.product_id AND inv.warehouse_id = i.warehouse_id
    );
END;

-- Tính số lượng lưu trữ các kho khi nhập hàng
CREATE OR ALTER TRIGGER trg_Update_Warehouse_Capacity_Import
ON Import
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE w
    SET current_capacity = ISNULL((
        SELECT SUM(i.total_quantity)
        FROM Import i
        WHERE i.warehouse_id = w.warehouse_id
    ), 0)
    FROM Warehouse w;
END;

-- Tính số lượng lưu trữ các kho khi xuất hàng
CREATE OR ALTER TRIGGER trg_Update_Warehouse_Capacity_Export
ON Export_Detail
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE w
    SET current_capacity = 
        ISNULL((SELECT SUM(i.total_quantity) FROM Import i WHERE i.warehouse_id = w.warehouse_id), 0)
        - ISNULL((SELECT SUM(ed.quantity) FROM Export_Detail ed WHERE ed.warehouse_id = w.warehouse_id), 0)
    FROM Warehouse w;
END;


-- Tạo login trên server
CREATE LOGIN WarehouseManagementRemote WITH PASSWORD = 'fit@vmiaru';

-- Tạo user trong database (ví dụ: WarehouseManagement)
USE WarehouseManagement;
CREATE USER WarehouseManagementRemote FOR LOGIN WarehouseManagementRemote;

-- Cấp quyền (toàn quyền DB)
ALTER ROLE db_owner ADD MEMBER WarehouseManagementRemote;


SELECT name FROM sys.server_principals WHERE name = 'WarehouseManagementRemote';
EXEC sp_helplogins 'WarehouseManagementRemote';


-- Bảng Người dùng
INSERT INTO [User] (user_id, username, [password], fullname, phone, email, role) VALUES
('U001', 'admin', '123456789', N'Phạm Huy Hoàng', '0901234567', 'admin1@example.com', 'admin'),
('U002', 'hoang', '123456789', N'Phạm Huy Hoàng', '0902345678', 'staff1@example.com', 'staff'),
('U003', 'hieu', '123456789', N'Lê Trung Hiếu', '0903456789', 'staff2@example.com', 'staff'),
('U004', 'hung', '123456789', N'Hoàng Khánh Hùng', '0904567890', 'staff3@example.com', 'staff'),
('U005', 'thuc', '123456789', N'Đào Xuân Thức', '0905678901', 'staff4@example.com', 'staff'),
('U006', 'staff5', 'password123', N'Võ Thị F', '0906789012', 'staff5@example.com', 'staff'),
('U007', 'staff6', 'password123', N'Phan Văn G', '0907890123', 'staff6@example.com', 'staff'),
('U008', 'staff7', 'password123', N'Đặng Thị H', '0908901234', 'staff7@example.com', 'staff'),
('U009', 'staff8', 'password123', N'Bùi Văn I', '0909012345', 'staff8@example.com', 'staff'),
('U010', 'staff9', 'password123', N'Toàn Văn K', '0910123456', 'staff9@example.com', 'staff');

-- Bảng Nhà cung cấp
INSERT INTO Supplier (supplier_id, supplier_name, contact_person, phone, email, address) VALUES
('SUP001', N'Công ty Thực phẩm Việt', N'Nguyễn Văn A', '0901001001', 'contact1@vietfood.vn', N'12 Nguyễn Trãi, Hà Nội'),
('SUP002', N'Công ty Dược phẩm An Khang', N'Trần Thị B', '0902002002', 'contact2@ankhang.vn', N'45 Lê Lợi, TP.HCM'),
('SUP003', N'Công ty Sữa Việt Nam', N'Phạm Văn C', '0903003003', 'contact3@suvina.vn', N'3 Lê Duẩn, Đà Nẵng'),
('SUP004', N'Công ty Nước Giải Khát Quốc Tế', N'Lê Thị D', '0904004004', 'contact4@ngkqt.vn', N'98 Phạm Văn Đồng, Cần Thơ'),
('SUP005', N'Công ty Thiết bị Y Tế Việt', N'Hoàng Văn E', '0905005005', 'contact5@tbviet.vn', N'22 Điện Biên Phủ, Hải Phòng'),
('SUP006', N'Công ty Gia Vị Nam Dương', N'Nguyễn Thị F', '0906006006', 'contact6@namduong.vn', N'88 Nguyễn Văn Linh, Quảng Ninh'),
('SUP007', N'Công ty Đồ Điện Nhật Bản', N'Lê Văn G', '0907007007', 'contact7@dodiennhat.vn', N'60 Trần Hưng Đạo, Nghệ An'),
('SUP008', N'Công ty Nội Thất Hòa Phát', N'Phan Thị H', '0908008008', 'contact8@hoaphat.vn', N'101 Nguyễn Huệ, Thanh Hóa'),
('SUP009', N'Công ty Đèn LED Sao Việt', N'Bùi Văn I', '0909009009', 'contact9@saovietled.vn', N'5A Trường Chinh, Hà Nội'),
('SUP010', N'Công ty Bao Bì Bình Minh', N'Doãn Thị K', '0910001000', 'contact10@binhminhpack.vn', N'234 Tôn Đức Thắng, TP.HCM');

-- Bảng Kho hàng
INSERT INTO Warehouse (warehouse_id, name, location, capacity, current_capacity, status) VALUES
('WH001', N'Kho Miền Bắc', N'Hà Nội, Việt Nam', 10000, 2000, 'active'),
('WH002', N'Kho Miền Nam', N'Hồ Chí Minh, Việt Nam', 15000, 5000, 'active'),
('WH003', N'Kho Trung', N'Đà Nẵng, Việt Nam', 8000, 1000, 'maintenance'),
('WH004', N'Kho Bình Dương', N'Bình Dương, Việt Nam', 12000, 3000, 'active'),
('WH005', N'Kho Long An', N'Long An, Việt Nam', 9000, 1000, 'active'),
('WH006', N'Kho Cần Thơ', N'Cần Thơ, Việt Nam', 7000, 2000, 'active'),
('WH007', N'Kho Hải Phòng', N'Hải Phòng, Việt Nam', 9500, 4000, 'maintenance'),
('WH008', N'Kho Quảng Ninh', N'Quảng Ninh, Việt Nam', 6000, 1200, 'active'),
('WH009', N'Kho Nghệ An', N'Nghệ An, Việt Nam', 8500, 1500, 'active'),
('WH010', N'Kho Thanh Hóa', N'Thanh Hóa, Việt Nam', 8000, 2000, 'closed');

-- Bảng Danh mục sản phẩm
INSERT INTO Category (category_id, category_name, description) VALUES
('CAT001', N'Thực phẩm đóng gói', N'Thực phẩm chế biến, đóng gói sẵn, dùng ngay hoặc cần chế biến nhẹ.'),
('CAT002', N'Nước giải khát', N'Nước ngọt, nước khoáng, nước ép trái cây, bia,...'),
('CAT003', N'Dược phẩm', N'Thuốc chữa bệnh, thực phẩm chức năng.'),
('CAT004', N'Sữa và sản phẩm từ sữa', N'Sữa tươi, sữa chua, bơ, phô mai.'),
('CAT005', N'Đồ gia dụng', N'Dụng cụ nhà bếp, thiết bị gia đình nhỏ.'),
('CAT006', N'Thiết bị y tế', N'Máy đo huyết áp, nhiệt kế, dụng cụ y tế.'),
('CAT007', N'Gia vị', N'Muối, tiêu, nước mắm, dầu ăn, gia vị nấu ăn.'),
('CAT008', N'Đồ điện tử', N'Tivi, máy lạnh, tủ lạnh, điện thoại, laptop.'),
('CAT009', N'Nội thất', N'Bàn ghế, tủ, giường, sofa.'),
('CAT010', N'Bao bì', N'Túi nilon, thùng carton, hộp giấy, màng PE.');

-- Bảng Sản phẩm
INSERT INTO Products (product_id, name, barcode, category_id, quantity, unit_price, production_date, expiration_date, supplier_id)
VALUES
('P001', N'Mì ăn liền Hảo Hảo', '8934567890123', 'CAT001', 500, 3500, '2025-03-01', '2026-03-01', 'SUP001'),
('P002', N'Nước suối Lavie 500ml', '8936017360136', 'CAT002', 1000, 4500, '2025-03-15', '2027-03-15', 'SUP002'),
('P003', N'Thuốc cảm Coldi-B', '8935082497410', 'CAT003', 300, 12000, '2025-02-20', '2027-02-20', 'SUP003'),
('P004', N'Sữa tươi Vinamilk 1L', '8934567890451', 'CAT004', 800, 32000, '2025-04-01', '2026-04-01', 'SUP004'),
('P005', N'Nồi cơm điện Sharp 1.8L', '8934567890567', 'CAT005', 100, 750000, '2024-12-01', '2030-12-01', 'SUP005'),
('P006', N'Máy đo huyết áp Omron', '8934567890674', 'CAT006', 50, 950000, '2025-01-10', '2029-01-10', 'SUP006'),
('P007', N'Nước mắm Nam Ngư 500ml', '8934567890781', 'CAT007', 700, 25000, '2025-03-20', '2027-03-20', 'SUP007'),
('P008', N'Tivi LG 43 inch 4K', '8934567890898', 'CAT008', 30, 7400000, '2024-11-25', '2031-11-25', 'SUP008'),
('P009', N'Bàn làm việc Hòa Phát', '8934567890911', 'CAT009', 40, 1850000, '2025-02-05', '2035-02-05', 'SUP009'),
('P010', N'Thùng carton 60x40x40cm', '8934567890928', 'CAT010', 2000, 15000, '2025-03-01', '2028-03-01', 'SUP010');

-- Bảng Tồn kho
INSERT INTO Inventory (warehouse_id, product_id, stock_quantity) VALUES
('WH001', 'P001', 300),
('WH002', 'P002', 600),
('WH003', 'P003', 150),
('WH004', 'P004', 500),
('WH005', 'P005', 50),
('WH006', 'P006', 30),
('WH007', 'P007', 400),
('WH008', 'P008', 20),
('WH009', 'P009', 25),
('WH010', 'P010', 1000);

-- Bảng Nhập hàng
INSERT INTO Import (import_id, user_id, warehouse_id, total_quantity, total_value, import_date, notes) VALUES
('IMP001', 'U001', 'WH001', 300, 1050000, '2025-04-20', N'Nhập mì Hảo Hảo'),
('IMP002', 'U001', 'WH002', 600, 2700000, '2025-04-21', N'Nhập nước suối Lavie'),
('IMP003', 'U002', 'WH003', 150, 1800000, '2025-04-22', N'Nhập thuốc cảm Coldi-B'),
('IMP004', 'U002', 'WH004', 500, 16000000, '2025-04-23', N'Nhập sữa Vinamilk'),
('IMP005', 'U001', 'WH005', 50, 37500000, '2025-04-24', N'Nhập nồi cơm điện Sharp');

-- Bảng Chi tiết nhập hàng
INSERT INTO Import_Detail (import_detail_id, import_id, barcode, quantity, unit_price) VALUES
('IMD001', 'IMP001', '8934567890123', 300, 3500),
('IMD002', 'IMP002', '8936017360136', 600, 4500),
('IMD003', 'IMP003', '8935082497410', 150, 12000),
('IMD004', 'IMP004', '8934567890451', 500, 32000),
('IMD005', 'IMP005', '8934567890567', 50, 750000);

-- Bảng Xuât hàng
INSERT INTO Export (export_id, user_id, total_quantity, total_value, export_date, customer_info, notes) VALUES
('EXP001', 'U001', 100, 350000, '2025-04-25', N'Cửa hàng Tạp hóa Minh', N'Xuất mì ăn liền Hảo Hảo'),
('EXP002', 'U002', 200, 900000, '2025-04-26', N'Siêu thị Coopmart', N'Xuất nước suối Lavie'),
('EXP003', 'U002', 50, 600000, '2025-04-27', N'Nhà thuốc Đức Minh', N'Xuất thuốc cảm Coldi-B');

-- Bảng Chi tiết xuất hàng
INSERT INTO Export_Detail (export_detail_id, export_id, barcode, warehouse_id, quantity, unit_price) VALUES
('EXD001', 'EXP001', '8934567890123', 'WH001', 100, 3500),
('EXD002', 'EXP002', '8936017360136', 'WH002', 200, 4500),
('EXD003', 'EXP003', '8935082497410', 'WH003', 50, 12000);

-- Bảng Thiết bị
INSERT INTO Devices (device_id, device_name, device_type, device_description) VALUES
('DEV001', N'Máy quét nhập hàng', 'import', N'Dùng để nhập hàng vào kho'),
('DEV002', N'Máy quét xuất hàng', 'export', N'Dùng để xuất hàng ra khỏi kho'),
('DEV003', N'Máy quét kiểm hàng', 'check', N'Dùng để kiểm kê tồn kho');

-- Bảng Phân quyền thiết bị
INSERT INTO DevicesAuthorization (DA_id, device_id, assigned_userID) VALUES
('DA001', 'DEV001', 'U001');
>>>>>>> a20966ec234132fecfb86fc4bb8d68dde70d8c33
