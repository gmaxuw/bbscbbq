-- Simple check for existing storage buckets
SELECT id, name, public, file_size_limit FROM storage.buckets ORDER BY name;
