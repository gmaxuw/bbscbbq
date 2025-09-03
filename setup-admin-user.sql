-- 🔧 SETUP ADMIN USER - BBQ BUSINESS APP 🍖
-- 
-- This script sets up your admin user in the new clean system
-- by adding the role to the user's metadata in auth.users
-- 
-- ⚠️  WARNING: Replace 'your-admin-email@example.com' with your actual admin email
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Set up admin user in the new clean system

-- =====================================================
-- STEP 1: UPDATE YOUR ADMIN USER'S ROLE
-- =====================================================

-- Replace 'your-admin-email@example.com' with your actual admin email
-- This will add the 'admin' role to your user's metadata
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin-email@example.com';

-- =====================================================
-- STEP 2: VERIFY THE UPDATE
-- =====================================================

-- Check if the update worked
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'your-admin-email@example.com';

-- =====================================================
-- STEP 3: SUCCESS MESSAGE
-- =====================================================

SELECT 'Admin user setup completed!' as status;
SELECT 'Your admin account is now ready for the new system!' as message;
