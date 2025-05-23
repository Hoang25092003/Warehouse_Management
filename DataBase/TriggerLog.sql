
--Ghi log Category
CREATE TRIGGER trg_Log_Category
ON Category
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(category_id AS VARCHAR),
            @description = CONCAT(N'Thêm danh mục: ', category_name)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE category_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(category_id AS VARCHAR),
            @description = CONCAT(N'Xóa danh mục: ', category_name)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE category_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.category_id AS VARCHAR),
            @description =
                ISNULL(
                    CASE WHEN i.category_name <> d.category_name THEN 
                        N'Tên danh mục: [' + ISNULL(d.category_name, 'NULL') + N'] → [' + ISNULL(i.category_name, 'NULL') + N']; '
                    ELSE '' END, ''
                ) +
                ISNULL(
                    CASE WHEN ISNULL(i.description, '') <> ISNULL(d.description, '') THEN 
                        N'Mô tả: [' + ISNULL(d.description, 'NULL') + N'] → [' + ISNULL(i.description, 'NULL') + N']; '
                    ELSE '' END, ''
                ),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.category_id = i.category_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.category_id = i.category_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.category_id = d.category_id;

        SET @action_type = 'UPDATE';
    END

     -- Chỉ ghi log nếu có thông tin mô tả (tránh ghi trống)
    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'Category', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END
GO

--Ghi log bảng Devices
CREATE TRIGGER trg_Log_Devices
ON Devices
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(device_id AS VARCHAR),
            @description = CONCAT(N'Thêm thiết bị: ', device_name)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE device_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(device_id AS VARCHAR),
            @description = CONCAT(N'Xóa thiết bị: ', device_name)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE device_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.device_id AS VARCHAR),
            @description =
                ISNULL(
                    CASE WHEN i.device_name <> d.device_name THEN
                        N'Tên thiết bị: [' + ISNULL(d.device_name, 'NULL') + N'] → [' + ISNULL(i.device_name, 'NULL') + N']; '
                    ELSE '' END, ''
                ) +
                ISNULL(
                    CASE WHEN i.device_type <> d.device_type THEN
                        N'Loại thiết bị: [' + ISNULL(d.device_type, 'NULL') + N'] → [' + ISNULL(i.device_type, 'NULL') + N']; '
                    ELSE '' END, ''
                ) +
                ISNULL(
                    CASE WHEN ISNULL(i.device_description, '') <> ISNULL(d.device_description, '') THEN
                        N'Mô tả: [' + ISNULL(d.device_description, 'NULL') + N'] → [' + ISNULL(i.device_description, 'NULL') + N']; '
                    ELSE '' END, ''
                ),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.device_id = i.device_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.device_id = i.device_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.device_id = d.device_id;

        SET @action_type = 'UPDATE';
    END

    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'Devices', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END
GO

--Ghi log bảng DevicesAuthorization
CREATE TRIGGER trg_Log_DevicesAuthorization
ON DevicesAuthorization
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(DA_id AS VARCHAR),
            @description = CONCAT(N'Thêm phân quyền thiết bị: ', device_id, ' cho người dùng', assigned_userID)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE DA_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(DA_id AS VARCHAR),
            @description = CONCAT(N'Xóa phân quyền thiết bị: ', device_id, ' cho người dùng', assigned_userID)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE DA_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.DA_id AS VARCHAR),
            @description =
                ISNULL(
                    CASE WHEN i.device_id <> d.device_id THEN
                        N'Thiết bị: [' + ISNULL(d.device_id, 'NULL') + N'] → [' + ISNULL(i.device_id, 'NULL') + N']; '
                    ELSE '' END, ''
                ) +
                ISNULL(
                    CASE WHEN i.assigned_userID <> d.assigned_userID THEN
                        N'Người dùng: [' + ISNULL(d.assigned_userID, 'NULL') + N'] → [' + ISNULL(i.assigned_userID, 'NULL') + N']; '
                    ELSE '' END, ''
                ),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.device_id = i.device_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.device_id = i.device_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.DA_id = d.DA_id;

        SET @action_type = 'UPDATE';
    END

    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'DevicesAuthorization', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END
