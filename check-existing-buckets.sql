-- 🔍 CHECK EXISTING STORAGE BUCKETS - BBQ BUSINESS APP 🍖
-- 
-- This script checks what storage buckets already exist
-- and shows their current configuration
-- 
-- 🔒  STATUS: READY TO EXECUTE - Run in Supabase SQL Editor
-- 📍  LOCATION: Supabase Storage
-- 🎯  PURPOSE: See what buckets already exist before creating new ones

-- =====================================================
-- CHECK EXISTING STORAGE BUCKETS
-- =====================================================

SELECT 'Current Storage Buckets:' as info;
SELECT 
  id as bucket_id,
  name as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
ORDER BY name;

-- =====================================================
-- CHECK EXISTING RLS POLICIES FOR STORAGE
-- =====================================================

SELECT 'Current Storage RLS Policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
ORDER BY policyname;
