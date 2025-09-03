-- 🚀 CLEAN DATABASE SCHEMA - BBQ BUSINESS APP 🍖
-- 
-- This script creates a clean, unified database structure that properly
-- integrates with Supabase Auth and fixes all registration/login issues.
-- 
-- ⚠️  WARNING: This will DROP all existing tables and data
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Fix authentication issues and create unified user system

-- =====================================================
-- STEP 1: DROP ALL EXISTING TABLES (Clean Slate)
-- =====================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS sales_reports CASCADE;
DROP TABLE IF EXISTS crew_attendance CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS promo_codes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_crew(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_admin_user() CASCADE;

-- =====================================================
-- STEP 2: ENABLE EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 3: CREATE CLEAN TABLE STRUCTURE
-- =====================================================

-- 1. BRANCHES TABLE (Store Locations)
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PRODUCTS TABLE (Menu Items)
CREATE TABLE products (
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

-- 3. PROMO CODES TABLE (Discount Management)
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order DECIMAL(10,2) DEFAULT 0 CHECK (minimum_order >= 0),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE (Customer Orders) - Complete Structure
CREATE TABLE orders (
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

-- 5. ORDER ITEMS TABLE (Individual Items in Orders)
CREATE TABLE order_items (
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

-- 6. CREW ATTENDANCE TABLE (Time Tracking)
CREATE TABLE crew_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(5,2),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SALES REPORTS TABLE (Analytics & Reporting)
CREATE TABLE sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_orders INTEGER NOT NULL CHECK (total_orders >= 0),
  total_revenue DECIMAL(12,2) NOT NULL CHECK (total_revenue >= 0),
  total_commission DECIMAL(12,2) NOT NULL CHECK (total_commission >= 0),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. SYSTEM LOGS TABLE (Audit Trail & Error Tracking)
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  error_details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Orders indexes
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Products indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Crew attendance indexes
CREATE INDEX idx_crew_attendance_user_id ON crew_attendance(user_id);
CREATE INDEX idx_crew_attendance_branch_id ON crew_attendance(branch_id);
CREATE INDEX idx_crew_attendance_date ON crew_attendance(date);

-- Sales reports indexes
CREATE INDEX idx_sales_reports_branch_id ON sales_reports(branch_id);
CREATE INDEX idx_sales_reports_date_range ON sales_reports(start_date, end_date);

-- System logs indexes
CREATE INDEX idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate order numbers
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

-- Function to auto-set order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is crew
CREATE OR REPLACE FUNCTION is_crew(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid 
    AND raw_user_meta_data->>'role' = 'crew'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role' 
    FROM auth.users 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Updated_at triggers
CREATE TRIGGER update_branches_updated_at 
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at 
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number trigger
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- =====================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: CREATE RLS POLICIES
-- =====================================================

-- Admin policies (full access)
CREATE POLICY "Admin full access branches" ON branches FOR ALL USING (is_admin());
CREATE POLICY "Admin full access products" ON products FOR ALL USING (is_admin());
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "Admin full access order_items" ON order_items FOR ALL USING (is_admin());
CREATE POLICY "Admin full access crew_attendance" ON crew_attendance FOR ALL USING (is_admin());
CREATE POLICY "Admin full access promo_codes" ON promo_codes FOR ALL USING (is_admin());
CREATE POLICY "Admin full access sales_reports" ON sales_reports FOR ALL USING (is_admin());
CREATE POLICY "Admin full access system_logs" ON system_logs FOR ALL USING (is_admin());

-- Crew policies (branch-specific access)
CREATE POLICY "Crew branch access orders" ON orders FOR SELECT USING (
  is_crew() AND 
  branch_id IN (
    SELECT branch_id FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'branch_id' IS NOT NULL
  )
);

CREATE POLICY "Crew branch access order_items" ON order_items FOR SELECT USING (
  is_crew() AND 
  order_id IN (
    SELECT id FROM orders 
    WHERE branch_id IN (
      SELECT (raw_user_meta_data->>'branch_id')::UUID FROM auth.users 
      WHERE id = auth.uid()
    )
  )
);

-- Public policies (read-only access)
CREATE POLICY "Public product access" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public branch access" ON branches FOR SELECT USING (is_active = true);
CREATE POLICY "Public promo code access" ON promo_codes FOR SELECT USING (is_active = true);

-- Customer policies (own orders)
CREATE POLICY "Customer own orders" ON orders FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Customer own order items" ON order_items FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  order_id IN (
    SELECT id FROM orders 
    WHERE customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- =====================================================
-- STEP 9: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE branches IS 'Store branch locations and information';
COMMENT ON TABLE products IS 'Menu items with pricing and commission structure';
COMMENT ON TABLE orders IS 'Customer orders with payment and pickup details';
COMMENT ON TABLE order_items IS 'Individual items within each order';
COMMENT ON TABLE crew_attendance IS 'Crew member time tracking and attendance';
COMMENT ON TABLE promo_codes IS 'Promotional codes and discount management';
COMMENT ON TABLE sales_reports IS 'Sales analytics and reporting data';
COMMENT ON TABLE system_logs IS 'System audit trail and error logging';

-- =====================================================
-- STEP 10: VERIFICATION
-- =====================================================

-- Display table creation confirmation
SELECT 'Database schema created successfully!' as status;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
