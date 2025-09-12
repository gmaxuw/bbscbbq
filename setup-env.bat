@echo off
echo Setting up .env.local for Supabase 2025...

echo NEXT_PUBLIC_SUPABASE_URL=https://prqfpxrtopguvelmflhk.supabase.co > .env.local
echo NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycWZweHJ0b3BndXZlbG1mbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzAxMDcsImV4cCI6MjA3MjA0NjEwN30.AjdPycuLam0DW6PMutFrLXfHD9Zgztjp0cXMvDxTr64 >> .env.local
echo SUPABASE_SECRET_KEY=your-secret-key-here >> .env.local

echo.
echo .env.local created successfully!
echo.
echo Next steps:
echo 1. Get your secret key from Supabase dashboard
echo 2. Replace 'your-secret-key-here' in .env.local
echo 3. Restart your development server: npm run dev
echo.
echo Supabase Dashboard: https://supabase.com/dashboard
echo Go to: Settings > API > service_role secret
echo.
pause
