# 🔧 Troubleshooting Guide

**Project:** Surigao City BBQ Stalls  
**Last Updated:** January 2025  
**Status:** Production Ready  

---

## 📋 **Quick Reference**

### **Common Issues & Solutions**
- [Authentication Problems](#authentication-problems)
- [Database Connection Issues](#database-connection-issues)
- [Order Processing Errors](#order-processing-errors)
- [Payment Verification Issues](#payment-verification-issues)
- [File Upload Problems](#file-upload-problems)
- [Real-time Updates Not Working](#real-time-updates-not-working)
- [Performance Issues](#performance-issues)
- [Mobile App Problems](#mobile-app-problems)

---

## 🔐 **Authentication Problems**

### **Issue: Admin Login Fails**
**Symptoms:**
- "Invalid admin credentials" error
- Redirected to login page after successful auth
- Session not persisting

**Solutions:**
1. **Check Admin User Exists:**
   ```sql
   SELECT * FROM admin_users WHERE email = 'your-email@example.com';
   ```

2. **Verify User Role:**
   ```sql
   SELECT role, is_active FROM admin_users WHERE email = 'your-email@example.com';
   ```

3. **Check Supabase Auth:**
   - Go to Supabase Dashboard → Authentication → Users
   - Verify user exists and is confirmed

4. **Clear Browser Data:**
   ```javascript
   // Clear localStorage and sessionStorage
   localStorage.clear();
   sessionStorage.clear();
   // Reload page
   window.location.reload();
   ```

5. **Check Environment Variables:**
   ```bash
   # Verify in browser console
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   ```

### **Issue: Customer Login Fails**
**Symptoms:**
- "Invalid email or password" error
- Email confirmation required
- Account not found

**Solutions:**
1. **Check Email Confirmation:**
   - Look for confirmation email
   - Check spam folder
   - Resend confirmation if needed

2. **Verify User in Database:**
   ```sql
   SELECT * FROM users WHERE email = 'customer@example.com';
   ```

3. **Reset Password:**
   - Use "Forgot Password" link
   - Check email for reset link
   - Create new password

### **Issue: Session Expires Quickly**
**Symptoms:**
- User logged out unexpectedly
- Need to login frequently
- Session not persisting

**Solutions:**
1. **Check Supabase Auth Settings:**
   - Go to Authentication → Settings
   - Verify JWT expiry settings
   - Check refresh token settings

2. **Update Session Configuration:**
   ```typescript
   const supabase = createClient(url, key, {
     auth: {
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: true
     }
   })
   ```

---

## 🗄️ **Database Connection Issues**

### **Issue: Database Connection Failed**
**Symptoms:**
- "Failed to fetch" errors
- Network errors in console
- Data not loading

**Solutions:**
1. **Check Environment Variables:**
   ```bash
   # Verify in .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Test Database Connection:**
   ```typescript
   const { data, error } = await supabase
     .from('products')
     .select('count')
     .limit(1)
   
   if (error) {
     console.error('Database error:', error);
   }
   ```

3. **Check Supabase Status:**
   - Visit [status.supabase.com](https://status.supabase.com)
   - Check for service outages

4. **Verify RLS Policies:**
   ```sql
   -- Check if RLS is blocking access
   SELECT * FROM pg_policies WHERE tablename = 'products';
   ```

### **Issue: RLS Policy Errors**
**Symptoms:**
- "Row Level Security" errors
- Data not accessible
- Permission denied errors

**Solutions:**
1. **Check RLS Policies:**
   ```sql
   -- List all policies
   SELECT schemaname, tablename, policyname, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

2. **Verify User Context:**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Current user:', user);
   ```

3. **Test Policy Access:**
   ```sql
   -- Test as authenticated user
   SET LOCAL "request.jwt.claims" TO '{"sub": "user-id"}';
   SELECT * FROM products;
   ```

---

## 🛒 **Order Processing Errors**

### **Issue: Order Not Created**
**Symptoms:**
- Order form submission fails
- "Order failed" error message
- No order in database

**Solutions:**
1. **Check Required Fields:**
   ```typescript
   // Verify all required fields are filled
   if (!customerData.name || !customerData.phone || !pickupDateTime.date) {
     setErrors(['Please fill all required fields']);
     return;
   }
   ```

2. **Check Database Constraints:**
   ```sql
   -- Verify order can be inserted
   INSERT INTO orders (customer_name, customer_phone, pickup_time, subtotal, total_amount, total_commission)
   VALUES ('Test', '123456789', NOW(), 100.00, 100.00, 3.00);
   ```

3. **Check Cart Items:**
   ```typescript
   // Verify cart has items
   if (items.length === 0) {
     setErrors(['Cart is empty']);
     return;
   }
   ```

4. **Check Branch Selection:**
   ```typescript
   // Verify branch is selected
   if (!customerData.branch_id) {
     setErrors(['Please select pickup location']);
     return;
   }
   ```

### **Issue: Order Items Not Created**
**Symptoms:**
- Order created but no items
- Order total shows 0
- Missing order details

**Solutions:**
1. **Check Order Items Insert:**
   ```typescript
   const { data: orderItems, error } = await supabase
     .from('order_items')
     .insert(items.map(item => ({
       order_id: order.id,
       product_id: item.id,
       product_name: item.name,
       quantity: item.quantity,
       unit_price: item.price,
       unit_commission: item.commission || 0,
       subtotal: item.price * item.quantity
     })));
   ```

2. **Verify Product IDs:**
   ```typescript
   // Check if product IDs are valid
   const productIds = items.map(item => item.id);
   const { data: products } = await supabase
     .from('products')
     .select('id')
     .in('id', productIds);
   ```

---

## 💳 **Payment Verification Issues**

### **Issue: Payment Screenshot Upload Fails**
**Symptoms:**
- File upload error
- "Upload failed" message
- Screenshot not saved

**Solutions:**
1. **Check File Size:**
   ```typescript
   // Verify file size (max 5MB)
   if (file.size > 5 * 1024 * 1024) {
     setError('File too large. Maximum size is 5MB.');
     return;
   }
   ```

2. **Check File Type:**
   ```typescript
   // Verify file type
   const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
   if (!allowedTypes.includes(file.type)) {
     setError('Invalid file type. Please upload an image.');
     return;
   }
   ```

3. **Check Storage Bucket:**
   ```typescript
   // Verify bucket exists and is accessible
   const { data, error } = await supabase.storage
     .from('payment-screenshots')
     .upload(`${orderId}/screenshot.jpg`, file);
   ```

4. **Check RLS Policies:**
   ```sql
   -- Verify storage policies
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

### **Issue: Payment Status Not Updating**
**Symptoms:**
- Payment remains "pending"
- Admin can't verify payment
- Order status not changing

**Solutions:**
1. **Check Admin Permissions:**
   ```typescript
   // Verify admin user
   const { data: adminUser } = await supabase
     .from('admin_users')
     .select('role')
     .eq('user_id', user.id)
     .single();
   ```

2. **Check Update Query:**
   ```typescript
   const { error } = await supabase
     .from('orders')
     .update({
       payment_status: 'paid',
       order_status: 'confirmed'
     })
     .eq('id', orderId);
   ```

3. **Check Order Exists:**
   ```typescript
   const { data: order } = await supabase
     .from('orders')
     .select('*')
     .eq('id', orderId)
     .single();
   ```

---

## 📁 **File Upload Problems**

### **Issue: Product Images Not Uploading**
**Symptoms:**
- Image upload fails
- "Upload error" message
- Images not displaying

**Solutions:**
1. **Check Storage Bucket:**
   ```typescript
   // Verify bucket exists
   const { data: buckets } = await supabase.storage.listBuckets();
   console.log('Available buckets:', buckets);
   ```

2. **Check File Path:**
   ```typescript
   // Use correct file path
   const filePath = `${productId}/${Date.now()}-${file.name}`;
   const { data, error } = await supabase.storage
     .from('product-images')
     .upload(filePath, file);
   ```

3. **Check Public URL:**
   ```typescript
   // Get public URL
   const { data } = supabase.storage
     .from('product-images')
     .getPublicUrl(filePath);
   ```

### **Issue: Files Not Accessible**
**Symptoms:**
- Images not loading
- 403 Forbidden errors
- Broken image links

**Solutions:**
1. **Check Bucket Public Access:**
   - Go to Supabase Dashboard → Storage
   - Verify bucket is public
   - Check RLS policies

2. **Check File Permissions:**
   ```sql
   -- Verify storage policies
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage' 
   AND tablename = 'objects' 
   AND policyname LIKE '%product%';
   ```

3. **Test File Access:**
   ```typescript
   // Test file access
   const { data, error } = await supabase.storage
     .from('product-images')
     .download('file-path');
   ```

---

## 🔄 **Real-time Updates Not Working**

### **Issue: Orders Not Updating in Real-time**
**Symptoms:**
- Admin dashboard not refreshing
- New orders not appearing
- Status changes not reflected

**Solutions:**
1. **Check Subscription Setup:**
   ```typescript
   const subscription = supabase
     .channel('order-updates')
     .on('postgres_changes', {
       event: 'UPDATE',
       schema: 'public',
       table: 'orders'
     }, (payload) => {
       console.log('Order updated:', payload.new);
       // Update UI
     })
     .subscribe();
   ```

2. **Check Real-time Settings:**
   ```typescript
   // Verify real-time is enabled
   const supabase = createClient(url, key, {
     realtime: {
       params: {
         eventsPerSecond: 10
       }
     }
   });
   ```

3. **Check Database Triggers:**
   ```sql
   -- Verify triggers exist
   SELECT * FROM pg_trigger WHERE tgname LIKE '%orders%';
   ```

4. **Test Connection:**
   ```typescript
   // Test real-time connection
   const channel = supabase.channel('test');
   channel.subscribe((status) => {
     console.log('Subscription status:', status);
   });
   ```

---

## ⚡ **Performance Issues**

### **Issue: Slow Page Loading**
**Symptoms:**
- Pages take long to load
- Slow database queries
- High memory usage

**Solutions:**
1. **Check Database Indexes:**
   ```sql
   -- Verify indexes exist
   SELECT * FROM pg_indexes WHERE tablename = 'orders';
   ```

2. **Optimize Queries:**
   ```typescript
   // Use specific selects
   const { data } = await supabase
     .from('orders')
     .select('id, customer_name, total_amount, created_at')
     .limit(10);
   ```

3. **Implement Pagination:**
   ```typescript
   // Use pagination for large datasets
   const { data } = await supabase
     .from('orders')
     .select('*')
     .range(0, 9)
     .order('created_at', { ascending: false });
   ```

4. **Check Network Requests:**
   - Open browser DevTools → Network
   - Check for slow requests
   - Optimize API calls

### **Issue: High Memory Usage**
**Symptoms:**
- App becomes slow
- Browser crashes
- High CPU usage

**Solutions:**
1. **Check for Memory Leaks:**
   ```typescript
   // Clean up subscriptions
   useEffect(() => {
     const subscription = supabase
       .channel('orders')
       .on('postgres_changes', handler)
       .subscribe();
   
     return () => {
       subscription.unsubscribe();
     };
   }, []);
   ```

2. **Optimize Images:**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   <Image
     src={product.image_url}
     alt={product.name}
     width={300}
     height={200}
     priority={false}
   />
   ```

3. **Implement Code Splitting:**
   ```typescript
   // Lazy load components
   const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
     loading: () => <p>Loading...</p>
   });
   ```

---

## 📱 **Mobile App Problems**

### **Issue: Mobile Layout Issues**
**Symptoms:**
- Layout broken on mobile
- Touch interactions not working
- Text too small

**Solutions:**
1. **Check Responsive Design:**
   ```css
   /* Use responsive classes */
   .container {
     @apply px-4 sm:px-6 lg:px-8;
   }
   ```

2. **Test Touch Interactions:**
   ```typescript
   // Ensure touch events work
   <button
     className="touch-manipulation"
     onTouchStart={handleTouch}
   >
     Click me
   </button>
   ```

3. **Check Viewport Meta:**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   ```

### **Issue: Mobile Performance Issues**
**Symptoms:**
- Slow on mobile devices
- High battery usage
- App crashes

**Solutions:**
1. **Optimize Images:**
   ```typescript
   // Use responsive images
   <Image
     src={image}
     alt="Product"
     sizes="(max-width: 768px) 100vw, 50vw"
     width={400}
     height={300}
   />
   ```

2. **Reduce Bundle Size:**
   ```bash
   # Analyze bundle size
   npm run build
   npm run analyze
   ```

3. **Implement Service Worker:**
   ```typescript
   // Add PWA capabilities
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```

---

## 🔍 **Debugging Tools**

### **Browser DevTools**
1. **Console:** Check for JavaScript errors
2. **Network:** Monitor API requests
3. **Application:** Check localStorage/sessionStorage
4. **Performance:** Profile app performance

### **Supabase Dashboard**
1. **Logs:** Check database and auth logs
2. **API:** Monitor API usage
3. **Storage:** Check file uploads
4. **Real-time:** Monitor subscriptions

### **Vercel Dashboard**
1. **Functions:** Check serverless function logs
2. **Analytics:** Monitor performance metrics
3. **Deployments:** Check deployment status

---

## 📞 **Getting Help**

### **Documentation**
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)

### **Community Support**
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Vercel Discord](https://vercel.com/discord)

### **Professional Support**
- Supabase Pro support
- Vercel Pro support
- Custom development services

---

## 📋 **Prevention Checklist**

### **Before Deployment**
- [ ] Test all functionality locally
- [ ] Verify environment variables
- [ ] Check database migrations
- [ ] Test file uploads
- [ ] Verify authentication

### **After Deployment**
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Test on multiple devices
- [ ] Verify real-time updates
- [ ] Check payment processing

### **Regular Maintenance**
- [ ] Update dependencies
- [ ] Monitor database performance
- [ ] Check storage usage
- [ ] Review error logs
- [ ] Test backup/restore

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production Ready  
**Next Review:** Monthly