GO

--Ghi log bảng Export
CREATE TRIGGER trg_Log_Export
ON Export
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @new_data NVARCHAR(MAX);
	

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(export_id AS VARCHAR),
            @description = CONCAT(N'Thực hiện xuất hàng ngày: ', export_date)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE export_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, new_data, is_undo)
    VALUES (@user_id, @action_type, 'Export', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @new_data, ISNULL(@is_undo, 0));
END
GO

-- Ghi log bảng Export_Detail
CREATE TRIGGER trg_Log_Export_Detail
ON Export_Detail
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10) = 'INSERT';
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
    DECLARE @barcode VARCHAR(50);
    DECLARE @warehouse_id VARCHAR(20);
    DECLARE @product_name NVARCHAR(255);
	DECLARE @warehouse_name NVARCHAR(255);
	DECLARE @new_data NVARCHAR(MAX);

    SELECT TOP 1 
        @record_id = CAST(export_detail_id AS VARCHAR),
        @barcode = barcode,
        @warehouse_id = warehouse_id
    FROM inserted;

	SET @new_data = (SELECT * FROM inserted WHERE export_detail_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

    SELECT @product_name = name FROM Products WHERE barcode = @barcode;
	SELECT @warehouse_name = name FROM Warehouse WHERE warehouse_id = @warehouse_id;

    SET @description = CONCAT(
        'Xuất sản phẩm: ', ISNULL(@product_name, 'Không rõ'), 
        ' (mã vạch: ', @barcode, 
        ') từ kho: ', @warehouse_name
    );

    INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, new_data, is_undo)
    VALUES (@user_id, @action_type, 'Export_Detail', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @new_data, ISNULL(@is_undo, 0));
END
GO

-- Ghi log bảng Import
CREATE TRIGGER trg_Log_Import
ON Import
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
	DECLARE @warehouse_id VARCHAR(20);
	DECLARE @warehouse_name NVARCHAR(255);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @import_date DATETIME;
	DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(import_id AS VARCHAR),
			@warehouse_id = warehouse_id,
			@import_date = import_date
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE import_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

		SELECT @warehouse_name = name FROM Warehouse WHERE warehouse_id = @warehouse_id;

		SET @description = CONCAT(N'Thực hiện nhập hàng ngày: ', @import_date, ' vào kho ', @warehouse_name)
        SET @action_type = 'INSERT';
    END

    INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, new_data, is_undo)
    VALUES (@user_id, @action_type, 'Import', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @new_data, ISNULL(@is_undo, 0));
END
GO

--Ghi log bảng Import_Detail
CREATE TRIGGER trg_Log_Import_Detail
ON Import_Detail
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @barcode VARCHAR(100);
	DECLARE @product_name NVARCHAR(255);
	DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(import_detail_id AS VARCHAR),
			@barcode = barcode
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE import_detail_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);
		
		SELECT @product_name = name FROM Products WHERE barcode = @barcode;

		SET @description = CONCAT(N'Nhập sản phẩm: ', @product_name, 'mã vạch: ', @barcode);
        SET @action_type = 'INSERT';
    END

    INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, new_data, is_undo)
    VALUES (@user_id, @action_type, 'Import_Detail', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @new_data, ISNULL(@is_undo, 0));
END
GO

