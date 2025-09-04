-- Create admin_users table for admin and crew management
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

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Admin users can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'admin' 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert admin users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'admin' 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can update admin users" ON admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'admin' 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can delete admin users" ON admin_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'admin' 
      AND au.is_active = true
    )
  );

-- Create index for better performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);

-- Insert your admin account
-- First, we need to get your user ID from auth.users
-- You'll need to replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
INSERT INTO admin_users (user_id, email, name, role, is_active) 
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID from auth.users
  'gabu.sacro@gmail.com',
  'Gabriel Sacro',
  'admin',
  true
);

-- Also insert the default admin account
INSERT INTO admin_users (user_id, email, name, role, is_active) 
VALUES (
  'YOUR_USER_ID_HERE', -- Replace with your actual user ID from auth.users
  'admin@bbqrestaurant.com',
  'BBQ Restaurant Admin',
  'admin',
  true
);
