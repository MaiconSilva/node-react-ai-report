-- Create Sales Database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SalesDB')
BEGIN
    CREATE DATABASE SalesDB;
END
GO

USE SalesDB;
GO

-- Create Customers table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customers')
BEGIN
    CREATE TABLE customers (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE NOT NULL,
        city NVARCHAR(50),
        state NVARCHAR(2),
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Products table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        id INT PRIMARY KEY IDENTITY(1,1),
        name NVARCHAR(100) NOT NULL,
        category NVARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create Orders table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id INT PRIMARY KEY IDENTITY(1,1),
        customer_id INT NOT NULL,
        order_date DATETIME DEFAULT GETDATE(),
        status NVARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
END
GO

-- Create Order Items table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
BEGIN
    CREATE TABLE order_items (
        id INT PRIMARY KEY IDENTITY(1,1),
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
END
GO

-- Create indexes for better performance
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_state ON customers(state);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
GO

PRINT 'Schema created successfully!';
GO
