# PowerShell script to set up .env.local for Supabase 2025
Write-Host "🔧 Setting up .env.local for Supabase 2025..." -ForegroundColor Green

# Create .env.local file
$envContent = @"
NEXT_PUBLIC_SUPABASE_URL=https://prqfpxrtopguvelmflhk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycWZweHJ0b3BndXZlbG1mbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzAxMDcsImV4cCI6MjA3MjA0NjEwN30.AjdPycuLam0DW6PMutFrLXfHD9Zgztjp0cXMvDxTr64
SUPABASE_SECRET_KEY=your-secret-key-here
"@

# Write to .env.local
$envContent | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host "✅ .env.local created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Get your secret key from Supabase dashboard" -ForegroundColor White
Write-Host "2. Replace 'your-secret-key-here' in .env.local" -ForegroundColor White
Write-Host "3. Restart your development server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "   Go to: Settings > API > service_role secret" -ForegroundColor Cyan
