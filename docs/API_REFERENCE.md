# 🔌 API Reference Documentation

**Project:** Surigao City BBQ Stalls  
**Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)  
**Frontend:** Next.js 14 with TypeScript  
**Last Updated:** January 2025  

---

## 📋 **API Overview**

The application uses **Supabase** as the backend, providing:
- **Database API** - PostgreSQL with real-time subscriptions
- **Authentication API** - User management and sessions
- **Storage API** - File uploads and management
- **Edge Functions** - Serverless functions for email notifications

---

## 🔐 **Authentication APIs**

### **Supabase Auth Integration**

#### **Admin Authentication**
```typescript
// Admin login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password'
})

// Verify admin role
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_active', true)
  .single()
```

#### **Customer Authentication**
```typescript
// Customer signup
const { data, error } = await supabase.auth.signUp({
  email: 'customer@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'customer'
    }
  }
})

// Customer login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'customer@example.com',
  password: 'password'
})
```

#### **Session Management**
```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Sign out
await supabase.auth.signOut()

// Password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
})
```

---

## 🗄️ **Database APIs**

### **Products Management**

#### **Get All Products**
```typescript
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

#### **Get Featured Products**
```typescript
const { data: featuredProducts, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_featured', true)
  .eq('is_active', true)
```

#### **Get Product by ID**
```typescript
const { data: product, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .single()
```

#### **Create Product (Admin)**
```typescript
const { data, error } = await supabase
  .from('products')
  .insert([{
    name: 'New BBQ Item',
    description: 'Delicious BBQ',
    price: 150.00,
    commission: 3.50,
    category: 'bbq',
    is_featured: false,
    is_active: true
  }])
```

#### **Update Product (Admin)**
```typescript
const { data, error } = await supabase
  .from('products')
  .update({
    name: 'Updated Name',
    price: 160.00
  })
  .eq('id', productId)
```

#### **Delete Product (Admin)**
```typescript
const { data, error } = await supabase
  .from('products')
  .update({ is_active: false })
  .eq('id', productId)
```

---

### **Orders Management**

#### **Create Order**
```typescript
const { data: order, error } = await supabase
  .from('orders')
  .insert([{
    customer_name: 'John Doe',
    customer_phone: '+639123456789',
    customer_email: 'john@example.com',
    branch_id: branchId,
    pickup_time: pickupDateTime,
    subtotal: 500.00,
    total_amount: 560.00,
    total_commission: 15.00,
    payment_method: 'gcash',
    payment_status: 'pending',
    gcash_reference: 'GCASH123456',
    payment_screenshot_url: screenshotUrl,
    order_status: 'pending'
  }])
  .select()
  .single()
```

#### **Create Order Items**
```typescript
const { data: orderItems, error } = await supabase
  .from('order_items')
  .insert([
    {
      order_id: order.id,
      product_id: productId,
      product_name: 'BBQ Item',
      quantity: 2,
      unit_price: 100.00,
      unit_commission: 3.00,
      subtotal: 200.00
    }
  ])
```

#### **Get Orders (Admin)**
```typescript
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (*),
    branches (name, address)
  `)
  .order('created_at', { ascending: false })
```

#### **Get Orders by Status**
```typescript
const { data: pendingOrders, error } = await supabase
  .from('orders')
  .select('*')
  .eq('payment_status', 'pending')
  .order('created_at', { ascending: true })
```

#### **Update Order Status**
```typescript
const { data, error } = await supabase
  .from('orders')
  .update({
    order_status: 'preparing',
    payment_status: 'paid'
  })
  .eq('id', orderId)
```

#### **Get Order by Number**
```typescript
const { data: order, error } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (*),
    branches (name, address, phone)
  `)
  .eq('order_number', orderNumber)
  .single()
```

---

### **Cart Management**

#### **Get User Cart**
```typescript
const { data: cart, error } = await supabase
  .from('user_carts')
  .select(`
    *,
    products (
      id,
      name,
      price,
      image_url,
      category,
      commission
    )
  `)
  .eq('user_id', userId)
```

#### **Add to Cart**
```typescript
const { data, error } = await supabase
  .from('user_carts')
  .upsert({
    user_id: userId,
    product_id: productId,
    quantity: quantity
  })
```

#### **Update Cart Item**
```typescript
const { data, error } = await supabase
  .from('user_carts')
  .update({ quantity: newQuantity })
  .eq('user_id', userId)
  .eq('product_id', productId)
```

#### **Remove from Cart**
```typescript
const { data, error } = await supabase
  .from('user_carts')
  .delete()
  .eq('user_id', userId)
  .eq('product_id', productId)
```

#### **Clear Cart**
```typescript
const { data, error } = await supabase
  .from('user_carts')
  .delete()
  .eq('user_id', userId)
```

---

### **Branches Management**

#### **Get All Branches**
```typescript
const { data: branches, error } = await supabase
  .from('branches')
  .select('*')
  .eq('is_active', true)
  .order('created_at')
```

#### **Get Branch by ID**
```typescript
const { data: branch, error } = await supabase
  .from('branches')
  .select('*')
  .eq('id', branchId)
  .single()
```

---

### **Promo Codes Management**

#### **Get Active Promo Codes**
```typescript
const { data: promos, error } = await supabase
  .from('promo_codes')
  .select('*')
  .eq('is_active', true)
  .gt('expires_at', new Date().toISOString())
```

#### **Validate Promo Code**
```typescript
const { data: promo, error } = await supabase
  .from('promo_codes')
  .select('*')
  .eq('code', promoCode)
  .eq('is_active', true)
  .gt('expires_at', new Date().toISOString())
  .single()
```

#### **Apply Promo Code**
```typescript
const { data, error } = await supabase
  .from('promo_codes')
  .update({
    current_uses: promo.current_uses + 1
  })
  .eq('id', promo.id)
```

---

## 📁 **Storage APIs**

### **File Upload**

#### **Upload Payment Screenshot**
```typescript
const { data, error } = await supabase.storage
  .from('payment-screenshots')
  .upload(`${orderId}/${Date.now()}-screenshot.jpg`, file)
```

#### **Upload Product Image**
```typescript
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(`${productId}/${Date.now()}-image.jpg`, file)
```

#### **Get File URL**
```typescript
const { data } = supabase.storage
  .from('payment-screenshots')
  .getPublicUrl(filePath)
```

#### **Delete File**
```typescript
const { data, error } = await supabase.storage
  .from('payment-screenshots')
  .remove([filePath])
```

---

## 🔄 **Real-time APIs**

### **Order Updates Subscription**
```typescript
const subscription = supabase
  .channel('order-updates')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    console.log('Order updated:', payload.new)
    // Update UI with new order status
  })
  .subscribe()
