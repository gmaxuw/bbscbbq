-- Create payment screenshots storage bucket
-- Run this in your Supabase SQL Editor

-- Create the storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create RLS policy to allow public uploads for payment screenshots
CREATE POLICY "Allow public uploads for payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots');

-- Create RLS policy to allow public access to payment screenshots
CREATE POLICY "Allow public access to payment screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-screenshots');

-- Create RLS policy to allow public updates to payment screenshots
CREATE POLICY "Allow public updates to payment screenshots" ON storage.objects
FOR UPDATE USING (bucket_id = 'payment-screenshots');
