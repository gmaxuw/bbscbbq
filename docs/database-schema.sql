-- 🔐 ADMIN DASHBOARD DATABASE SCHEMA - SUPABASE SQL 🛡️
-- 
-- This script creates all necessary tables for the admin dashboard:
-- - Users and authentication
-- - Products and inventory
-- - Orders and order items
-- - Branches and crew management
-- - Sales reporting and analytics
-- - System logging and error tracking
-- 
-- ⚠️  WARNING: This is the complete database structure
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Foundation for all admin dashboard functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE (Authentication & Role Management)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'crew', 'customer')),
  branch_id UUID, -- NULL for admin, required for crew
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BRANCHES TABLE (Store Locations)
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PRODUCTS TABLE (Menu Items)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  commission DECIMAL(5,2) NOT NULL CHECK (commission >= 0),
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ORDERS TABLE (Customer Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  total_commission DECIMAL(10,2) NOT NULL CHECK (total_commission >= 0),
  promo_code VARCHAR(50),
  promo_discount DECIMAL(10,2) DEFAULT 0 CHECK (promo_discount >= 0),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  gcash_reference VARCHAR(100),
  payment_screenshot VARCHAR(255),
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE (Individual Items in Orders)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  unit_commission DECIMAL(5,2) NOT NULL CHECK (unit_commission >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREW ATTENDANCE TABLE (Time Tracking)
CREATE TABLE IF NOT EXISTS crew_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(5,2),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. PROMO CODES TABLE (Discount Management)
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

-- 8. SALES REPORTS TABLE (Analytics & Reporting)
CREATE TABLE IF NOT EXISTS sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_orders INTEGER NOT NULL CHECK (total_orders >= 0),
  total_revenue DECIMAL(12,2) NOT NULL CHECK (total_revenue >= 0),
  total_commission DECIMAL(12,2) NOT NULL CHECK (total_commission >= 0),
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. SYSTEM LOGS TABLE (Audit Trail & Error Tracking)
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  error_details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for users.branch_id
ALTER TABLE users ADD CONSTRAINT fk_users_branch 
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_crew_attendance_user_id ON crew_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_attendance_branch_id ON crew_attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_crew_attendance_date ON crew_attendance(date);
CREATE INDEX IF NOT EXISTS idx_sales_reports_branch_id ON sales_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_date_range ON sales_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_system_logs_log_type ON system_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - customize based on your security needs)
-- Admin can access everything
CREATE POLICY "Admin full access" ON users FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON branches FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON products FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON order_items FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON crew_attendance FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON promo_codes FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON sales_reports FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin full access" ON system_logs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Crew can access their branch data
CREATE POLICY "Crew branch access" ON orders FOR SELECT USING (
  auth.jwt() ->> 'role' = 'crew' AND 
  branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
);

-- Public access for products (menu display)
CREATE POLICY "Public product access" ON products FOR SELECT USING (is_active = true);

-- Comments for documentation
COMMENT ON TABLE users IS 'User authentication and role management for admin dashboard';
COMMENT ON TABLE branches IS 'Store branch locations and information';
COMMENT ON TABLE products IS 'Menu items with pricing and commission structure';
COMMENT ON TABLE orders IS 'Customer orders with payment and pickup details';
COMMENT ON TABLE order_items IS 'Individual items within each order';
COMMENT ON TABLE crew_attendance IS 'Crew member time tracking and attendance';
COMMENT ON TABLE promo_codes IS 'Promotional codes and discount management';
COMMENT ON TABLE sales_reports IS 'Sales analytics and reporting data';
COMMENT ON TABLE system_logs IS 'System audit trail and error logging';
