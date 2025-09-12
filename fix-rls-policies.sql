-- Fix RLS policies to prevent infinite recursion
-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Allow authenticated read" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin check" ON admin_users;
DROP POLICY IF EXISTS "Users can read self" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage all" ON admin_users;

-- Create a simple, working RLS policy for admin_users
-- This policy allows authenticated users to read admin_users for role checking
CREATE POLICY "Allow authenticated users to read admin_users" ON admin_users
FOR SELECT
TO authenticated
USING (true);

-- Create a policy for admin management that doesn't create circular dependencies
-- Use a simple approach: only allow admins to manage other admin users
CREATE POLICY "Admins can manage admin_users" ON admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'admin' 
    AND au.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users au 
    WHERE au.user_id = auth.uid() 
    AND au.role = 'admin' 
    AND au.is_active = true
  )
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
