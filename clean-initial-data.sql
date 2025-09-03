-- 🚀 CLEAN INITIAL DATA - BBQ BUSINESS APP 🍖
-- 
-- This script populates the clean database with initial data:
-- - 4 store branches
-- - Complete BBQ menu products
-- - Sample promo codes
-- - System initialization
-- 
-- ⚠️  WARNING: Run this AFTER clean-database-schema.sql
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Initialize the clean system with working data

-- =====================================================
-- STEP 1: INSERT BRANCHES (4 Store Locations)
-- =====================================================

INSERT INTO branches (name, address, phone, is_active) VALUES
('Branch 1 - Downtown', '123 Main Street, Downtown Surigao City, Surigao del Norte', '+63-912-345-6789', true),
('Branch 2 - Mall', '456 Mall Avenue, Shopping District, Surigao City, Surigao del Norte', '+63-912-345-6790', true),
('Branch 3 - University', '789 Campus Road, University Area, Surigao City, Surigao del Norte', '+63-912-345-6791', true),
('Branch 4 - Residential', '321 Suburb Street, Residential Area, Surigao City, Surigao del Norte', '+63-912-345-6792', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: INSERT PRODUCTS (Complete BBQ Menu)
-- =====================================================

INSERT INTO products (name, description, price, commission, image_url, category, is_featured, is_active) VALUES
-- Chicken Parts
('Paa (Chicken Feet)', 'Tender and flavorful chicken feet, perfect for snacking', 100.00, 3.00, '/images/products/paa.jpg', 'chicken', true, true),
('Pecho (Chicken Breast)', 'Juicy chicken breast, grilled to perfection', 120.00, 3.00, '/images/products/pecho.jpg', 'chicken', true, true),
('Breast Part (Chicken Breast)', 'Premium chicken breast cut, tender and moist', 100.00, 3.00, '/images/products/breast.jpg', 'chicken', false, true),
('Atay (Chicken Liver)', 'Rich and creamy chicken liver, grilled with special seasoning', 45.00, 2.50, '/images/products/atay.jpg', 'chicken', false, true),
('Tibakunoy (Chicken Gizzard)', 'Chewy and flavorful chicken gizzard, perfectly grilled', 45.00, 2.50, '/images/products/tibakunoy.jpg', 'chicken', false, true),
('Tinae (Isaw - Chicken Intestines)', 'Classic Filipino street food, grilled chicken intestines', 45.00, 2.00, '/images/products/isaw.jpg', 'chicken', false, true),
('Chicken Skin (BBQ Style)', 'Crispy and flavorful chicken skin, grilled to perfection', 45.00, 3.00, '/images/products/chicken-skin.jpg', 'chicken', true, true),

-- Sausages & Hotdogs
('Chorizo (Spanish Sausage)', 'Authentic Spanish chorizo, grilled with herbs and spices', 60.00, 2.50, '/images/products/chorizo.jpg', 'sausage', false, true),
('Hotdog (BBQ Hotdog)', 'Classic BBQ hotdog, grilled and served with condiments', 45.00, 2.50, '/images/products/hotdog.jpg', 'sausage', false, true),

-- Pork & Beef
('Pork Belly (Liempo)', 'Premium pork belly, marinated and grilled to perfection', 150.00, 4.00, '/images/products/liempo.jpg', 'pork', true, true),
('Pork Ribs (BBQ Ribs)', 'Tender pork ribs with our signature BBQ sauce', 180.00, 4.50, '/images/products/ribs.jpg', 'pork', true, true),
('Beef Skewers (Beef BBQ)', 'Tender beef cubes on skewers, marinated in special sauce', 120.00, 3.50, '/images/products/beef-skewers.jpg', 'beef', false, true),

-- Special Items
('BBQ Combo Platter', 'Mixed selection of our best BBQ items', 250.00, 6.00, '/images/products/combo-platter.jpg', 'combo', true, true),
('Family Pack', 'Large portion perfect for sharing with family', 400.00, 8.00, '/images/products/family-pack.jpg', 'combo', false, true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 3: INSERT PROMO CODES (Discount Management)
-- =====================================================

INSERT INTO promo_codes (code, discount_type, discount_value, minimum_order, max_uses, is_active, expires_at) VALUES
('WELCOME10', 'percentage', 10.00, 200.00, 100, true, NOW() + INTERVAL '1 year'),
('BBQ20', 'fixed', 20.00, 150.00, 50, true, NOW() + INTERVAL '6 months'),
('FIRSTORDER', 'percentage', 15.00, 100.00, 200, true, NOW() + INTERVAL '1 year'),
('LOYALTY25', 'fixed', 25.00, 300.00, 75, true, NOW() + INTERVAL '1 year'),
('STUDENT15', 'percentage', 15.00, 120.00, 150, true, NOW() + INTERVAL '1 year'),
('FAMILY30', 'fixed', 30.00, 400.00, 50, true, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 4: INSERT SAMPLE ORDERS (For Testing)
-- =====================================================

INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, branch_id, pickup_time, subtotal, total_amount, total_commission, payment_status, order_status) VALUES
('20250903-001', 'John Smith', '+63-912-345-6001', 'john@example.com', (SELECT id FROM branches WHERE name LIKE '%Downtown%'), NOW() + INTERVAL '2 hours', 245.00, 245.00, 7.00, 'paid', 'confirmed'),
('20250903-002', 'Jane Doe', '+63-912-345-6002', 'jane@example.com', (SELECT id FROM branches WHERE name LIKE '%Mall%'), NOW() + INTERVAL '1 hour', 180.00, 180.00, 5.50, 'pending', 'pending'),
('20250903-003', 'Mike Johnson', '+63-912-345-6003', 'mike@example.com', (SELECT id FROM branches WHERE name LIKE '%University%'), NOW() + INTERVAL '3 hours', 320.00, 320.00, 9.50, 'paid', 'preparing')
ON CONFLICT (order_number) DO NOTHING;

-- =====================================================
-- STEP 5: INSERT SAMPLE ORDER ITEMS (For Testing)
-- =====================================================

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, unit_commission, subtotal) VALUES
-- Order 1 items (John Smith)
((SELECT id FROM orders WHERE customer_name = 'John Smith' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Paa%'), 'Paa (Chicken Feet)', 2, 100.00, 3.00, 200.00),
((SELECT id FROM orders WHERE customer_name = 'John Smith' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Atay%'), 'Atay (Chicken Liver)', 1, 45.00, 2.50, 45.00),

-- Order 2 items (Jane Doe)
((SELECT id FROM orders WHERE customer_name = 'Jane Doe' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Pecho%'), 'Pecho (Chicken Breast)', 1, 120.00, 3.00, 120.00),
((SELECT id FROM orders WHERE customer_name = 'Jane Doe' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Hotdog%'), 'Hotdog (BBQ Hotdog)', 1, 45.00, 2.50, 45.00),

-- Order 3 items (Mike Johnson)
((SELECT id FROM orders WHERE customer_name = 'Mike Johnson' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Pork Belly%'), 'Pork Belly (Liempo)', 1, 150.00, 4.00, 150.00),
((SELECT id FROM orders WHERE customer_name = 'Mike Johnson' LIMIT 1), (SELECT id FROM products WHERE name LIKE '%Pork Ribs%'), 'Pork Ribs (BBQ Ribs)', 1, 180.00, 4.50, 180.00)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 6: INSERT SYSTEM LOGS (Initialization)
-- =====================================================

INSERT INTO system_logs (log_type, message, ip_address) VALUES
('system_startup', 'Clean database system initialized successfully', '127.0.0.1'),
('data_population', 'Initial data population completed', '127.0.0.1'),
('schema_creation', 'Clean database schema created and verified', '127.0.0.1')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 7: VERIFICATION QUERIES
-- =====================================================

-- Check data insertion
SELECT 'Data Population Summary:' as info;
SELECT 'Branches' as table_name, COUNT(*) as record_count FROM branches
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Promo Codes', COUNT(*) FROM promo_codes
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'System Logs', COUNT(*) FROM system_logs;

-- Display sample data
SELECT 'Sample Branches:' as info;
SELECT name, address, phone FROM branches LIMIT 3;

SELECT 'Sample Products:' as info;
SELECT name, price, commission, is_featured FROM products WHERE is_featured = true LIMIT 5;

SELECT 'Sample Promo Codes:' as info;
SELECT code, discount_type, discount_value, minimum_order FROM promo_codes WHERE is_active = true LIMIT 3;

-- =====================================================
-- STEP 8: SUCCESS MESSAGE
-- =====================================================

SELECT 'Initial data population completed successfully!' as status;
SELECT 'Your BBQ business app is now ready for testing!' as message;
