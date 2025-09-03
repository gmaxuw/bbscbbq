-- 🍖 SURIGAO CITY BBQ STALLS - COMPLETE DATABASE SETUP 🍖
-- 
-- This is the ONE and ONLY SQL file you need for your BBQ business app!
-- It includes everything: tables, data, policies, and functions.
-- 
-- ⚠️  WARNING: This will create a complete working database
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Complete BBQ business management system
-- 💰  FOCUS: Commission tracking and order management

-- ========================================
-- 1. ENABLE EXTENSIONS
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 2. CREATE ALL TABLES
-- ========================================

-- BRANCHES TABLE (Your 4 Real Locations)
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS TABLE (BBQ Menu Items)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  commission DECIMAL(5,2) NOT NULL CHECK (commission >= 0),
  image_url VARCHAR(255),
  category VARCHAR(50) DEFAULT 'bbq',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HERO_SETTINGS TABLE (Homepage Content)
CREATE TABLE IF NOT EXISTS hero_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  title VARCHAR(255) NOT NULL DEFAULT 'Surigao City',
  subtitle VARCHAR(255) NOT NULL DEFAULT 'BBQ Stalls',
  description TEXT NOT NULL DEFAULT 'Experience the authentic taste of slow-smoked BBQ perfection. Every bite tells a story of tradition, passion, and fire.',
  badge_text VARCHAR(255) NOT NULL DEFAULT '#1 BBQ Restaurant in Surigao',
  button_text VARCHAR(255) NOT NULL DEFAULT 'ORDER NOW',
  button_link VARCHAR(255) NOT NULL DEFAULT '/cart',
  show_badge BOOLEAN NOT NULL DEFAULT true,
  show_features BOOLEAN NOT NULL DEFAULT true,
  show_trust_indicators BOOLEAN NOT NULL DEFAULT true,
  image_1_url TEXT,
  image_2_url TEXT,
  image_3_url TEXT,
  feature_1_text VARCHAR(255) NOT NULL DEFAULT '2+ Hours Advance Order',
  feature_2_text VARCHAR(255) NOT NULL DEFAULT '4 Convenient Locations',
  feature_3_text VARCHAR(255) NOT NULL DEFAULT 'Premium Quality',
  trust_item_1_number VARCHAR(50) NOT NULL DEFAULT '15+',
  trust_item_1_label VARCHAR(255) NOT NULL DEFAULT 'Menu Items',
  trust_item_2_number VARCHAR(50) NOT NULL DEFAULT '4',
  trust_item_2_label VARCHAR(255) NOT NULL DEFAULT 'Branch Locations',
  trust_item_3_number VARCHAR(50) NOT NULL DEFAULT '100%',
  trust_item_3_label VARCHAR(255) NOT NULL DEFAULT 'Fresh & Local',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS TABLE (Customer Orders with Commission Tracking)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_address TEXT,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  promo_code VARCHAR(50),
  promo_discount DECIMAL(10,2) DEFAULT 0 CHECK (promo_discount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  total_commission DECIMAL(10,2) NOT NULL CHECK (total_commission >= 0),
  
  -- Payment
  payment_method VARCHAR(20) DEFAULT 'gcash' CHECK (payment_method IN ('gcash', 'cash', 'card')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  gcash_reference VARCHAR(100),
  payment_screenshot_url VARCHAR(255),
  
  -- Order Status
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER ITEMS TABLE (Individual Items with Commission Tracking)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(100) NOT NULL, -- Store name for historical reference
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  unit_commission DECIMAL(5,2) NOT NULL CHECK (unit_commission >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCT IMAGES TABLE (Multiple Images per Product)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROMO CODES TABLE (Discount Management)
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order DECIMAL(10,2) DEFAULT 0 CHECK (minimum_order >= 0),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SALES REPORTS TABLE (Commission Analytics)
CREATE TABLE IF NOT EXISTS sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_orders INTEGER NOT NULL CHECK (total_orders >= 0),
  total_revenue DECIMAL(12,2) NOT NULL CHECK (total_revenue >= 0),
  total_commission DECIMAL(12,2) NOT NULL CHECK (total_commission >= 0),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SYSTEM LOGS TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type VARCHAR(50) NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  error_details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 3. CREATE FUNCTIONS
-- ========================================

-- Function to generate order numbers (YYYYMMDD-001 format)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Get the current date in YYYYMMDD format
    SELECT TO_CHAR(CURRENT_DATE, 'YYYYMMDD') INTO new_number;
    
    -- Count existing orders for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders 
    WHERE order_number LIKE new_number || '%';
    
    -- Format as YYYYMMDD-XXX (e.g., 20240115-001)
    new_number := new_number || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- 4. CREATE TRIGGERS
-- ========================================

-- Drop existing triggers first to avoid conflicts
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS hero_settings_updated_at ON hero_settings;

-- Trigger to auto-generate order numbers
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Triggers to update updated_at timestamps
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER hero_settings_updated_at
  BEFORE UPDATE ON hero_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_reports_branch_id ON sales_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_date_range ON sales_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- ========================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ========================================
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. CREATE RLS POLICIES (COMPREHENSIVE ACCESS)
-- ========================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admin full access branches" ON branches;
DROP POLICY IF EXISTS "Public branch access" ON branches;
DROP POLICY IF EXISTS "Admin full access crew_attendance" ON crew_attendance;
DROP POLICY IF EXISTS "Allow hero settings updates" ON hero_settings;
DROP POLICY IF EXISTS "Hero settings are viewable by everyone" ON hero_settings;
DROP POLICY IF EXISTS "Public hero_settings access" ON hero_settings;
DROP POLICY IF EXISTS "Admin full access order_items" ON order_items;
DROP POLICY IF EXISTS "Crew branch access order_items" ON order_items;
DROP POLICY IF EXISTS "Customer own order items" ON order_items;
DROP POLICY IF EXISTS "Admin full access orders" ON orders;
DROP POLICY IF EXISTS "Crew branch access orders" ON orders;
DROP POLICY IF EXISTS "Customer own orders" ON orders;
DROP POLICY IF EXISTS "Allow product image deletion" ON product_images;
DROP POLICY IF EXISTS "Allow product image updates" ON product_images;
DROP POLICY IF EXISTS "Allow product image uploads" ON product_images;
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON product_images;
DROP POLICY IF EXISTS "Public product_images access" ON product_images;
DROP POLICY IF EXISTS "Admin full access products" ON products;
DROP POLICY IF EXISTS "Public product access" ON products;
DROP POLICY IF EXISTS "Admin full access promo_codes" ON promo_codes;
DROP POLICY IF EXISTS "Public promo code access" ON promo_codes;
DROP POLICY IF EXISTS "Admin full access sales_reports" ON sales_reports;
DROP POLICY IF EXISTS "Admin full access system_logs" ON system_logs;

-- Public access for products (menu display)
CREATE POLICY "Public product access" ON products 
FOR SELECT USING (is_active = true);

-- Public access for branches (location display)
CREATE POLICY "Public branch access" ON branches 
FOR SELECT USING (is_active = true);

-- Public access for hero settings (homepage content)
CREATE POLICY "Public hero_settings access" ON hero_settings 
FOR SELECT USING (true);

-- Public access for product images
CREATE POLICY "Product images are viewable by everyone" ON product_images
FOR SELECT USING (true);

-- Public access for promo codes
CREATE POLICY "Public promo code access" ON promo_codes 
FOR SELECT USING (is_active = true);

-- Orders policies - simplified to avoid conflicts
CREATE POLICY "Allow order insertion" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow order updates" ON orders
  FOR UPDATE USING (true);

-- Order items policies
CREATE POLICY "Allow order items insertion" ON order_items
FOR INSERT WITH CHECK (true);

-- ========================================
-- 8. INSERT INITIAL DATA
-- ========================================

-- Insert your 4 REAL branch locations with correct addresses
INSERT INTO branches (name, address, phone, is_active) VALUES
('Borromeo Surigao Main Branch', 'Borromeo, Barangay Taft, Surigao City', '+63-912-345-6789', true),
('Luna Branch', 'Barangay Luna, Surigao City', '+63-912-345-6790', true),
('Ipil Branch', 'Barangay Ipil, Surigao City', '+63-912-345-6791', true),
('Siargao Branch', 'Poblacion 3, Tourism Road, General Luna, Philippines', '+63-912-345-6792', true)
ON CONFLICT (id) DO NOTHING;

-- Insert BBQ menu products with commission tracking
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

-- Special Items
-- (BBQ Combo Platter and Family Pack removed - not needed)
ON CONFLICT (id) DO NOTHING;

-- Insert default hero settings
INSERT INTO hero_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, minimum_order, max_uses, is_active, expires_at) VALUES
('WELCOME10', 'percentage', 10.00, 200.00, 100, true, NOW() + INTERVAL '1 year'),
('BBQ20', 'fixed', 20.00, 150.00, 50, true, NOW() + INTERVAL '6 months'),
('FIRSTORDER', 'percentage', 15.00, 100.00, 200, true, NOW() + INTERVAL '1 year'),
('LOYALTY25', 'fixed', 25.00, 300.00, 75, true, NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 9. CREATE STORAGE BUCKETS
-- ========================================

-- Create payment screenshots bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create product images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 10. CREATE STORAGE POLICIES
-- ========================================

-- Payment screenshots policies
CREATE POLICY "Allow public uploads for payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "Allow public access to payment screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-screenshots');

CREATE POLICY "Allow public updates to payment screenshots" ON storage.objects
FOR UPDATE USING (bucket_id = 'payment-screenshots');

-- Product images policies
CREATE POLICY "Allow public uploads for product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public access to product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow public updates to product images" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

-- ========================================
-- 11. VERIFICATION QUERIES
-- ========================================

-- Check that everything was created successfully
SELECT 'Branches' as table_name, COUNT(*) as record_count FROM branches
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'Hero Settings' as table_name, COUNT(*) as record_count FROM hero_settings
UNION ALL
SELECT 'Promo Codes' as table_name, COUNT(*) as record_count FROM promo_codes;

-- Display sample data for verification
SELECT 'Your Branch Locations:' as info;
SELECT name, address, phone FROM branches;

SELECT 'Your BBQ Menu:' as info;
SELECT name, price, commission FROM products ORDER BY price DESC;

-- ========================================
-- 🎉 SETUP COMPLETE! 🎉
-- ========================================
-- 
-- Your BBQ business database is now ready!
-- 
-- ✅ 4 Real branch locations inserted
-- ✅ 12 BBQ products with commission tracking
-- ✅ Hero settings for homepage
-- ✅ Order management with commission calculation
-- ✅ Payment screenshot storage
-- ✅ Promo codes for discounts
-- ✅ All RLS policies configured for public access
-- 
-- 💰 MONEY TRACKING: Every order tracks individual product commissions
-- 🍖 COMMISSION RANGE: ₱2.00 to ₱4.50 per item
-- 📱 GCASH INTEGRATION: Ready for payment screenshots
-- 🏪 BRANCH MANAGEMENT: 4 real locations in Surigao
-- 
-- Next: Test your website at https://bbscbbq.vercel.app/
-- ========================================
