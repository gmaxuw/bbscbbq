-- Fix Orders Table RLS Policies
-- Run this in your Supabase SQL Editor

-- First, let's check if RLS is enabled on orders table
-- If it's not enabled, we need to enable it
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Crew can view all orders" ON orders;

-- Create new policies that allow both customers and admin/crew access

-- Allow authenticated users to insert their own orders
CREATE POLICY "Authenticated users can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own orders (by customer_email matching their auth email)
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      customer_email = auth.jwt() ->> 'email' OR
      EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- Allow users to update their own orders
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      customer_email = auth.jwt() ->> 'email' OR
      EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )
  );

-- Allow admins and crew to view all orders
CREATE POLICY "Admins and crew can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Allow admins and crew to update all orders
CREATE POLICY "Admins and crew can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Add comments
COMMENT ON POLICY "Authenticated users can insert orders" ON orders IS 'Allows any authenticated user to create orders';
COMMENT ON POLICY "Users can view own orders" ON orders IS 'Users can view orders with their email or if they are admin/crew';
COMMENT ON POLICY "Admins and crew can view all orders" ON orders IS 'Admin and crew users can view all orders';