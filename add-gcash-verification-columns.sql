-- Add GCash verification columns to orders table
-- These columns are needed for manual payment verification

-- Add gcash_reference column for storing GCash reference numbers
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS gcash_reference VARCHAR(100);

-- Add payment_screenshot column for storing GCash payment screenshots
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_screenshot VARCHAR(255);

-- Add comments to document the columns
COMMENT ON COLUMN orders.gcash_reference IS 'GCash reference number for manual verification';
COMMENT ON COLUMN orders.payment_screenshot IS 'URL to payment screenshot stored in Supabase Storage';