```

### **New Orders Subscription (Admin)**
```typescript
const subscription = supabase
  .channel('new-orders')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    console.log('New order:', payload.new)
    // Show notification for new order
  })
  .subscribe()
```

### **Cart Updates Subscription**
```typescript
const subscription = supabase
  .channel('cart-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_carts',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Cart updated:', payload)
    // Update cart UI
  })
  .subscribe()
```

---

## 📊 **Analytics APIs**

### **Sales Reports**

#### **Get Daily Sales**
```typescript
const { data: sales, error } = await supabase
  .from('orders')
  .select('total_amount, total_commission, created_at')
  .gte('created_at', startDate)
  .lt('created_at', endDate)
  .eq('payment_status', 'paid')
```

#### **Get Branch Performance**
```typescript
const { data: branchSales, error } = await supabase
  .from('orders')
  .select(`
    total_amount,
    total_commission,
    branches (name)
  `)
  .eq('branch_id', branchId)
  .eq('payment_status', 'paid')
  .gte('created_at', startDate)
```

#### **Get Product Performance**
```typescript
const { data: productSales, error } = await supabase
  .from('order_items')
  .select(`
    quantity,
    subtotal,
    unit_commission,
    products (name, category)
  `)
  .gte('created_at', startDate)
```

---

## 🔧 **System APIs**

### **System Logs**

#### **Create System Log**
```typescript
const { data, error } = await supabase
  .from('system_logs')
  .insert([{
    log_type: 'order_created',
    user_id: userId,
    order_id: orderId,
    message: 'New order created',
    ip_address: clientIP,
    user_agent: userAgent
  }])
```

#### **Get System Logs (Admin)**
```typescript
const { data: logs, error } = await supabase
  .from('system_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100)
```

---

## 🚀 **Edge Functions**

### **Email Notifications**

#### **Send Order Confirmation**
```typescript
// Edge Function: send-order-confirmation
const { data, error } = await supabase.functions.invoke('send-order-confirmation', {
  body: {
    orderId: order.id,
    customerEmail: order.customer_email,
    orderNumber: order.order_number,
    totalAmount: order.total_amount
  }
})
```

---

## 🔐 **Security & Permissions**

### **Row Level Security (RLS)**
All database operations are protected by RLS policies:

- **Public Access:** Products, branches, promo codes
- **Authenticated Users:** Own cart, order creation
- **Admin Only:** User management, analytics, system logs

### **Storage Security**
- **Payment Screenshots:** Authenticated users can upload
- **Product Images:** Admin only
- **File Size Limits:** 5MB per file
- **Allowed Types:** Images only (JPEG, PNG, WebP, GIF)

---

## 📱 **Client-Side Integration**

### **Supabase Client Setup**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### **Error Handling**
```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*')

if (error) {
  console.error('Database error:', error.message)
  // Handle error appropriately
  return
}

// Use data
console.log('Orders:', data)
```

---

## 📋 **API Rate Limits**

### **Supabase Limits (Free Tier)**
- **Database:** 500MB storage
- **Auth:** 50,000 monthly active users
- **Storage:** 1GB storage
- **Edge Functions:** 500,000 invocations/month
- **Real-time:** 200 concurrent connections

### **Best Practices**
- Use pagination for large datasets
- Implement client-side caching
- Batch operations when possible
- Monitor usage in Supabase dashboard

---

## 🧪 **Testing APIs**

### **Test Database Connection**
```typescript
const { data, error } = await supabase
  .from('products')
  .select('count')
  .limit(1)

if (error) {
  console.error('Database connection failed:', error)
} else {
  console.log('Database connection successful')
}
```

### **Test Authentication**
```typescript
const { data: { session }, error } = await supabase.auth.getSession()
if (error) {
  console.error('Auth error:', error)
} else {
  console.log('Session:', session ? 'Active' : 'None')
}
```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**API Status:** Production Ready  
**Next Review:** Monthly
