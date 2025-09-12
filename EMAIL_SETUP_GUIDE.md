# 📧 Email Setup Guide for BBQ Business App

## 🚨 **CRITICAL: Email Configuration Required**

Your password reset and notification emails are not working because Supabase needs to be configured to send emails. Follow this guide to fix it.

---

## 🔧 **Step 1: Configure Supabase Email Settings**

### **1.1 Go to Supabase Dashboard**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `prqfpxrtopguvelmflhk`
3. Go to **Authentication** → **Settings**

### **1.2 Configure Email Provider**
1. Scroll down to **Email** section
2. Choose one of these options:

#### **Option A: Use Supabase's Built-in Email (Easiest)**
- **SMTP Host**: `smtp.supabase.co`
- **SMTP Port**: `587`
- **SMTP User**: `noreply@prqfpxrtopguvelmflhk.supabase.co`
- **SMTP Password**: Get from Supabase dashboard
- **Sender Email**: `noreply@prqfpxrtopguvelmflhk.supabase.co`

#### **Option B: Use External Email Service (Recommended)**
- **Resend** (Recommended): Free tier, easy setup
- **SendGrid**: Professional, more features
- **Mailgun**: Reliable, good for production

---

## 🔧 **Step 2: Set Up Resend (Recommended)**

### **2.1 Create Resend Account**
1. Go to [Resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email

### **2.2 Get API Key**
1. Go to **API Keys** in Resend dashboard
2. Create new API key
3. Copy the API key (starts with `re_`)

### **2.3 Configure Supabase**
1. In Supabase Dashboard → **Authentication** → **Settings**
2. **Email Provider**: Custom SMTP
3. **SMTP Host**: `smtp.resend.com`
4. **SMTP Port**: `587`
5. **SMTP User**: `resend`
6. **SMTP Password**: API
7. **Sender Email**: `noreply@yourdomain.com` (or use Resend's default)

---

## 🔧 **Step 3: Configure Email Templates**

### **3.1 Password Reset Template**
1. Go to **Authentication** → **Email Templates**
2. Select **Recovery** template
3. Use the template from `docs/email-templates.md`

### **3.2 Email Confirmation Template**
1. Select **Confirm signup** template
2. Customize with your BBQ branding

---

## 🔧 **Step 4: Test Email Functionality**

### **4.1 Test Password Reset**
1. Go to `/admin/login`
2. Click "Forgot Password"
3. Enter your email: `gabu.sacro@gmail.com`
4. Check your email inbox

### **4.2 Test Admin Registration**
1. Go to `/admin/login`
2. Click "Create Admin" (temporary)
3. Fill out the form
4. Check for confirmation email

---

## 🔧 **Step 5: Environment Variables**

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://prqfpxrtopguvelmflhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration (if using custom SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your-resend-api-key
SMTP_FROM=noreply@yourdomain.com
```

---

## 🔧 **Step 6: Deploy Edge Functions**

The Edge Functions are already deployed, but you need to set the environment variables:

### **6.1 Set Edge Function Environment Variables**
1. Go to **Edge Functions** in Supabase dashboard
2. Select `send-password-reset` function
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `SUPABASE_URL`: `https://prqfpxrtopguvelmflhk.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

---

## 🚨 **Troubleshooting**

### **Problem: Emails not sending**
- **Solution**: Check SMTP configuration in Supabase
- **Check**: Verify API keys are correct
- **Check**: Check spam folder

### **Problem: "Invalid email" error**
- **Solution**: Verify email address exists in database
- **Check**: Run this query in Supabase SQL Editor:
  ```sql
  SELECT email FROM auth.users WHERE email = 'gabu.sacro@gmail.com';
  ```

### **Problem: Edge Function errors**
- **Solution**: Check Edge Function logs in Supabase dashboard
- **Check**: Verify environment variables are set

---

## ✅ **Verification Checklist**

- [ ] Supabase email provider configured
- [ ] SMTP credentials working
- [ ] Email templates customized
- [ ] Edge Function environment variables set
- [ ] Password reset email received
- [ ] Admin registration email received

---

## 📞 **Need Help?**

If you're still having issues:

1. **Check Supabase Logs**: Go to **Logs** → **Auth** in Supabase dashboard
2. **Check Edge Function Logs**: Go to **Edge Functions** → **Logs**
3. **Test with curl**:
   ```bash
   curl -X POST https://prqfpxrtopguvelmflhk.supabase.co/functions/v1/send-password-reset \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"gabu.sacro@gmail.com","redirectTo":"https://bbscbbq.vercel.app/account/reset-password"}'
   ```

---

**Once email is working, your BBQ business app will be 100% functional!** 🎉
