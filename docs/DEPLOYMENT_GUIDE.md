# 🚀 Production Deployment Guide

**Project:** Surigao City BBQ Stalls  
**Platform:** Vercel + Supabase  
**Last Updated:** January 2025  
**Status:** Production Ready  

---

## 📋 **Deployment Overview**

This guide covers deploying your BBQ restaurant management system to production using Vercel for the frontend and Supabase for the backend.

### **Architecture**
```
Frontend (Next.js) → Vercel
Backend (Supabase) → PostgreSQL + Auth + Storage + Real-time
Domain → Custom domain (optional)
```

---

## 🛠️ **Prerequisites**

### **Required Accounts**
- ✅ **Vercel Account** - [vercel.com](https://vercel.com)
- ✅ **Supabase Account** - [supabase.com](https://supabase.com)
- ✅ **GitHub Account** - [github.com](https://github.com)
- ✅ **Domain (Optional)** - For custom domain

### **Required Tools**
- Node.js 18+ installed locally
- Git installed and configured
- Code editor (VS Code recommended)

---

## 🗄️ **Database Setup (Supabase)**

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name:** `surigao-bbq-stalls`
   - **Database Password:** Generate strong password
   - **Region:** Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### **Step 2: Run Database Migration**
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `complete-database-setup.sql`
3. Click "Run" to execute the migration
4. Verify all tables are created successfully

### **Step 3: Configure Authentication**
1. Go to **Authentication** → **Settings**
2. Set **Site URL** to your Vercel domain (e.g., `https://your-app.vercel.app`)
3. Add **Redirect URLs:**
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/admin`
   - `https://your-app.vercel.app/crew`
4. Configure **Email Templates** using `docs/email-templates.md`

### **Step 4: Set Up Storage Buckets**
1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - `payment-screenshots` (Public)
   - `product-images` (Public)
3. Configure RLS policies for each bucket

### **Step 5: Get API Keys**
1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **Anon Key** (public key)
   - **Service Role Key** (keep secret)

---

## 🌐 **Frontend Deployment (Vercel)**

### **Step 1: Prepare Repository**
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. Ensure all files are committed:
   - `package.json` with correct dependencies
   - `next.config.js` with proper configuration
   - `.env.example` with environment variable template

### **Step 2: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (default)

### **Step 3: Configure Environment Variables**
In Vercel dashboard, go to **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 4: Deploy**
1. Click "Deploy" in Vercel
2. Wait for deployment to complete (2-3 minutes)
3. Get your live URL: `https://your-app.vercel.app`

---

## 🔧 **Post-Deployment Configuration**

### **Step 1: Update Supabase Settings**
1. Go to Supabase **Authentication** → **Settings**
2. Update **Site URL** to your Vercel URL
3. Add **Redirect URLs** for your domain

### **Step 2: Test Core Functionality**
1. **Homepage:** Visit your Vercel URL
2. **Cart:** Add items to cart
3. **Checkout:** Complete order process
4. **Admin:** Test admin login at `/admin/login`
5. **Orders:** Verify orders appear in admin dashboard

### **Step 3: Set Up Admin Account**
1. Go to `/admin/login`
2. Use "Create Admin" button (temporary)
3. Create your admin account
4. Test admin functionality

---

## 📧 **Email Configuration**

### **Step 1: Deploy Edge Function**
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Deploy email function:
   ```bash
   supabase functions deploy send-order-confirmation
   ```

### **Step 2: Configure Email Service**
1. Go to **Edge Functions** in Supabase dashboard
2. Configure email service (Resend recommended)
3. Add environment variables for email service
4. Test email functionality

---

## 🔐 **Security Configuration**

### **Step 1: Database Security**
1. Review all RLS policies
2. Ensure proper access controls
3. Test user permissions

### **Step 2: API Security**
1. Set up rate limiting
2. Configure CORS settings
3. Review API key usage

### **Step 3: File Upload Security**
1. Verify file type restrictions
2. Set appropriate file size limits
3. Test upload functionality

---

## 📊 **Monitoring & Analytics**

### **Step 1: Vercel Analytics**
1. Enable Vercel Analytics in dashboard
2. Monitor performance metrics
3. Set up alerts for errors

### **Step 2: Supabase Monitoring**
1. Monitor database performance
2. Check storage usage
3. Review authentication metrics

### **Step 3: Error Tracking**
1. Set up error logging
2. Monitor system logs
3. Configure alerts

---

## 🌍 **Custom Domain (Optional)**

### **Step 1: Purchase Domain**
1. Buy domain from registrar (Namecheap, GoDaddy, etc.)
2. Choose domain name (e.g., `surigaobbq.com`)

### **Step 2: Configure DNS**
1. Add CNAME record pointing to Vercel
2. Wait for DNS propagation (24-48 hours)

### **Step 3: Update Vercel Settings**
1. Go to **Domains** in Vercel dashboard
2. Add your custom domain
3. Configure SSL certificate

### **Step 4: Update Supabase Settings**
1. Update **Site URL** to custom domain
2. Update **Redirect URLs** for custom domain

---

## 🔄 **CI/CD Pipeline**

### **Automatic Deployments**
- **Main Branch:** Deploys to production
- **Feature Branches:** Deploys to preview
- **Pull Requests:** Deploys to preview

### **Environment Management**
- **Production:** `main` branch → `https://your-app.vercel.app`
- **Staging:** `develop` branch → `https://your-app-git-develop.vercel.app`
- **Preview:** Feature branches → `https://your-app-git-feature.vercel.app`

---

## 📱 **Mobile Optimization**

### **PWA Configuration**
1. Add PWA manifest
2. Configure service worker
3. Test offline functionality

### **Mobile Testing**
1. Test on various devices
2. Check responsive design
3. Verify touch interactions

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm install
npm run build
```

#### **Database Connection Issues**
```bash
# Verify environment variables
# Check Supabase project status
# Review RLS policies
```

#### **Authentication Issues**
```bash
# Check Supabase auth settings
# Verify redirect URLs
# Review user roles
```

#### **File Upload Issues**
```bash
# Check storage bucket configuration
# Verify RLS policies
# Check file size limits
```

### **Debug Steps**
1. Check Vercel deployment logs
2. Review Supabase logs
3. Test locally with production data
4. Check browser console for errors

---

## 📈 **Performance Optimization**

### **Frontend Optimization**
1. **Image Optimization:** Use Next.js Image component
2. **Code Splitting:** Implement lazy loading
3. **Caching:** Configure proper cache headers
4. **CDN:** Vercel provides global CDN

### **Database Optimization**
1. **Indexes:** Ensure proper database indexes
2. **Queries:** Optimize database queries
3. **Connection Pooling:** Configure connection limits
4. **Caching:** Implement query caching

---

## 🔄 **Backup & Recovery**

### **Database Backups**
1. **Automatic:** Supabase provides daily backups
2. **Manual:** Export data via Supabase dashboard
3. **Point-in-time:** Restore to specific timestamp

### **Code Backups**
1. **GitHub:** Primary code repository
2. **Vercel:** Deployment history
3. **Local:** Keep local backups

---

## 📋 **Maintenance Checklist**

### **Daily**
- [ ] Check system logs for errors
- [ ] Monitor order processing
- [ ] Verify payment confirmations

### **Weekly**
- [ ] Review performance metrics
- [ ] Check storage usage
- [ ] Update dependencies

### **Monthly**
- [ ] Review security settings
- [ ] Analyze user feedback
- [ ] Plan feature updates

---

## 🎯 **Success Metrics**

### **Performance Targets**
- **Page Load Time:** < 2 seconds
- **Lighthouse Score:** 95+
- **Uptime:** 99.9%
- **Mobile Score:** 95+

### **Business Metrics**
- **Order Processing:** Real-time
- **Payment Verification:** < 5 minutes
- **Customer Satisfaction:** High
- **Admin Efficiency:** 90% improvement

---

## 🆘 **Support & Resources**

### **Documentation**
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### **Community**
- [Vercel Discord](https://vercel.com/discord)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub](https://github.com/vercel/next.js)

### **Professional Support**
- Vercel Pro support
- Supabase Pro support
- Custom development services

---

## 🎉 **Deployment Complete!**

Your BBQ restaurant management system is now live and ready to handle real customers and orders!

### **Next Steps**
1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Train staff on admin dashboard
4. Start taking orders!

### **Important URLs**
- **Website:** `https://your-app.vercel.app`
- **Admin:** `https://your-app.vercel.app/admin`
- **Supabase:** `https://supabase.com/dashboard/project/your-project`

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Deployment Status:** Production Ready  
**Next Review:** Quarterly
