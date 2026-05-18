-- Создание базы данных 
-- CREATE DATABASE ClothingStoreDB;
-- GO
-- USE ClothingStoreDB;
-- GO

---------------------------------------------------------------------

-- 1. ПОДСИСТЕМА ПОЛЬЗОВАТЕЛЕЙ И РОЛЕЙ (RBAC)

---------------------------------------------------------------------

CREATE TABLE Roles (

    RoleId INT IDENTITY(1,1) PRIMARY KEY,

    RoleName NVARCHAR(50) NOT NULL UNIQUE

);


CREATE TABLE Users (

    UserId INT IDENTITY(1,1) PRIMARY KEY,

    Email NVARCHAR(100) NOT NULL UNIQUE,

    PasswordHash NVARCHAR(255) NOT NULL,

    FirstName NVARCHAR(50) NOT NULL,

    LastName NVARCHAR(50) NOT NULL,

    Phone NVARCHAR(20) NULL,

    CreatedAt DATETIME2 DEFAULT GETDATE()

);



CREATE TABLE UserRoles (

    UserId INT FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,

    RoleId INT FOREIGN KEY REFERENCES Roles(RoleId) ON DELETE CASCADE,

    PRIMARY KEY (UserId, RoleId)

);



-- Дополнительные данные для персонала (Админ, Менеджер, Продавец, Бухгалтер, Доставщик)

CREATE TABLE Employees (

    EmployeeId INT PRIMARY KEY FOREIGN KEY REFERENCES Users(UserId) ON DELETE CASCADE,

    Position NVARCHAR(50) NOT NULL,

    EfficiencyRating DECIMAL(3,2) DEFAULT 5.00 CHECK (EfficiencyRating BETWEEN 0 AND 5),

    HireDate DATE DEFAULT CAST(GETDATE() AS DATE)

);



---------------------------------------------------------------------

-- 2. ПОДСИСТЕМА КАТАЛОГА ТОВАРОВ И СКЛАДА

---------------------------------------------------------------------



CREATE TABLE Categories (

    CategoryId INT IDENTITY(1,1) PRIMARY KEY,

    CategoryName NVARCHAR(100) NOT NULL,

    ParentCategoryId INT NULL FOREIGN KEY REFERENCES Categories(CategoryId)

);



CREATE TABLE Products (

    ProductId INT IDENTITY(1,1) PRIMARY KEY,

    Name NVARCHAR(150) NOT NULL,

    Description NVARCHAR(MAX) NULL,

    CategoryId INT FOREIGN KEY REFERENCES Categories(CategoryId),

    BasePrice DECIMAL(18,2) NOT NULL CHECK (BasePrice >= 0),

    IsActive BIT DEFAULT 1, -- Выставлен ли на продажу

    CreatedAt DATETIME2 DEFAULT GETDATE()

);



CREATE TABLE Sizes (

    SizeId INT IDENTITY(1,1) PRIMARY KEY,

    SizeCode NVARCHAR(10) NOT NULL UNIQUE, -- XS, S, M, L, XL, 42, 44 etc.

    SizeSystem NVARCHAR(50) NULL -- EU, RU, US

);



CREATE TABLE Colors (

    ColorId INT IDENTITY(1,1) PRIMARY KEY,

    ColorName NVARCHAR(50) NOT NULL UNIQUE

);



-- Модификации товаров (Товар + Размер + Цвет = SKU) для точного складского учета

CREATE TABLE ProductVariants (

    VariantId INT IDENTITY(1,1) PRIMARY KEY,

    ProductId INT FOREIGN KEY REFERENCES Products(ProductId) ON DELETE CASCADE,

    SizeId INT FOREIGN KEY REFERENCES Sizes(SizeId),

    ColorId INT FOREIGN KEY REFERENCES Colors(ColorId),

    SKU NVARCHAR(50) NOT NULL UNIQUE,

    StockQuantity INT NOT NULL DEFAULT 0 CHECK (StockQuantity >= 0),

    PriceAdjustment DECIMAL(18,2) DEFAULT 0.00 -- Корректировка цены для конкретного размера/цвета

);



---------------------------------------------------------------------

-- 3. ПОДСИСТЕМА ЗАКАЗОВ И ФИНАНСОВ

