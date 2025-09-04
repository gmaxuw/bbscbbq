-- 🛒 CREATE USER CARTS TABLE FOR CART SYNCHRONIZATION 🛒
-- Run this SQL in your Supabase SQL Editor to enable cart sync across devices

-- USER CARTS TABLE (Cart Synchronization Across Devices)
CREATE TABLE IF NOT EXISTS user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_carts_updated_at ON user_carts;

-- Create trigger for updated_at
CREATE TRIGGER update_user_carts_updated_at
  BEFORE UPDATE ON user_carts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_product_id ON user_carts(product_id);

-- Enable RLS
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own cart" ON user_carts;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON user_carts;
DROP POLICY IF EXISTS "Users can update their own cart items" ON user_carts;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON user_carts;

-- User cart policies (users can only access their own cart)
CREATE POLICY "Users can view their own cart" ON user_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON user_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON user_carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON user_carts
  FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT '✅ user_carts table created successfully! Cart synchronization is now enabled.' as status;
