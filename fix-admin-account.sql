-- Fix Admin Account Migration
-- This script migrates admin accounts from the old 'users' table to the new 'admin_users' table
-- Run this in your Supabase SQL Editor

-- First, let's see what admin accounts exist in the old users table
SELECT 'Current admin accounts in users table:' as info;
SELECT id, email, full_name, role, is_active, created_at 
FROM users 
WHERE role = 'admin' 
ORDER BY created_at;

-- Check if admin_users table exists and what's in it
SELECT 'Current admin accounts in admin_users table:' as info;
SELECT id, user_id, email, role, is_active, created_at 
FROM admin_users 
ORDER BY created_at;

-- Migrate admin accounts from users table to admin_users table
-- This will create admin_users records for existing admin accounts
INSERT INTO admin_users (user_id, email, role, is_active, created_at)
SELECT 
    id as user_id,  -- Use the user ID from users table
    email,
    role,
    is_active,
    created_at
FROM users 
WHERE role = 'admin'
AND NOT EXISTS (
    -- Don't insert if already exists in admin_users
    SELECT 1 FROM admin_users au WHERE au.user_id = users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the migration
SELECT 'After migration - admin_users table:' as info;
SELECT id, user_id, email, role, is_active, created_at 
FROM admin_users 
ORDER BY created_at;

-- If you need to create a new admin account manually, use this template:
-- Replace 'your-email@example.com' with your actual email
-- Replace 'your-user-id-from-auth-users' with your actual Supabase Auth user ID

/*
INSERT INTO admin_users (user_id, email, role, is_active, created_at)
VALUES (
    'your-user-id-from-auth-users',  -- Get this from Supabase Auth dashboard
    'your-email@example.com',
    'admin',
    true,
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- To find your Supabase Auth user ID, run this query:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com';
