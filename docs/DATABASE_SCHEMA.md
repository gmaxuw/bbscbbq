# 🗄️ Database Schema Documentation

**Project:** Surigao City BBQ Stalls  
**Database:** Supabase PostgreSQL  
**Last Updated:** January 2025  
**Status:** Production Ready  

---

## 📊 **Schema Overview**

The database consists of **12 tables** designed for a complete BBQ restaurant management system with multi-branch support, order management, user roles, and business analytics.

### **Table Categories**
- **Core Business:** `branches`, `products`, `orders`, `order_items`
- **User Management:** `admin_users`, `users`, `user_carts`
- **Business Features:** `promo_codes`, `sales_reports`, `crew_attendance`
- **System:** `system_logs`, `product_images`, `hero_settings`

---

## 🏢 **Core Business Tables**

### **branches**
**Purpose:** Store branch locations and information  
**Rows:** 4 (Active branches in Surigao)

```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Sample Data:**
- Borromeo Surigao Main Branch
- Luna Branch
- Ipil Branch  
- Siargao Branch

**Relationships:**
- `orders.branch_id` → `branches.id`
- `admin_users.branch_id` → `branches.id`
- `crew_attendance.branch_id` → `branches.id`

---

### **products**
**Purpose:** Menu items with pricing and commission structure  
**Rows:** 10+ (BBQ items, drinks, sides)

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  commission DECIMAL(5,2) NOT NULL CHECK (commission >= 0),
  image_url VARCHAR(255),
  category VARCHAR(50) DEFAULT 'bbq',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  is_out_of_stock BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Commission Structure:**
- Chicken Parts: ₱2.00 - ₱3.00
- Sausages: ₱2.50
- Pork/Beef: ₱4.00 - ₱4.50

**Relationships:**
- `order_items.product_id` → `products.id`
- `user_carts.product_id` → `products.id`
- `product_images.product_id` → `products.id`

---

### **orders**
**Purpose:** Customer orders with payment and pickup details  
**Rows:** 2+ (Sample orders)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  branch_id UUID REFERENCES branches(id),
  pickup_time TIMESTAMPTZ NOT NULL,
  delivery_address TEXT,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  promo_code VARCHAR(50),
  promo_discount DECIMAL(10,2) DEFAULT 0 CHECK (promo_discount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  total_commission DECIMAL(10,2) NOT NULL CHECK (total_commission >= 0),
  
  -- Payment
  payment_method VARCHAR(20) DEFAULT 'gcash' CHECK (payment_method IN ('gcash', 'bank_transfer')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'refunded')),
  gcash_reference VARCHAR(100),
  payment_screenshot_url VARCHAR(255),
  
  -- Order Status
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  estimated_ready_time TIMESTAMPTZ,
  qr_code TEXT,
  
  -- Timing Tracking
  cooking_started_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Order Status Flow:**
`pending` → `confirmed` → `preparing` → `ready` → `completed`

**Payment Status Flow:**
`pending` → `paid` → `cancelled`/`refunded`

**Timing Tracking Fields:**
- `cooking_started_at`: When crew starts cooking (status → 'preparing')
- `ready_at`: When crew marks order ready (status → 'ready')  
- `actual_pickup_time`: When customer actually picks up (status → 'completed')
- `pickup_time`: Customer's scheduled pickup time
- `created_at`: When order was placed

**Performance Metrics:**
- **Cooking Time**: `ready_at` - `cooking_started_at`
- **Customer Wait Time**: `actual_pickup_time` - `ready_at`
- **Total Order Time**: `actual_pickup_time` - `created_at`

---

### **order_items**
**Purpose:** Individual items within each order  
**Rows:** 3+ (Sample order items)

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(100) NOT NULL, -- Store name for historical reference
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  unit_commission DECIMAL(5,2) NOT NULL CHECK (unit_commission >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Store individual order line items with commission tracking for business analytics.

---

## 👥 **User Management Tables**

### **admin_users**
**Purpose:** Admin and crew management  
**Rows:** 2 (Admin accounts)

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'crew')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  id_document_path TEXT, -- Path to uploaded ID document
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Roles:**
- `admin` - Full system access
- `crew` - Branch-specific access

---

### **users**
**Purpose:** Customer management  
**Rows:** 0 (Customer accounts)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'crew')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### **user_carts**
**Purpose:** Cart synchronization across devices  
**Rows:** 0 (Cart items)

```sql
CREATE TABLE user_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);
```

**Purpose:** Enable cart synchronization across devices for logged-in users.

---

## 🎯 **Business Features Tables**

### **promo_codes**
**Purpose:** Promotional codes and discount management  
**Rows:** 4 (Active promo codes)

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  minimum_order DECIMAL(10,2) DEFAULT 0 CHECK (minimum_order >= 0),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0 CHECK (current_uses >= 0),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Sample Promo Codes:**
- `WELCOME10` - 10% off, min ₱200
- `BBQ20` - ₱20 off, min ₱150
- `FIRSTORDER` - 15% off, min ₱100
- `LOYALTY25` - ₱25 off, min ₱300

---

### **sales_reports**
**Purpose:** Sales analytics and reporting data  
**Rows:** 0 (Generated reports)

```sql
CREATE TABLE sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_orders INTEGER NOT NULL CHECK (total_orders >= 0),
  total_revenue DECIMAL(12,2) NOT NULL CHECK (total_revenue >= 0),
  total_commission DECIMAL(12,2) NOT NULL CHECK (total_commission >= 0),
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### **crew_attendance**
**Purpose:** Crew member time tracking and attendance  
**Rows:** 0 (Attendance records)

