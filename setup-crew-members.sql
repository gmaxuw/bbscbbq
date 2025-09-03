-- 👥 SETUP CREW MEMBERS - BBQ BUSINESS APP 🍖
-- 
-- This script sets up crew members in the new clean system
-- by adding crew roles to their metadata in auth.users
-- 
-- ⚠️  WARNING: Replace crew emails with actual crew member emails
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Database
-- 🎯  PURPOSE: Set up crew members in the new clean system

-- =====================================================
-- STEP 1: SET UP CREW MEMBERS
-- =====================================================

-- Replace these emails with your actual crew member emails
-- This will add the 'crew' role to their metadata and branch assignment

-- Crew Member 1 (Downtown Branch)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'crew', 'branch_id', (SELECT id FROM branches WHERE name LIKE '%Downtown%' LIMIT 1))
WHERE email = 'crew1@surigaobbq.com';

-- Crew Member 2 (Mall Branch)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'crew', 'branch_id', (SELECT id FROM branches WHERE name LIKE '%Mall%' LIMIT 1))
WHERE email = 'crew2@surigaobbq.com';

-- Crew Member 3 (University Branch)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'crew', 'branch_id', (SELECT id FROM branches WHERE name LIKE '%University%' LIMIT 1))
WHERE email = 'crew3@surigaobbq.com';

-- Crew Member 4 (Residential Branch)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', 'crew', 'branch_id', (SELECT id FROM branches WHERE name LIKE '%Residential%' LIMIT 1))
WHERE email = 'crew4@surigaobbq.com';

-- =====================================================
-- STEP 2: VERIFY THE UPDATES
-- =====================================================

-- Check all crew members
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'crew'
ORDER BY email;

-- =====================================================
-- STEP 3: SUCCESS MESSAGE
-- =====================================================

SELECT 'Crew members setup completed!' as status;
SELECT 'Crew members can now login at /crew/login!' as message;
