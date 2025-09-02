-- 🔧 FIX PRODUCT_IMAGES TABLE RLS POLICIES
-- 
-- This script adds the necessary RLS policies to allow operations
-- on the product_images table for the multiple image system.
--
-- ⚠️  Run this in your Supabase SQL Editor

-- Enable RLS on product_images table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view product images (for public display)
CREATE POLICY "Product images are viewable by everyone" ON product_images
FOR SELECT USING (true);

-- Allow everyone to insert product images (for admin uploads)
CREATE POLICY "Allow product image uploads" ON product_images
FOR INSERT WITH CHECK (true);

-- Allow everyone to update product images (for admin management)
CREATE POLICY "Allow product image updates" ON product_images
FOR UPDATE USING (true);

-- Allow everyone to delete product images (for admin management)
CREATE POLICY "Allow product image deletion" ON product_images
FOR DELETE USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'product_images';
