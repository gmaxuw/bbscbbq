-- 🗂️ CLEAN STORAGE BUCKETS SETUP - BBQ BUSINESS APP 🍖
-- 
-- This script creates organized storage buckets for:
-- - Product images
-- - Payment screenshots
-- - User uploads
-- - System files
-- 
-- ⚠️  WARNING: This will create new storage buckets
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Storage
-- 🎯  PURPOSE: Organize file storage with proper RLS policies

-- =====================================================
-- STEP 1: CREATE STORAGE BUCKETS
-- =====================================================

-- Create product images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create payment screenshots bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create user uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false, -- Private bucket
  20971520, -- 20MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Create system files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-files',
  'system-files',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'text/csv', 'application/json', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: CREATE RLS POLICIES FOR PRODUCT IMAGES
-- =====================================================

-- Public read access for product images
CREATE POLICY "Public read access for product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Admin full access for product images
CREATE POLICY "Admin full access for product images" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- =====================================================
-- STEP 3: CREATE RLS POLICIES FOR PAYMENT SCREENSHOTS
-- =====================================================

-- Admin read access for payment screenshots
CREATE POLICY "Admin read access for payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- Customer read access to their own payment screenshots
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

-- Customer upload access for payment screenshots
CREATE POLICY "Customer upload payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-screenshots' AND 
  auth.uid() IS NOT NULL
);

-- =====================================================
-- STEP 4: CREATE RLS POLICIES FOR USER UPLOADS
-- =====================================================

-- Users can read their own uploads
CREATE POLICY "Users read own uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload to their own folder
CREATE POLICY "Users upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own uploads
CREATE POLICY "Users update own uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own uploads
CREATE POLICY "Users delete own uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin full access for user uploads
CREATE POLICY "Admin full access for user uploads" ON storage.objects
FOR ALL USING (
  bucket_id = 'user-uploads' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- =====================================================
-- STEP 5: CREATE RLS POLICIES FOR SYSTEM FILES
-- =====================================================

-- Admin only access for system files
CREATE POLICY "Admin only access for system files" ON storage.objects
FOR ALL USING (
  bucket_id = 'system-files' AND 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- =====================================================
-- STEP 6: CREATE HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to get public URL for product images
CREATE OR REPLACE FUNCTION get_product_image_url(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- If it's already a full URL, return as is
  IF image_path LIKE 'http%' THEN
    RETURN image_path;
  END IF;
  
  -- If it's a relative path, construct the public URL
  RETURN 'https://your-project-ref.supabase.co/storage/v1/object/public/product-images/' || image_path;
END;
$$ LANGUAGE plpgsql;

-- Function to get secure URL for payment screenshots
CREATE OR REPLACE FUNCTION get_payment_screenshot_url(screenshot_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF screenshot_path IS NULL OR screenshot_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- Return the secure URL for private bucket
  RETURN 'https://your-project-ref.supabase.co/storage/v1/object/sign/payment-screenshots/' || screenshot_path;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: VERIFICATION
-- =====================================================

-- Check bucket creation
SELECT 'Storage buckets created:' as info;
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;

-- Check RLS policies
SELECT 'RLS policies created:' as info;
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'objects' ORDER BY policyname;

-- =====================================================
-- STEP 8: SUCCESS MESSAGE
-- =====================================================

SELECT 'Storage buckets setup completed successfully!' as status;
SELECT 'Your file storage system is now organized and secure!' as message;
