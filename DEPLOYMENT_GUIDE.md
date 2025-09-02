# 🚀 Deploy Your BBQ Business to Vercel - Complete Guide

## 🎯 What We're Deploying

Your **COMPLETE** BBQ Order Management System:
- ✅ Professional website with product catalog
- ✅ Shopping cart and checkout system
- ✅ Real order management with Supabase
- ✅ QR code generation for order claiming
- ✅ Order tracking and history
- ✅ Admin dashboard for order management
- ✅ Email confirmation system

## 📋 Pre-Deployment Checklist

### 1. ✅ Database Migration (CRITICAL)
**You MUST run this first in Supabase:**
```sql
-- Run the contents of add-order-fields.sql in your Supabase SQL Editor
```

### 2. ✅ Environment Variables Setup
Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 GitHub Setup

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New Repository"
3. Name it: `surigao-bbq-stalls` (or any name you prefer)
4. Make it **Public** (required for free Vercel deployment)
5. **Don't** initialize with README (we already have files)

### Step 2: Connect Local Repository to GitHub
```bash
# Replace 'your-username' with your actual GitHub username
git remote add origin https://github.com/your-username/surigao-bbq-stalls.git
git branch -M main
git push -u origin main
```

## 🌐 Vercel Deployment

### Step 1: Connect to Vercel
1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Import your `surigao-bbq-stalls` repository

### Step 2: Configure Environment Variables
In Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
   ```

### Step 3: Deploy
1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Get your live URL: `https://your-project.vercel.app`

## 🎉 Post-Deployment Testing

### Test Your Live Website:
1. **Homepage**: Browse products, add to cart
2. **Checkout**: Place a real order
3. **Order Confirmation**: See QR code and order number
4. **Order Tracking**: Test `/track-order` page
5. **Order History**: Test `/orders` page
6. **Admin Dashboard**: Test `/admin/orders` page

## 🔧 Production Optimizations

### 1. Custom Domain (Optional)
- Buy a domain like `surigaobbq.com`
- Connect it to Vercel in project settings

### 2. Email Service (Optional)
- Set up Resend or SendGrid for production emails
- Update Edge Function with real email service

### 3. Analytics (Optional)
- Add Google Analytics
- Add Vercel Analytics

## 📱 Mobile Testing

Test your live website on:
- ✅ Desktop browsers
- ✅ Mobile phones
- ✅ Tablets
- ✅ Different screen sizes

## 🎯 What You'll Have

After deployment, you'll have:
- **Professional website**: `https://your-project.vercel.app`
- **Admin dashboard**: `https://your-project.vercel.app/admin`
- **Order tracking**: `https://your-project.vercel.app/track-order`
- **Customer orders**: `https://your-project.vercel.app/orders`

## 🆘 Troubleshooting

### Common Issues:
1. **Build fails**: Check environment variables
2. **Database errors**: Ensure migration was run
3. **Images not loading**: Check Supabase storage permissions
4. **Orders not saving**: Check RLS policies

### Support:
- Check Vercel deployment logs
- Check Supabase logs
- Test locally first

## 🎊 You're Ready!

Your BBQ business will be **LIVE ON THE INTERNET** with a professional order management system that rivals any major restaurant chain!

**Total Cost**: $0 (Vercel free tier + Supabase free tier)
**Professional Level**: ⭐⭐⭐⭐⭐

Let's get your BBQ business online! 🍖🔥
