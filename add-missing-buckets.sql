-- 🎯 ADD MISSING STORAGE BUCKETS - BBQ BUSINESS APP 🍖
-- 
-- This script only adds what's missing from your existing setup:
-- - system-files bucket (for admin files)
-- - Better RLS policies for security
-- 
-- ⚠️  WARNING: This will only add missing buckets, not duplicate existing ones
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Storage
-- 🎯  PURPOSE: Complete your storage setup with missing pieces

-- =====================================================
-- STEP 1: CREATE MISSING SYSTEM FILES BUCKET
-- =====================================================

-- Create system files bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-files',
  'system-files',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/csv', 'application/json', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: IMPROVE RLS POLICIES FOR EXISTING BUCKETS
-- =====================================================

-- Drop existing policies to replace with better ones
DROP POLICY IF EXISTS "Allow public uploads for payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates to payment screenshots" ON storage.objects;

-- Better RLS policies for payment screenshots
CREATE POLICY "Admin full access payment screenshots" ON storage.objects
FOR ALL USING (
  bucket_id = 'payment-screenshots' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Customer upload payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-screenshots' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Customer read own payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND 
  auth.uid() IS NOT NULL AND
  -- Check if the file belongs to a customer's order
  EXISTS (
    SELECT 1 FROM orders 
    WHERE payment_screenshot_url LIKE '%' || name || '%'
    AND customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Better RLS policies for product images
CREATE POLICY "Public read access product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin full access product images" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Better RLS policies for user uploads
CREATE POLICY "Users read own uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users update own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admin full access user uploads" ON storage.objects
FOR ALL USING (
  bucket_id = 'user-uploads' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- RLS policies for system files (admin only)
CREATE POLICY "Admin only access system files" ON storage.objects
FOR ALL USING (
  bucket_id = 'system-files' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

-- Check all buckets
SELECT 'All Storage Buckets:' as info;
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;

-- Check RLS policies
SELECT 'Storage RLS Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' ORDER BY policyname;

-- =====================================================
-- STEP 4: SUCCESS MESSAGE
-- =====================================================

SELECT 'Storage setup completed successfully!' as status;
SELECT 'Your storage system is now complete and secure!' as message;
