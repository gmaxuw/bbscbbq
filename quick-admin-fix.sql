-- Quick fix: Create admin_users table and add your admin account
-- Run this in your Supabase SQL Editor

-- 1. Create the admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'crew')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Create basic RLS policy (allow all for now, we'll restrict later)
CREATE POLICY "Allow all operations for admin_users" ON admin_users
  FOR ALL USING (true);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- 5. Insert your admin account
-- First, find your user ID from auth.users table
-- Go to Authentication > Users in Supabase dashboard and copy your user ID
-- Then replace 'YOUR_USER_ID_HERE' with your actual user ID

INSERT INTO admin_users (user_id, email, name, role, is_active) 
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID from auth.users
  'gabu.sacro@gmail.com',
  'Gabriel Sacro',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- 6. Also add the default admin account
INSERT INTO admin_users (user_id, email, name, role, is_active) 
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID from auth.users
  'admin@bbqrestaurant.com',
  'BBQ Restaurant Admin',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;
