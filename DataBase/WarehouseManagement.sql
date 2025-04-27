
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

		SELECT Import_Detail.*,
		Import.*,
		Import.total_value as total_value_import,
		[User].fullname,
		Warehouse.name as warehouse_name,
		Products.*,
		Supplier.*,
		Category.*
		FROM Import_Detail
		JOIN Import ON Import_Detail.import_id = Import.import_id
		JOIN [User] ON Import.[user_id] = [User].user_id
		JOIN Warehouse ON Import.warehouse_id = Warehouse.warehouse_id
		JOIN Products ON Import_Detail.barcode = Products.barcode
		JOIN Supplier ON Products.supplier_id = Supplier.supplier_id
		JOIN Category ON Products.category_id = Category.category_id
		WHERE Import.import_id = 'IP-b159811353b0'
		ORDER BY Import.import_date DESC
		SELECT 
        Import.*,
        [User].[fullname] as fullname,
        Warehouse.name as warehouse_name
      FROM Import 
      JOIN [User] ON Import.[user_id] = [User].[user_id]
      JOIN Warehouse ON Import.warehouse_id = Warehouse.warehouse_id
      ORDER BY Import.import_date DESC
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

-- Trigger: Tạo dòng trong Inventory nếu sản phẩm quá hạn hoặc chưa xuất
CREATE TRIGGER trg_AutoInsert_Inventory
ON Products
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Chèn vào Inventory nếu sản phẩm quá hạn hoặc chưa từng được xuất
    INSERT INTO Inventory (warehouse_id, product_id, stock_quantity)
    SELECT TOP 1 w.warehouse_id, p.product_id, 0
    FROM inserted p
    CROSS JOIN Warehouse w
    WHERE p.expiration_date < GETDATE()
       OR NOT EXISTS (
            SELECT 1 FROM Export_Detail ed
            WHERE ed.product_id = p.product_id
        )
      AND NOT EXISTS (
            SELECT 1 FROM Inventory i 
            WHERE i.product_id = p.product_id AND i.warehouse_id = w.warehouse_id
        );
END;

-- Trigger kiểm tra capacity của kho
CREATE TRIGGER trg_CheckWarehouseCapacity
ON Import
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra từng dòng được INSERT trong Import_Detail
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
        OUTER APPLY (
            SELECT SUM(stock_quantity) AS current_stock
            FROM Inventory inv
            WHERE inv.warehouse_id = i.warehouse_id
        ) AS inv_summary
        JOIN Import_Detail id ON id.import_id = i.import_id
        WHERE 
            ISNULL(inv_summary.current_stock, 0) + id.quantity > w.capacity
    )
    BEGIN
        RAISERROR ('Kho không đủ sức chứa cho số lượng hàng nhập. Vui lòng kiểm tra lại.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Nếu đủ sức chứa thì cho phép insert như bình thường
    INSERT INTO Import (
        import_id, user_id, warehouse_id, total_quantity,
        total_value, import_date, notes
    )
    SELECT 
        import_id, user_id, warehouse_id, total_quantity,
        total_value, import_date, notes
    FROM inserted;
END;


-- Cập nhật trường current_capacity trong bảng Warehouse mỗi khi Nhập hàng
CREATE TRIGGER trg_UpdateWarehouseCapacity_AfterImport
ON Import
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Cập nhật current_capacity cho từng kho, dựa trên Import_Detail
    UPDATE w
    SET w.current_capacity = w.current_capacity + id.quantity
    FROM Warehouse w
    JOIN inserted i ON w.warehouse_id = i.warehouse_id
    JOIN Import_Detail id ON id.import_id = i.import_id;
END;

-- Cập nhật trường current_capacity trong bảng Warehouse mỗi khi Xuất hàng
CREATE TRIGGER trg_UpdateWarehouseCapacity_AfterExport
ON Export
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Cập nhật current_capacity sau khi xuất, dựa trên Export_Detail
    UPDATE w
    SET w.current_capacity = w.current_capacity - ed.quantity
    FROM Warehouse w
    JOIN inserted e ON w.warehouse_id = e.warehouse_id
    JOIN Export_Detail ed ON ed.export_id = e.export_id;
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

