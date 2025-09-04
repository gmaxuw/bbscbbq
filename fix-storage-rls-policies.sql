-- 🔧 FIX STORAGE RLS POLICIES - CRITICAL FOR SCREENSHOT UPLOADS 🔧
-- This fixes the mismatch between frontend (user_metadata) and RLS policies (raw_user_meta_data)

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admin full access payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Customer upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Customer read own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access product images" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access user uploads" ON storage.objects;
DROP POLICY IF EXISTS "Admin only access system files" ON storage.objects;

-- Create FIXED policies using ONLY raw_user_meta_data (the correct column)
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

-- Success message
SELECT '✅ Storage RLS policies fixed! Screenshot uploads should now work properly.' as status;
