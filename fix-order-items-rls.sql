-- 🔧 FIX ORDER_ITEMS TABLE RLS FOR DELETE CHECK
-- 
-- This script adds a simple policy to allow reading order_items
-- for the product deletion check functionality.
--
-- ⚠️  Run this in your Supabase SQL Editor

-- Add a simple policy to allow reading order_items for product deletion checks
CREATE POLICY "Allow order items read for product deletion check" ON order_items
FOR SELECT USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'order_items'
ORDER BY policyname;