```sql
CREATE TABLE crew_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔧 **System Tables**

### **system_logs**
**Purpose:** System audit trail and error logging  
**Rows:** 5+ (System events)

```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  error_details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Log Types:**
- `order_created` - New order placed
- `payment_verified` - Payment confirmed
- `order_status_changed` - Status update
- `error` - System errors
- `user_login` - Authentication events

---

### **product_images**
**Purpose:** Multiple images per product  
**Rows:** 0 (Product photos)

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### **hero_settings**
**Purpose:** Homepage content management  
**Rows:** 1 (Homepage settings)

```sql
CREATE TABLE hero_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  title VARCHAR(255) NOT NULL DEFAULT 'Surigao City',
  subtitle VARCHAR(255) NOT NULL DEFAULT 'BBQ Stalls',
  description TEXT NOT NULL DEFAULT 'Experience the authentic taste...',
  badge_text VARCHAR(255) NOT NULL DEFAULT '#1 BBQ Restaurant in Surigao',
  button_text VARCHAR(255) NOT NULL DEFAULT 'ORDER NOW',
  button_link VARCHAR(255) NOT NULL DEFAULT '/cart',
  show_badge BOOLEAN NOT NULL DEFAULT true,
  show_features BOOLEAN NOT NULL DEFAULT true,
  show_trust_indicators BOOLEAN NOT NULL DEFAULT true,
  image_1_url TEXT,
  image_2_url TEXT,
  image_3_url TEXT,
  feature_1_text VARCHAR(255) NOT NULL DEFAULT '2+ Hours Advance Order',
  feature_2_text VARCHAR(255) NOT NULL DEFAULT '4 Convenient Locations',
  feature_3_text VARCHAR(255) NOT NULL DEFAULT 'Premium Quality',
  trust_item_1_number VARCHAR(50) NOT NULL DEFAULT '15+',
  trust_item_1_label VARCHAR(255) NOT NULL DEFAULT 'Menu Items',
  trust_item_2_number VARCHAR(50) NOT NULL DEFAULT '4',
  trust_item_2_label VARCHAR(255) NOT NULL DEFAULT 'Branch Locations',
  trust_item_3_number VARCHAR(50) NOT NULL DEFAULT '100%',
  trust_item_3_label VARCHAR(255) NOT NULL DEFAULT 'Fresh & Local',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 **Security & Access Control**

### **Row Level Security (RLS)**
All tables have RLS enabled with appropriate policies:

**Public Access:**
- `products` - Active products only
- `branches` - Active branches only
- `hero_settings` - All settings
- `product_images` - All images
- `promo_codes` - Active codes only

**Authenticated Users:**
- `user_carts` - Own cart only
- `orders` - Order insertion allowed
- `order_items` - Order item insertion allowed

**Admin Only:**
- `admin_users` - Admin role required
- `sales_reports` - Admin role required
- `system_logs` - Admin role required

### **Storage Buckets**
- `payment-screenshots` - Payment proof images
- `product-images` - Product photos
- `user-uploads` - General user uploads

---

## 📊 **Indexes & Performance**

### **Primary Indexes**
```sql
-- Orders
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Users
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_user_carts_user_id ON user_carts(user_id);
```

---

## 🔄 **Functions & Triggers**

### **Order Number Generation**
```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
-- Generates YYYYMMDD-XXX format order numbers
```

### **Updated At Triggers**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
-- Updates updated_at timestamp on record changes
```

---

## 📈 **Data Relationships**

### **Entity Relationship Diagram**
```
branches (1) ←→ (many) orders
branches (1) ←→ (many) admin_users
branches (1) ←→ (many) crew_attendance

products (1) ←→ (many) order_items
products (1) ←→ (many) user_carts
products (1) ←→ (many) product_images

orders (1) ←→ (many) order_items
orders (1) ←→ (many) system_logs

auth.users (1) ←→ (1) admin_users
auth.users (1) ←→ (1) users
auth.users (1) ←→ (many) user_carts
auth.users (1) ←→ (many) crew_attendance
```

---

## 🚀 **Migration History**

### **Initial Setup**
- `complete-database-setup.sql` - Complete schema creation
- `setup-database-schema.sql` - Additional admin tables

### **Fixes & Updates**
- `fix-admin-login-issue.sql` - Admin authentication fixes
- `fix-auth-metadata-mismatch.sql` - Auth metadata alignment
- `fix-missing-tables.sql` - Missing table creation
- `fix-storage-rls-policies.sql` - Storage security fixes
- `permanent-fix-auth-metadata.sql` - Permanent auth fixes

---

## 📋 **Maintenance Guidelines**

### **Regular Tasks**
1. **Backup Database** - Daily automated backups
2. **Monitor Performance** - Check slow queries
3. **Update Indexes** - Add indexes for new query patterns
4. **Clean Logs** - Archive old system_logs entries
5. **Review RLS** - Ensure security policies are current

### **Data Integrity**
- All foreign keys have proper constraints
- Check constraints ensure data validity
- Unique constraints prevent duplicates
- RLS policies enforce access control

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Database Status:** Production Ready  
**Next Review:** Quarterly
