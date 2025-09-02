-- Fix Conflicting RLS Policies on Orders Table
-- Run this in your Supabase SQL Editor

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow order insertion" ON orders;
DROP POLICY IF EXISTS "Allow order viewing" ON orders;
DROP POLICY IF EXISTS "Allow order updates" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders by email" ON orders;
DROP POLICY IF EXISTS "Admins and crew can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins and crew can modify orders" ON orders;
DROP POLICY IF EXISTS "Crew can view orders from their branch" ON orders;

-- Create simple, non-conflicting policies
-- Allow anyone to insert orders (for guest checkout)
CREATE POLICY "Allow order insertion" ON orders
  FOR INSERT WITH CHECK (true);

-- Allow anyone to view orders (for order verification)
CREATE POLICY "Allow order viewing" ON orders
  FOR SELECT USING (true);

-- Allow anyone to update orders (for status updates)
CREATE POLICY "Allow order updates" ON orders
  FOR UPDATE USING (true);

-- Allow admins and crew to do everything
CREATE POLICY "Admins and crew full access" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_active = true
    )
  );