--Ghi log bảng Products
CREATE TRIGGER trg_Log_Products
ON Products
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(product_id AS VARCHAR),
            @description = CONCAT(N'Thêm sản phẩm: ', name)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE product_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(product_id AS VARCHAR),
            @description = CONCAT(N'Xóa sản phẩm: ', name)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE product_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.product_id AS VARCHAR),
            @description = 
                ISNULL(CASE WHEN i.name <> d.name THEN N'Tên: [' + d.name + N'] → [' + i.name + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.barcode <> d.barcode THEN N'Mã vạch: [' + d.barcode + N'] → [' + i.barcode + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.category_id <> d.category_id THEN N'Danh mục: [' + ISNULL(d.category_id, 'NULL') + N'] → [' + ISNULL(i.category_id, 'NULL') + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.quantity <> d.quantity THEN N'Số lượng: [' + CAST(d.quantity AS NVARCHAR) + N'] → [' + CAST(i.quantity AS NVARCHAR) + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.unit_price <> d.unit_price THEN N'Đơn giá: [' + CAST(d.unit_price AS NVARCHAR) + N'] → [' + CAST(i.unit_price AS NVARCHAR) + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.production_date <> d.production_date THEN N'Ngày SX: [' + CONVERT(NVARCHAR, d.production_date, 23) + N'] → [' + CONVERT(NVARCHAR, i.production_date, 23) + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.expiration_date <> d.expiration_date THEN N'HSD: [' + CONVERT(NVARCHAR, d.expiration_date, 23) + N'] → [' + CONVERT(NVARCHAR, i.expiration_date, 23) + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.supplier_id <> d.supplier_id THEN N'Nhà cung cấp: [' + ISNULL(d.supplier_id, 'NULL') + N'] → [' + ISNULL(i.supplier_id, 'NULL') + N']; ' ELSE '' END, ''),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.product_id = i.product_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.product_id = i.product_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.product_id = d.product_id;

        SET @action_type = 'UPDATE';
    END

    -- Chỉ ghi log nếu có nội dung mô tả
    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'Products', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END
GO

-- Ghi log bảng Report
CREATE TRIGGER trg_Log_Report
ON Report
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20);
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
			@user_id = user_id,
            @record_id = CAST(report_id AS VARCHAR),
			@description = content
        FROM inserted;
		
		SET @new_data = (SELECT * FROM inserted WHERE report_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, new_data, is_undo)
    VALUES (@user_id, @action_type, 'Report', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @new_data, ISNULL(@is_undo, 0));
END
GO

-- Ghi log bảng Supplier
CREATE TRIGGER trg_Log_Supplier
ON Supplier
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(supplier_id AS VARCHAR),
            @description = CONCAT(N'Thêm nhà cung cấp: ', supplier_name)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE supplier_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(supplier_id AS VARCHAR),
            @description = CONCAT(N'Xóa nhà cung cấp: ', supplier_name)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE supplier_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.supplier_id AS VARCHAR),
            @description =
                ISNULL(CASE WHEN i.supplier_name <> d.supplier_name THEN N'Tên: [' + d.supplier_name + N'] → [' + i.supplier_name + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.contact_person <> d.contact_person THEN N'Người liên hệ: [' + ISNULL(d.contact_person, 'NULL') + N'] → [' + ISNULL(i.contact_person, 'NULL') + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.phone <> d.phone THEN N'SĐT: [' + d.phone + N'] → [' + i.phone + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.email <> d.email THEN N'Email: [' + ISNULL(d.email, 'NULL') + N'] → [' + ISNULL(i.email, 'NULL') + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.address <> d.address THEN N'Địa chỉ: [' + ISNULL(d.address, 'NULL') + N'] → [' + ISNULL(i.address, 'NULL') + N']; ' ELSE '' END, ''),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.supplier_id = i.supplier_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.supplier_id = i.supplier_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.supplier_id = d.supplier_id;

        SET @action_type = 'UPDATE';
    END

    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'Supplier', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END
GO

