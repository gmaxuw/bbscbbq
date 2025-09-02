-- Fix Orders RLS Policy for Admin Access
-- The current policy checks auth.uid() which returns null from frontend
-- We need to allow admin access based on email instead

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Create a new policy that allows admin access based on email
CREATE POLICY "Admins can view all orders by email" ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE users.email = auth.jwt() ->> 'email' 
    AND users.role = 'admin'
  )
);

-- Also update the modification policy
DROP POLICY IF EXISTS "Only admins and crew can modify orders" ON orders;

CREATE POLICY "Admins and crew can modify orders" ON orders
FOR ALL
USING (
  EXISTS (
    SELECT 1 
    FROM users 
    WHERE users.email = auth.jwt() ->> 'email' 
    AND users.role IN ('admin', 'crew')
  )
);
