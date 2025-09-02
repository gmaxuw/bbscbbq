-- 🔐 INITIAL DATA POPULATION - ADMIN DASHBOARD 🛡️
-- 
-- This script populates the database with initial data:
-- - 4 store branches
-- - Initial BBQ menu products
-- - Default admin user
-- - Sample promo codes
-- 
-- ⚠️  WARNING: Run this AFTER creating the database schema
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Initialize the system with working data

-- 1. INSERT BRANCHES (4 Store Locations)
INSERT INTO branches (name, address, phone, is_active) VALUES
('Branch 1 - Downtown', '123 Main Street, Downtown Surigao City, Surigao del Norte', '+63-912-345-6789', true),
('Branch 2 - Mall', '456 Mall Avenue, Shopping District, Surigao City, Surigao del Norte', '+63-912-345-6790', true),
('Branch 3 - University', '789 Campus Road, University Area, Surigao City, Surigao del Norte', '+63-912-345-6791', true),
('Branch 4 - Residential', '321 Suburb Street, Residential Area, Surigao City, Surigao del Norte', '+63-912-345-6792', true)
ON CONFLICT (id) DO NOTHING;

-- 2. INSERT INITIAL PRODUCTS (BBQ Menu Items)
INSERT INTO products (name, price, commission, image, is_active) VALUES
('Paa (Chicken Feet)', 100.00, 3.00, '/images/products/paa.jpg', true),
('Pecho (Chicken Breast)', 120.00, 3.00, '/images/products/pecho.jpg', true),
('Breast Part (Chicken Breast)', 100.00, 3.00, '/images/products/breast.jpg', true),
('Atay (Chicken Liver)', 45.00, 2.50, '/images/products/atay.jpg', true),
('Tibakunoy (Chicken Gizzard)', 45.00, 2.50, '/images/products/tibakunoy.jpg', true),
('Tinae (Isaw - Chicken Intestines)', 45.00, 2.00, '/images/products/isaw.jpg', true),
('Chorizo (Spanish Sausage)', 60.00, 2.50, '/images/products/chorizo.jpg', true),
('Hotdog (BBQ Hotdog)', 45.00, 2.50, '/images/products/hotdog.jpg', true),
('Chicken Skin (BBQ Style)', 45.00, 3.00, '/images/products/chicken-skin.jpg', true),
('Pork Belly (Liempo)', 150.00, 4.00, '/images/products/liempo.jpg', true),
('Pork Ribs (BBQ Ribs)', 180.00, 4.50, '/images/products/ribs.jpg', true),
('Beef Skewers (Beef BBQ)', 120.00, 3.50, '/images/products/beef-skewers.jpg', true)
ON CONFLICT (id) DO NOTHING;