---------------------------------------------------------------------



CREATE TABLE OrderStatuses (

    StatusId INT IDENTITY(1,1) PRIMARY KEY,

    StatusName NVARCHAR(50) NOT NULL UNIQUE -- На удержании, Подтвержден, Оплачен, В доставке, Доставлен

);



CREATE TABLE Orders (

    OrderId INT IDENTITY(1,1) PRIMARY KEY,

    BuyerId INT FOREIGN KEY REFERENCES Users(UserId),

    StatusId INT FOREIGN KEY REFERENCES OrderStatuses(StatusId),

    OrderDate DATETIME2 DEFAULT GETDATE(),

    ShippingAddress NVARCHAR(255) NOT NULL,

    DeliveryPersonId INT NULL FOREIGN KEY REFERENCES Users(UserId), -- Доставщик

    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (TotalAmount >= 0)

);



CREATE TABLE OrderItems (

    OrderItemId INT IDENTITY(1,1) PRIMARY KEY,

    OrderId INT FOREIGN KEY REFERENCES Orders(OrderId) ON DELETE CASCADE,

    VariantId INT FOREIGN KEY REFERENCES ProductVariants(VariantId),

    Quantity INT NOT NULL CHECK (Quantity > 0),

    UnitPrice DECIMAL(18,2) NOT NULL CHECK (UnitPrice >= 0) -- Фиксация цены на момент покупки

);



CREATE TABLE Payments (

    PaymentId INT IDENTITY(1,1) PRIMARY KEY,

    OrderId INT UNIQUE FOREIGN KEY REFERENCES Orders(OrderId) ON DELETE CASCADE,

    PaymentDate DATETIME2 DEFAULT GETDATE(),

    Amount DECIMAL(18,2) NOT NULL CHECK (Amount > 0),

    PaymentMethod NVARCHAR(50) NOT NULL, -- Card, Cache, SBP

    PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending'

);



---------------------------------------------------------------------

-- 4. ВНУТРЕННЯЯ ОПЕРАЦИОНКА И ТЕНДЕНЦИИ

---------------------------------------------------------------------



-- Заявки от сотрудников для Администратора

CREATE TABLE EmployeeRequests (

    RequestId INT IDENTITY(1,1) PRIMARY KEY,

    EmployeeId INT FOREIGN KEY REFERENCES Employees(EmployeeId),

    RequestType NVARCHAR(100) NOT NULL, -- Отпуск, Повышение, Закупка оборудования

    Details NVARCHAR(MAX) NOT NULL,

    Status NVARCHAR(50) DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Approved', 'Rejected')),

    ReviewedBy INT NULL FOREIGN KEY REFERENCES Users(UserId), -- Админ

    CreatedAt DATETIME2 DEFAULT GETDATE()

);



-- Аналитика популярности и трендов

CREATE TABLE ProductTrends (

    TrendId INT IDENTITY(1,1) PRIMARY KEY,

    ProductId INT UNIQUE FOREIGN KEY REFERENCES Products(ProductId) ON DELETE CASCADE,

    ViewCount INT DEFAULT 0,

    IsFashionTrend BIT DEFAULT 0, -- Метка админа "Тенденция моды"

    LastUpdated DATETIME2 DEFAULT GETDATE()

);

GO



---------------------------------------------------------------------

-- 5. ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ПРОИЗВОДИТЕЛЬНОСТИ

---------------------------------------------------------------------



-- Для быстрого поиска товаров в каталоге по категориям и активности

CREATE INDEX IX_Products_Category_Active ON Products(CategoryId, IsActive);



-- Для проверки остатков на складе и поиска по SKU

CREATE INDEX IX_ProductVariants_SKU ON ProductVariants(SKU);

CREATE INDEX IX_ProductVariants_Product ON ProductVariants(ProductId);



-- Для ускорения выборок по истории заказов конкретного пользователя

CREATE INDEX IX_Orders_Buyer ON Orders(BuyerId);

CREATE INDEX IX_Orders_Status ON Orders(StatusId);



-- Для бухгалтерии: выборка платежей по датам

CREATE INDEX IX_Payments_Date ON Payments(PaymentDate);

GO