-- Ghi log bảng User
CREATE TRIGGER trg_Log_User
ON [User]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(user_id AS VARCHAR),
            @description = CONCAT(N'Thêm người dùng: ', fullname)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE user_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(user_id AS VARCHAR),
            @description = CONCAT(N'Xóa người dùng: ', fullname)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE user_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.user_id AS VARCHAR),
            @description =
                ISNULL(CASE WHEN i.username <> d.username THEN N'Tên đăng nhập: [' + d.username + N'] → [' + i.username + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.[password] <> d.[password] THEN N'Mật khẩu: [Đã thay đổi]; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.fullname <> d.fullname THEN N'Họ tên: [' + d.fullname + N'] → [' + i.fullname + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.phone <> d.phone THEN N'SĐT: [' + d.phone + N'] → [' + i.phone + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.email <> d.email THEN N'Email: [' + d.email + N'] → [' + i.email + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.role <> d.role THEN N'Vai trò: [' + d.role + N'] → [' + i.role + N']; ' ELSE '' END, ''),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.user_id = i.user_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.user_id = i.user_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.user_id = d.user_id;

        SET @action_type = 'UPDATE';
    END

    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description, old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'User', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END
GO

-- Ghi log bảng Warehouse
CREATE TRIGGER trg_Log_Warehouse
ON Warehouse
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

	DECLARE @user_id VARCHAR(20) = TRY_CONVERT(VARCHAR(20), SESSION_CONTEXT(N'user_id'));
    DECLARE @is_undo INT = TRY_CAST(SESSION_CONTEXT(N'is_undo') AS INT);
    DECLARE @action_type VARCHAR(10);
    DECLARE @record_id VARCHAR(50);
    DECLARE @description NVARCHAR(MAX);
	DECLARE @old_data NVARCHAR(MAX);
    DECLARE @new_data NVARCHAR(MAX);

    -- Handle INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(warehouse_id AS VARCHAR),
            @description = CONCAT(N'Thêm nhà kho: ', name)
        FROM inserted;

		SET @new_data = (SELECT * FROM inserted WHERE warehouse_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'INSERT';
    END

    -- Handle DELETE
    ELSE IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(warehouse_id AS VARCHAR),
            @description = CONCAT(N'Xóa nhà kho: ', name)
        FROM deleted;

		SET @old_data = (SELECT * FROM deleted WHERE warehouse_id = CAST(@record_id AS VARCHAR) FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        SET @action_type = 'DELETE';
    END

    -- Handle UPDATE
    ELSE IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        SELECT TOP 1 
            @record_id = CAST(i.warehouse_id AS VARCHAR),
            @description = 
                ISNULL(CASE WHEN i.name <> d.name THEN N'Tên: [' + d.name + N'] → [' + i.name + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.location <> d.location THEN N'Vị trí: [' + d.location + N'] → [' + i.location + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.capacity <> d.capacity THEN N'Sức chứa: [' + CAST(d.capacity AS NVARCHAR) + N'] → [' + CAST(i.capacity AS NVARCHAR) + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.current_capacity <> d.current_capacity THEN N'Dung lượng hiện tại: [' + CAST(d.current_capacity AS NVARCHAR) + N'] → [' + CAST(i.current_capacity AS NVARCHAR) + N']; ' ELSE '' END, '') +
                ISNULL(CASE WHEN i.status <> d.status THEN N'Trạng thái: [' + d.status + N'] → [' + i.status + N']; ' ELSE '' END, ''),
			@old_data = (SELECT * FROM deleted d2 WHERE d2.warehouse_id = i.warehouse_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @new_data = (SELECT * FROM inserted i2 WHERE i2.warehouse_id = i.warehouse_id FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM inserted i
        JOIN deleted d ON i.warehouse_id = d.warehouse_id;

        SET @action_type = 'UPDATE';
    END

    -- Chỉ ghi log nếu có mô tả thay đổi
    IF @description IS NOT NULL AND LTRIM(RTRIM(@description)) <> ''
    BEGIN
        INSERT INTO ActionLog (user_id, action_type, table_name, record_id, action_time, description,old_data, new_data, is_undo)
        VALUES (@user_id, @action_type, 'Warehouse', @record_id, DATEADD(HOUR, 0, GETUTCDATE()), @description, @old_data, @new_data, ISNULL(@is_undo, 0));
    END
END