-- 3. INSERT DEFAULT ADMIN USER
-- Note: You'll need to hash the password properly in production
-- This is a placeholder - replace with actual hashed password
INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES
('admin@surigaobbq.com', '$2a$10$placeholder.hash.for.admin.password', 'System Administrator', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 4. INSERT SAMPLE PROMO CODES
INSERT INTO promo_codes (code, discount_type, discount_value, minimum_order, max_uses, is_active, expires_at) VALUES
('WELCOME10', 'percentage', 10.00, 200.00, 100, true, NOW() + INTERVAL '1 year'),
('BBQ20', 'fixed', 20.00, 150.00, 50, true, NOW() + INTERVAL '6 months'),
('FIRSTORDER', 'percentage', 15.00, 100.00, 200, true, NOW() + INTERVAL '1 year'),
('LOYALTY25', 'fixed', 25.00, 300.00, 75, true, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- 5. INSERT SAMPLE CREW MEMBERS (Optional - for testing)
INSERT INTO users (email, password_hash, full_name, role, branch_id, is_active) VALUES
('crew1@surigaobbq.com', '$2a$10$placeholder.hash.for.crew.password', 'Juan Dela Cruz', 'crew', (SELECT id FROM branches WHERE name LIKE '%Downtown%'), true),
('crew2@surigaobbq.com', '$2a$10$placeholder.hash.for.crew.password', 'Maria Santos', 'crew', (SELECT id FROM branches WHERE name LIKE '%Mall%'), true),
('crew3@surigaobbq.com', '$2a$10$placeholder.hash.for.crew.password', 'Pedro Martinez', 'crew', (SELECT id FROM branches WHERE name LIKE '%University%'), true),
('crew4@surigaobbq.com', '$2a$10$placeholder.hash.for.crew.password', 'Ana Reyes', 'crew', (SELECT id FROM branches WHERE name LIKE '%Residential%'), true)
ON CONFLICT (email) DO NOTHING;

-- 6. INSERT SAMPLE ORDERS (Optional - for testing dashboard)
INSERT INTO orders (customer_name, customer_phone, customer_email, branch_id, pickup_time, total_amount, total_commission, payment_status, order_status) VALUES
('John Smith', '+63-912-345-6001', 'john@example.com', (SELECT id FROM branches WHERE name LIKE '%Downtown%'), NOW() + INTERVAL '2 hours', 245.00, 7.00, 'paid', 'confirmed'),
('Jane Doe', '+63-912-345-6002', 'jane@example.com', (SELECT id FROM branches WHERE name LIKE '%Mall%'), NOW() + INTERVAL '1 hour', 180.00, 5.50, 'pending', 'pending'),
('Mike Johnson', '+63-912-345-6003', 'mike@example.com', (SELECT id FROM branches WHERE name LIKE '%University%'), NOW() + INTERVAL '3 hours', 320.00, 9.50, 'paid', 'preparing')
ON CONFLICT (id) DO NOTHING;

-- 7. INSERT SAMPLE ORDER ITEMS (Optional - for testing)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, unit_commission, subtotal) VALUES
-- Order 1 items
((SELECT id FROM orders WHERE customer_name = 'John Smith' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Paa%'), 2, 100.00, 3.00, 200.00),
((SELECT id FROM orders WHERE customer_name = 'John Smith' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Atay%'), 1, 45.00, 2.50, 45.00),
-- Order 2 items
((SELECT id FROM orders WHERE customer_name = 'Jane Doe' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Pecho%'), 1, 120.00, 3.00, 120.00),
((SELECT id FROM orders WHERE customer_name = 'Jane Doe' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Hotdog%'), 1, 45.00, 2.50, 45.00),
-- Order 3 items
((SELECT id FROM orders WHERE customer_name = 'Mike Johnson' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Pork Belly%'), 1, 150.00, 4.00, 150.00),
((SELECT id FROM orders WHERE customer_name = 'Mike Johnson' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Pork Ribs%'), 1, 180.00, 4.50, 180.00)
ON CONFLICT (id) DO NOTHING;

-- 8. INSERT SAMPLE CREW ATTENDANCE (Optional - for testing)
INSERT INTO crew_attendance (user_id, branch_id, clock_in, date) VALUES
((SELECT id FROM users WHERE email = 'crew1@surigaobbq.com'), (SELECT id FROM branches WHERE name LIKE '%Downtown%'), NOW() - INTERVAL '8 hours', CURRENT_DATE),
((SELECT id FROM users WHERE email = 'crew2@surigaobbq.com'), (SELECT id FROM branches WHERE name LIKE '%Mall%'), NOW() - INTERVAL '7 hours', CURRENT_DATE),
((SELECT id FROM users WHERE email = 'crew3@surigaobbq.com'), (SELECT id FROM branches WHERE name LIKE '%University%'), NOW() - INTERVAL '6 hours', CURRENT_DATE),
((SELECT id FROM users WHERE email = 'crew4@surigaobbq.com'), (SELECT id FROM branches WHERE name LIKE '%Residential%'), NOW() - INTERVAL '5 hours', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- 9. INSERT SAMPLE SYSTEM LOGS (Optional - for testing)
INSERT INTO system_logs (log_type, user_id, message, ip_address) VALUES
('system_startup', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Admin dashboard system initialized', '127.0.0.1'),
('user_login', (SELECT id FROM users WHERE email = 'admin@surigaobbq.com'), 'Admin user logged in successfully', '127.0.0.1'),
('data_population', (SELECT id FROM users WHERE role = 'admin' LIMIT 1), 'Initial data population completed', '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

-- 10. VERIFICATION QUERIES (Run these to confirm data was inserted)
-- Check branches
SELECT 'Branches' as table_name, COUNT(*) as record_count FROM branches
UNION ALL
-- Check products
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
-- Check users
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
-- Check orders
SELECT 'Orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
-- Check order items
SELECT 'Order Items' as table_name, COUNT(*) as record_count FROM order_items
UNION ALL
-- Check promo codes
SELECT 'Promo Codes' as table_name, COUNT(*) as record_count FROM promo_codes
UNION ALL
-- Check crew attendance
SELECT 'Crew Attendance' as table_name, COUNT(*) as record_count FROM crew_attendance
UNION ALL
-- Check system logs
SELECT 'System Logs' as table_name, COUNT(*) as record_count FROM system_logs;

-- Display sample data for verification
SELECT 'Sample Branches:' as info;
SELECT name, address, phone FROM branches LIMIT 3;

SELECT 'Sample Products:' as info;
SELECT name, price, commission FROM products LIMIT 5;

SELECT 'Sample Users:' as info;
SELECT email, full_name, role FROM users LIMIT 3;
