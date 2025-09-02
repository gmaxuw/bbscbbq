-- Add missing fields to orders table for checkout functionality
-- Run this in your Supabase SQL Editor

-- Add missing fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cooking_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reference_number TEXT UNIQUE;

-- Create index on reference_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_reference_number ON orders(reference_number);

-- Add comments to document the new fields
COMMENT ON COLUMN orders.customer_email IS 'Customer email address for order notifications';
COMMENT ON COLUMN orders.pickup_time IS 'Scheduled pickup time for the order';
COMMENT ON COLUMN orders.cooking_start_time IS 'When cooking should start (30 mins before pickup)';
COMMENT ON COLUMN orders.reference_number IS 'Unique alphanumeric reference number for QR codes';
