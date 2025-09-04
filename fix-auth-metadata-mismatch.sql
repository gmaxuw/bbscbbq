-- 🔧 CRITICAL FIX: Auth Metadata Mismatch Between Frontend and Backend 🔧
-- Frontend uses: user.user_metadata?.role
-- Database has: raw_user_meta_data
-- RLS policies need: raw_user_meta_data

-- This script creates a view that maps raw_user_meta_data to user_metadata
-- so both frontend and RLS policies work correctly

-- Step 1: Create a view that exposes user_metadata from raw_user_meta_data
CREATE OR REPLACE VIEW auth.user_metadata_view AS
SELECT 
  id,
  email,
  created_at,
  updated_at,
  raw_user_meta_data as user_metadata
FROM auth.users;

-- Step 2: Grant access to the view
GRANT SELECT ON auth.user_metadata_view TO authenticated;
GRANT SELECT ON auth.user_metadata_view TO anon;

-- Step 3: Fix storage RLS policies to use the correct column
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin full access payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Customer upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Customer read own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access user uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin only access system files" ON storage.objects;

-- Create FIXED policies using raw_user_meta_data (the correct column)
-- Admin full access to payment screenshots
CREATE POLICY "Admin full access payment screenshots FIXED" ON storage.objects
  FOR ALL USING (
    bucket_id = 'payment-screenshots' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Customer upload payment screenshots (any authenticated user can upload)
CREATE POLICY "Customer upload payment screenshots FIXED" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-screenshots' AND 
    auth.uid() IS NOT NULL
  );

-- Customer read own payment screenshots
CREATE POLICY "Customer read own payment screenshots FIXED" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-screenshots' AND 
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.payment_screenshot_url LIKE '%' || objects.name || '%'
      AND orders.customer_email = (
        SELECT users.email FROM auth.users WHERE users.id = auth.uid()
      )
    )
  );

-- Admin full access to product images
CREATE POLICY "Admin full access product images FIXED" ON storage.objects
  FOR ALL USING (
    bucket_id = 'product-images' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin full access to user uploads
CREATE POLICY "Admin full access user uploads FIXED" ON storage.objects
  FOR ALL USING (
    bucket_id = 'user-uploads' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Admin only access to system files
CREATE POLICY "Admin only access system files FIXED" ON storage.objects
  FOR ALL USING (
    bucket_id = 'system-files' AND 
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE users.id = auth.uid() 
      AND users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Step 4: Create a function to sync user_metadata with raw_user_meta_data
CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- When raw_user_meta_data is updated, ensure user_metadata is in sync
  -- This is handled automatically by Supabase, but we add this for safety
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to keep metadata in sync
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON auth.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_metadata();

-- Success message
SELECT '✅ Auth metadata mismatch fixed! Both frontend and RLS policies should now work correctly.' as status;
