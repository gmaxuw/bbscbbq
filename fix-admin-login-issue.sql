-- Fix Admin Login Issue
-- Problem: Duplicate admin users with same user_id but different emails
-- Solution: Remove duplicate and ensure consistency

-- Remove the duplicate admin user entry
DELETE FROM admin_users WHERE email = 'admin@bbqrestaurant.com';

-- Verify the remaining admin user
SELECT * FROM admin_users WHERE is_active = true;

-- Check auth users
SELECT id, email FROM auth.users WHERE email = 'gabu.sacro@gmail.com';
