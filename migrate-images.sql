-- 🔄 MIGRATE EXISTING IMAGES TO NEW MULTIPLE IMAGE SYSTEM
-- 
-- This script moves your existing single images from products.image_url 
-- to the new product_images table for the multiple image system.
--
-- ⚠️  Run this in your Supabase SQL Editor
-- 🎯  This will preserve all your existing images

-- Step 1: Insert existing images into product_images table
INSERT INTO product_images (product_id, image_url, display_order, is_primary)
SELECT 
  id as product_id,
  image_url,
  1 as display_order,
  true as is_primary
FROM products 
WHERE image_url IS NOT NULL 
AND image_url != '';

-- Step 2: Verify the migration worked
SELECT 
  p.name as product_name,
  p.image_url as old_image_url,
  pi.image_url as new_image_url,
  pi.is_primary
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.image_url IS NOT NULL
ORDER BY p.name;
