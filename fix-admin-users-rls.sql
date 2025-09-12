-- Fix admin_users RLS policies
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all problematic policies
DROP POLICY IF EXISTS "Allow authenticated read" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin check" ON admin_users;
DROP POLICY IF EXISTS "Users can read self" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage all" ON admin_users;

-- Step 2: Create a simple working policy
CREATE POLICY "Allow read admin_users" ON admin_users
FOR SELECT
TO authenticated
USING (true);

-- Step 3: Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Test the policy
SELECT * FROM admin_users LIMIT 1;
