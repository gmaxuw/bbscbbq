-- Add missing tables for admin functionality

-- ADMIN_USERS TABLE (Admin/Crew Management)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'crew')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USERS TABLE (Customer Management)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'crew', 'admin')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CREW_ATTENDANCE TABLE (Time Tracking)
CREATE TABLE IF NOT EXISTS crew_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
  clock_out TIMESTAMP WITH TIME ZONE,
  hours_worked DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_crew_attendance_user_id ON crew_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_attendance_clock_in ON crew_attendance(clock_in);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Admin users are viewable by everyone" ON admin_users
FOR SELECT USING (true);

CREATE POLICY "Admin users can be inserted by admins" ON admin_users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin users can be updated by admins" ON admin_users
FOR UPDATE USING (true);

-- Create RLS policies for users
CREATE POLICY "Users are viewable by everyone" ON users
FOR SELECT USING (true);

CREATE POLICY "Users can be inserted by anyone" ON users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated by anyone" ON users
FOR UPDATE USING (true);

-- Create RLS policies for crew_attendance
CREATE POLICY "Crew attendance is viewable by everyone" ON crew_attendance
FOR SELECT USING (true);

CREATE POLICY "Crew attendance can be inserted by anyone" ON crew_attendance
FOR INSERT WITH CHECK (true);

CREATE POLICY "Crew attendance can be updated by anyone" ON crew_attendance
FOR UPDATE USING (true);
