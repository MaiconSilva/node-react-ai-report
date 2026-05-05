USE SalesDB;
GO

-- Insert sample customers (100 customers)
INSERT INTO customers (name, email, city, state, created_at) VALUES
('John Smith', 'john.smith@email.com', 'New York', 'NY', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Sarah Johnson', 'sarah.johnson@email.com', 'Los Angeles', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Michael Brown', 'michael.brown@email.com', 'Chicago', 'IL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Emily Davis', 'emily.davis@email.com', 'Houston', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('David Wilson', 'david.wilson@email.com', 'Phoenix', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jennifer Martinez', 'jennifer.martinez@email.com', 'Philadelphia', 'PA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('James Taylor', 'james.taylor@email.com', 'San Antonio', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jessica Anderson', 'jessica.anderson@email.com', 'San Diego', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Robert Thomas', 'robert.thomas@email.com', 'Dallas', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Lisa Jackson', 'lisa.jackson@email.com', 'San Jose', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('William White', 'william.white@email.com', 'Austin', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Amanda Harris', 'amanda.harris@email.com', 'Jacksonville', 'FL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Christopher Martin', 'christopher.martin@email.com', 'Fort Worth', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Ashley Thompson', 'ashley.thompson@email.com', 'Columbus', 'OH', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Matthew Garcia', 'matthew.garcia@email.com', 'Charlotte', 'NC', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Stephanie Robinson', 'stephanie.robinson@email.com', 'San Francisco', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Daniel Clark', 'daniel.clark@email.com', 'Indianapolis', 'IN', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Nicole Rodriguez', 'nicole.rodriguez@email.com', 'Seattle', 'WA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Andrew Lewis', 'andrew.lewis@email.com', 'Denver', 'CO', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Michelle Lee', 'michelle.lee@email.com', 'Washington', 'DC', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Joshua Walker', 'joshua.walker@email.com', 'Boston', 'MA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Melissa Hall', 'melissa.hall@email.com', 'El Paso', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Ryan Allen', 'ryan.allen@email.com', 'Detroit', 'MI', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Elizabeth Young', 'elizabeth.young@email.com', 'Nashville', 'TN', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jacob Hernandez', 'jacob.hernandez@email.com', 'Oklahoma City', 'OK', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Rachel King', 'rachel.king@email.com', 'Portland', 'OR', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Nicholas Wright', 'nicholas.wright@email.com', 'Las Vegas', 'NV', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Lauren Lopez', 'lauren.lopez@email.com', 'Louisville', 'KY', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Tyler Hill', 'tyler.hill@email.com', 'Baltimore', 'MD', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Rebecca Scott', 'rebecca.scott@email.com', 'Milwaukee', 'WI', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Brandon Green', 'brandon.green@email.com', 'Albuquerque', 'NM', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Amber Adams', 'amber.adams@email.com', 'Tucson', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Alexander Baker', 'alexander.baker@email.com', 'Fresno', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Crystal Nelson', 'crystal.nelson@email.com', 'Sacramento', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Benjamin Carter', 'benjamin.carter@email.com', 'Mesa', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Megan Mitchell', 'megan.mitchell@email.com', 'Kansas City', 'MO', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Samuel Perez', 'samuel.perez@email.com', 'Atlanta', 'GA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Brittany Roberts', 'brittany.roberts@email.com', 'Long Beach', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jonathan Turner', 'jonathan.turner@email.com', 'Colorado Springs', 'CO', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Angela Phillips', 'angela.phillips@email.com', 'Raleigh', 'NC', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Justin Campbell', 'justin.campbell@email.com', 'Omaha', 'NE', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Tiffany Parker', 'tiffany.parker@email.com', 'Miami', 'FL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Kevin Evans', 'kevin.evans@email.com', 'Oakland', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Stephanie Edwards', 'stephanie.edwards@email.com', 'Minneapolis', 'MN', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jose Collins', 'jose.collins@email.com', 'Tulsa', 'OK', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Sara Stewart', 'sara.stewart@email.com', 'Cleveland', 'OH', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Eric Sanchez', 'eric.sanchez@email.com', 'Wichita', 'KS', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Diana Morris', 'diana.morris@email.com', 'Arlington', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Aaron Rogers', 'aaron.rogers@email.com', 'New Orleans', 'LA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Emily Reed', 'emily.reed@email.com', 'Bakersfield', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Zachary Cook', 'zachary.cook@email.com', 'Tampa', 'FL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Katherine Morgan', 'katherine.morgan@email.com', 'Honolulu', 'HI', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Nathan Bell', 'nathan.bell@email.com', 'Anaheim', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Madison Murphy', 'madison.murphy@email.com', 'Aurora', 'CO', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Adam Bailey', 'adam.bailey@email.com', 'Santa Ana', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Hannah Rivera', 'hannah.rivera@email.com', 'St. Louis', 'MO', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Noah Cooper', 'noah.cooper@email.com', 'Riverside', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Olivia Richardson', 'olivia.richardson@email.com', 'Corpus Christi', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Caleb Cox', 'caleb.cox@email.com', 'Lexington', 'KY', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Grace Ward', 'grace.ward@email.com', 'Pittsburgh', 'PA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Dylan Torres', 'dylan.torres@email.com', 'Anchorage', 'AK', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Victoria Peterson', 'victoria.peterson@email.com', 'Stockton', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Isaac Gray', 'isaac.gray@email.com', 'Cincinnati', 'OH', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Chloe Ramirez', 'chloe.ramirez@email.com', 'St. Paul', 'MN', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Gabriel James', 'gabriel.james@email.com', 'Toledo', 'OH', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Lily Watson', 'lily.watson@email.com', 'Newark', 'NJ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Owen Brooks', 'owen.brooks@email.com', 'Greensboro', 'NC', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Alexis Kelly', 'alexis.kelly@email.com', 'Plano', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Carter Sanders', 'carter.sanders@email.com', 'Lincoln', 'NE', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jasmine Price', 'jasmine.price@email.com', 'Buffalo', 'NY', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jayden Bennett', 'jayden.bennett@email.com', 'Fort Wayne', 'IN', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Sophia Wood', 'sophia.wood@email.com', 'Jersey City', 'NJ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Luke Barnes', 'luke.barnes@email.com', 'Chula Vista', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Madeline Ross', 'madeline.ross@email.com', 'Orlando', 'FL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Henry Henderson', 'henry.henderson@email.com', 'St. Petersburg', 'FL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Samantha Coleman', 'samantha.coleman@email.com', 'Norfolk', 'VA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jack Jenkins', 'jack.jenkins@email.com', 'Chandler', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Allison Perry', 'allison.perry@email.com', 'Laredo', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Jackson Powell', 'jackson.powell@email.com', 'Madison', 'WI', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Maria Long', 'maria.long@email.com', 'Lubbock', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Levi Patterson', 'levi.patterson@email.com', 'Scottsdale', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Kayla Hughes', 'kayla.hughes@email.com', 'Reno', 'NV', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Connor Flores', 'connor.flores@email.com', 'Glendale', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Brooke Washington', 'brooke.washington@email.com', 'Gilbert', 'AZ', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Austin Butler', 'austin.butler@email.com', 'Winston-Salem', 'NC', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Vanessa Simmons', 'vanessa.simmons@email.com', 'North Las Vegas', 'NV', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Evan Foster', 'evan.foster@email.com', 'Chesapeake', 'VA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Natalie Gonzales', 'natalie.gonzales@email.com', 'Garland', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Robert Bryant', 'robert.bryant@email.com', 'Irving', 'TX', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Paige Alexander', 'paige.alexander@email.com', 'Hialeah', 'FL', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Thomas Russell', 'thomas.russell@email.com', 'Fremont', 'CA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Sierra Griffin', 'sierra.griffin@email.com', 'Boise', 'ID', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Liam Diaz', 'liam.diaz@email.com', 'Richmond', 'VA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE())),
('Morgan Hayes', 'morgan.hayes@email.com', 'Baton Rouge', 'LA', DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE()));
GO

-- Insert sample products (50 products across different categories)
INSERT INTO products (name, category, price, stock_quantity) VALUES
('Wireless Bluetooth Headphones', 'Electronics', 79.99, 150),
('USB-C Charging Cable', 'Electronics', 12.99, 500),
('Laptop Stand Aluminum', 'Electronics', 45.50, 200),
('Mechanical Keyboard', 'Electronics', 129.99, 80),
('Wireless Mouse', 'Electronics', 34.99, 300),
('27-inch Monitor 4K', 'Electronics', 349.99, 50),
('Webcam HD 1080p', 'Electronics', 59.99, 120),
('USB Hub 7-Port', 'Electronics', 29.99, 250),
('External SSD 1TB', 'Electronics', 89.99, 100),
('Bluetooth Speaker', 'Electronics', 49.99, 180),
('Ergonomic Office Chair', 'Furniture', 299.99, 40),
('Standing Desk Converter', 'Furniture', 189.99, 60),
('Desk Lamp LED', 'Furniture', 39.99, 150),
('Filing Cabinet', 'Furniture', 129.99, 30),
('Bookshelf 5-Shelf', 'Furniture', 159.99, 45),
('Office Desk 60-inch', 'Furniture', 249.99, 25),
('Monitor Arm Mount', 'Furniture', 69.99, 100),
('Desk Organizer Set', 'Furniture', 24.99, 200),
('Whiteboard 48x36', 'Furniture', 79.99, 60),
('Comfort Floor Mat', 'Furniture', 49.99, 120),
('A4 Copy Paper (500 sheets)', 'Office Supplies', 5.99, 1000),
('Ballpoint Pens (12 pack)', 'Office Supplies', 8.99, 500),
('Stapler Heavy Duty', 'Office Supplies', 15.99, 150),
('Sticky Notes 3x3 (12 pack)', 'Office Supplies', 9.99, 400),
('File Folders (100 pack)', 'Office Supplies', 12.99, 300),
('Binder Clips Assorted Sizes', 'Office Supplies', 6.99, 350),
('Highlighters (8 pack)', 'Office Supplies', 7.99, 280),
('Tape Dispenser', 'Office Supplies', 11.99, 200),
('Scissors 8-inch', 'Office Supplies', 8.49, 250),
('Project Management Software License', 'Software', 199.99, 999),
('Antivirus Software 1-Year', 'Software', 49.99, 999),
('Cloud Storage 1TB Annual', 'Software', 99.99, 999),
('Video Editing Software', 'Software', 299.99, 999),
('Office Suite License', 'Software', 149.99, 999),
('PDF Editor Pro', 'Software', 79.99, 999),
('Password Manager Annual', 'Software', 39.99, 999),
('VPN Service Annual', 'Software', 59.99, 999),
('Graphic Design Software', 'Software', 249.99, 999),
('Database Management Tool', 'Software', 179.99, 999),
('Running Shoes Men', 'Apparel', 89.99, 120),
('Yoga Mat Premium', 'Apparel', 34.99, 200),
('Fitness Tracker Watch', 'Apparel', 149.99, 80),
('Water Bottle 32oz', 'Apparel', 24.99, 300),
('Gym Bag Large', 'Apparel', 44.99, 100),
('Athletic Socks (6 pack)', 'Apparel', 19.99, 250),
('Compression Shirt', 'Apparel', 29.99, 180),
('Sports Sunglasses', 'Apparel', 79.99, 90),
('Cycling Helmet', 'Apparel', 59.99, 70),
('Resistance Bands Set', 'Apparel', 19.99, 220);
GO

-- Create a stored procedure to generate random orders
CREATE OR ALTER PROCEDURE GenerateOrders
    @OrderCount INT
AS
BEGIN
    DECLARE @i INT = 1;
    DECLARE @CustomerId INT;
    DECLARE @OrderDate DATETIME;
    DECLARE @Status NVARCHAR(20);
    DECLARE @OrderId INT;
    DECLARE @ItemCount INT;
    DECLARE @j INT;
    DECLARE @ProductId INT;
    DECLARE @Quantity INT;
    DECLARE @UnitPrice DECIMAL(10, 2);
    DECLARE @TotalAmount DECIMAL(10, 2);
    
    WHILE @i <= @OrderCount
    BEGIN
        -- Random customer (1-100)
        SET @CustomerId = ABS(CHECKSUM(NEWID())) % 100 + 1;
        
        -- Random date within last year
        SET @OrderDate = DATEADD(day, -ABS(CHECKSUM(NEWID())) % 365, GETDATE());
        
        -- Random status with weighted distribution
        SET @Status = CASE 
            WHEN ABS(CHECKSUM(NEWID())) % 100 < 70 THEN 'completed'
            WHEN ABS(CHECKSUM(NEWID())) % 100 < 85 THEN 'pending'
            WHEN ABS(CHECKSUM(NEWID())) % 100 < 95 THEN 'processing'
            ELSE 'cancelled'
        END;
        
        -- Insert order with 0 total (will update later)
        INSERT INTO orders (customer_id, order_date, status, total_amount)
        VALUES (@CustomerId, @OrderDate, @Status, 0);
        
        SET @OrderId = SCOPE_IDENTITY();
        
        -- Add 1-5 items per order
        SET @ItemCount = ABS(CHECKSUM(NEWID())) % 5 + 1;
        SET @j = 1;
        SET @TotalAmount = 0;
        
        WHILE @j <= @ItemCount
        BEGIN
            -- Random product (1-50)
            SET @ProductId = ABS(CHECKSUM(NEWID())) % 50 + 1;
            
            -- Random quantity 1-10
            SET @Quantity = ABS(CHECKSUM(NEWID())) % 10 + 1;
            
            -- Get product price
            SELECT @UnitPrice = price FROM products WHERE id = @ProductId;
            
            -- Insert order item
            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES (@OrderId, @ProductId, @Quantity, @UnitPrice);
            
            -- Update total
            SET @TotalAmount = @TotalAmount + (@Quantity * @UnitPrice);
            
            SET @j = @j + 1;
        END
        
        -- Update order total
        UPDATE orders SET total_amount = @TotalAmount WHERE id = @OrderId;
        
        SET @i = @i + 1;
    END
END
GO

-- Generate 1000 orders
EXEC GenerateOrders 1000;
GO

-- Clean up the stored procedure
DROP PROCEDURE IF EXISTS GenerateOrders;
GO

PRINT 'Sample data inserted successfully!';
PRINT 'Customers: ' + CAST((SELECT COUNT(*) FROM customers) AS NVARCHAR);
PRINT 'Products: ' + CAST((SELECT COUNT(*) FROM products) AS NVARCHAR);
PRINT 'Orders: ' + CAST((SELECT COUNT(*) FROM orders) AS NVARCHAR);
PRINT 'Order Items: ' + CAST((SELECT COUNT(*) FROM order_items) AS NVARCHAR);
GO
