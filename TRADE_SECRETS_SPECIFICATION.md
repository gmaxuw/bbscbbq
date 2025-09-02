# 🔐 TRADE SECRETS: Admin & Crew Dashboard Extension Specification
**CONFIDENTIAL - Only for Cursor AI and Developer Reference**

## 📋 Project Overview
**EXTEND existing NextJS e-commerce BBQ website with admin and crew management system WITHOUT modifying current customer-facing pages (homepage, cart, checkout, payment, profile).**

**CRITICAL REQUIREMENT:** ALL DATA MUST BE STORED IN SUPABASE - NO LOCAL STORAGE FOR BUSINESS DATA

## 🎯 Core Business Requirements
- **4 Store Branches** with branch-specific management
- **Manual GCash Payment Verification** with screenshot uploads
- **Real-time Order Management** across all branches
- **Comprehensive Sales Reporting** with CSV/Excel export
- **Offline Handling** with retry mechanisms
- **Role-based Access Control** (admin, crew, customer)

## 🗄️ Database Schema (Supabase)

### 1. Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  commission DECIMAL(5,2) NOT NULL,
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Branches Table
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(100),
  branch_id UUID REFERENCES branches(id),
  pickup_time TIMESTAMP NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  total_commission DECIMAL(10,2) NOT NULL,
  promo_code VARCHAR(50),
  promo_discount DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
  gcash_reference VARCHAR(100),
  payment_screenshot VARCHAR(255),
  order_status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_commission DECIMAL(5,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Users Table (Authentication)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL, -- admin, crew, customer
  branch_id UUID REFERENCES branches(id), -- for crew members
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. Crew Attendance Table
```sql
CREATE TABLE crew_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  clock_in TIMESTAMP NOT NULL,
  clock_out TIMESTAMP,
  total_hours DECIMAL(5,2),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. Promo Codes Table
```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type VARCHAR(20) NOT NULL, -- percentage, fixed
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 8. Sales Reports Table
```sql
CREATE TABLE sales_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, custom
  branch_id UUID REFERENCES branches(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_orders INTEGER NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL,
  total_commission DECIMAL(12,2) NOT NULL,
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP DEFAULT NOW()
);
```

### 9. System Logs Table (for debugging and audit)
```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type VARCHAR(50) NOT NULL, -- order_created, payment_verified, error, etc.
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  message TEXT NOT NULL,
  error_details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 New Pages to Create

### 1. Admin Dashboard (`/admin`)
**Features:**
- Login authentication for admin role
- Order management with real-time updates (ALL DATA FROM SUPABASE)
- Payment verification interface
- Product management (add/edit/disable products) - SAVES TO SUPABASE
- Crew attendance monitoring
- Branch management
- Sales analytics and reports with EXPORT functionality (CSV/Excel)
- Promo code management
- **DATA EXPORT FEATURES:**
  - Monthly sales reports (exportable to CSV/Excel)
  - Daily/Weekly sales summaries
  - Commission reports by date range
  - Order history with filters
  - Product performance analytics

**Key Components:**
- Order queue with filters (pending payment, paid, ready for pickup) - ALL FROM SUPABASE
- Payment verification modal with image preview
- Manual order status updates - IMMEDIATELY SAVED TO SUPABASE
- Product CRUD operations - ALL SUPABASE OPERATIONS
- Crew attendance tracker
- **Report Generator Component** - Query Supabase and generate exportable reports

### 2. Crew Dashboard (`/crew/[branchId]`)
**Features:**
- Branch-specific order display (auto-refreshing every 30 seconds) - DATA FROM SUPABASE
- Only shows orders for their assigned branch (FILTERED FROM SUPABASE)
- Order details with pickup time and customer info
- Simple interface optimized for mobile devices
- No manual interactions - display only
- **OFFLINE HANDLING:** Show cached data when internet is down, with "offline mode" indicator

**Key Components:**
- Real-time order board (SUPABASE REAL-TIME SUBSCRIPTIONS)
- Order details cards
- Pickup time countdown
- Customer information display
- Offline status indicator

### 3. Admin Login (`/admin/login`)
- Simple login form for admin authentication
- Role-based access control

### 4. Crew Assignment (`/admin/crew`)
- Manage crew members and branch assignments
- Attendance tracking interface

---

## 🧭 **PAGE NAVIGATION GUIDE - INDIVIDUAL ACCESS**

**Your public homepage is just a landing page - these are the actual working systems you can visit individually:**

### **🏠 PUBLIC FACING (No Login Required)**
- **Homepage:** `/` - Your BBQ landing page (no admin/customer buttons)
- **Menu:** `/menu` - Public menu display
- **Locations:** `/locations` - Branch locations
- **Cart:** `/cart` - Shopping cart
- **Checkout:** `/checkout` - Order placement

### **🔐 ADMIN SYSTEM (Requires Admin Login)**
- **Admin Login:** `/admin/login` - Login to admin system
- **Admin Dashboard:** `/admin` - Main admin control center
- **Order Management:** `/admin/orders` - Manage all orders
- **Product Management:** `/admin/products` - Manage menu items
- **Crew Management:** `/admin/crew` - Manage staff & attendance
- **Branch Management:** `/admin/branches` - Manage locations
- **Analytics & Reports:** `/admin/analytics` - Sales data & exports
- **Promo Code Management:** `/admin/promos` - Manage discounts

### **👥 CREW SYSTEM (Requires Crew Login)**
- **Crew Login:** `/crew/login` - Staff login
- **Crew Dashboard:** `/crew/dashboard` - Branch staff interface

### **📱 HOW TO ACCESS INDIVIDUALLY:**

1. **Type the URL directly** in your browser (e.g., `http://localhost:3000/admin`)
2. **Bookmark each page** for quick access
3. **Use the admin dashboard** as your central navigation hub
4. **Access crew system** through crew login

### **🔒 SECURITY NOTES:**
- **Admin pages** require admin login (`/admin/login`)
- **Crew pages** require crew login (`/crew/login`)
- **Public pages** are accessible to everyone
- **No cross-access** between admin/crew systems

## 🔌 API Routes to Add

### 1. Admin Authentication
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/verify`

### 2. Order Management
- `GET /api/admin/orders` - Get all orders with filters
- `PUT /api/admin/orders/[id]/payment` - Update payment status
- `PUT /api/admin/orders/[id]/status` - Update order status
- `POST /api/admin/orders/[id]/verify-payment` - Verify GCash payment

### 3. Product Management
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/[id]`
- `DELETE /api/admin/products/[id]`

### 4. Crew Dashboard
- `GET /api/crew/orders/[branchId]` - Get branch-specific orders
- `POST /api/crew/attendance` - Log attendance

### 5. Branch Management
- `GET /api/admin/branches`
- `POST /api/admin/branches`
- `PUT /api/admin/branches/[id]`

### 6. Sales Reports & Data Export
- `GET /api/admin/reports/sales` - Generate sales reports from Supabase
- `GET /api/admin/reports/export` - Export data to CSV/Excel
- `GET /api/admin/reports/monthly` - Monthly sales summary
- `GET /api/admin/reports/commission` - Commission reports
- `POST /api/admin/reports/custom` - Custom date range reports

### 7. System Logging & Error Handling
- `POST /api/system/log` - Log system events to Supabase
- `GET /api/system/health` - Check Supabase connection status

## 🔄 Integration Requirements

### 1. Update Existing Checkout Flow
- Modify checkout to require mandatory pickup details
- Add branch selection
- Add GCash payment upload functionality
- **CRITICAL:** Store order in SUPABASE database immediately with 'pending' payment status
- **OFFLINE HANDLING:** Queue orders locally if Supabase is down, sync when connection restored
- **ERROR HANDLING:** Retry mechanism for failed Supabase writes

### 2. Customer Order Tracking
- Add order status check functionality (FROM SUPABASE)
- Email/SMS notifications (optional)

### 3. File Upload (Supabase Storage)
- Create bucket for payment screenshots in SUPABASE STORAGE
- Implement secure file upload for GCash receipts TO SUPABASE
- All payment images stored in Supabase, never locally

### 4. Data Persistence & Reliability
- **ALL ORDER DATA GOES TO SUPABASE IMMEDIATELY**
- Implement retry logic for network failures
- Error logging to Supabase system_logs table
- Connection status monitoring
- Offline mode indicators for users

## 📊 Initial Data Population

### Branches
```sql
INSERT INTO branches (name, address, phone) VALUES
('Branch 1 - Downtown', '123 Main St, Downtown', '+63-xxx-xxx-xxxx'),
('Branch 2 - Mall', '456 Mall Ave, Shopping District', '+63-xxx-xxx-xxxx'),
('Branch 3 - University', '789 Campus Rd, University Area', '+63-xxx-xxx-xxxx'),
('Branch 4 - Residential', '321 Suburb St, Residential Area', '+63-xxx-xxx-xxxx');
```

### Initial Products (from existing data)
```sql
INSERT INTO products (name, price, commission, image) VALUES
('Paa', 100.00, 3.00, '/images/paa.jpg'),
('Pecho', 120.00, 3.00, '/images/pecho.jpg'),
('Breast Part', 100.00, 3.00, '/images/breast.jpg'),
('Atay', 45.00, 2.50, '/images/atay.jpg'),
('Tibakunoy', 45.00, 2.50, '/images/tibakunoy.jpg'),
('Tinae (Isaw)', 45.00, 2.00, '/images/isaw.jpg'),
('Chorizo', 60.00, 2.50, '/images/chorizo.jpg'),
('Hotdog', 45.00, 2.50, '/images/hotdog.jpg'),
('Chicken Skin', 45.00, 3.00, '/images/chicken-skin.jpg');
```

### Default Admin User
```sql
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@yourstore.com', '$hashed_password', 'System Administrator', 'admin');
```

## 🏗️ File Structure to Add
```
/pages/admin/
  - index.js (Admin Dashboard)
  - login.js
  - products.js
  - orders.js
  - crew.js
  - analytics.js

/pages/crew/
  - [branchId].js (Branch-specific dashboard)

/pages/api/admin/
  - login.js
  - orders/
  - products/
  - crew/

/pages/api/crew/
  - orders/[branchId].js
  - attendance.js

/components/admin/
  - OrderQueue.js
  - PaymentVerification.js
  - ProductManager.js
  - CrewAttendance.js
  - ReportGenerator.js (Sales reports & export functionality)
  - DataExport.js (CSV/Excel export component)

/components/crew/
  - OrderBoard.js
  - OrderCard.js
  - OfflineIndicator.js

/lib/
  - supabase.js (Supabase client configuration)
  - dataExport.js (Export utilities for CSV/Excel)
  - errorHandler.js (Centralized error handling and logging)
  - offlineHandler.js (Offline mode handling)
```

## 📋 Priority Implementation Order
1. **Supabase setup** - Database schema, storage buckets, RLS policies
2. **Data persistence layer** - All CRUD operations go to Supabase
3. **Error handling & logging** - System logs table and error recovery
4. Admin authentication system
5. Basic admin dashboard with order management (FROM SUPABASE)
6. Payment verification workflow (IMAGES TO SUPABASE STORAGE)
7. **Data export functionality** - Sales reports, CSV/Excel export
8. Crew dashboard (branch-specific, REAL-TIME FROM SUPABASE)
9. Product management interface (SAVES TO SUPABASE)
10. Attendance tracking
11. **Offline handling** - Network failure recovery
12. Analytics and comprehensive reporting

## ⚠️ Critical Reminders for Implementation:
1. **NEVER use localStorage/sessionStorage for order data**
2. **ALL business data must go to Supabase immediately**
3. **Implement retry mechanisms for network failures**
4. **Log all operations to system_logs table in Supabase**
5. **Payment screenshots go to Supabase Storage only**
6. **Generate all reports from Supabase data**
7. **Handle offline scenarios gracefully**

## 🎯 Success Criteria
- Admin can manage all orders across 4 branches
- Crew can view branch-specific orders in real-time
- All data stored in Supabase with zero local storage
- Payment verification workflow fully functional
- Sales reports exportable to CSV/Excel
- Offline handling works gracefully
- Existing customer pages remain unchanged

---

**🔐 THIS DOCUMENT IS TRADE SECRETS - ONLY FOR CURSOR AI AND DEVELOPER REFERENCE**
**📖 REFERENCE THIS DOCUMENT IN ALL FUTURE CONVERSATIONS**
**🚀 STATUS: READY TO IMPLEMENT WHEN APPROVED**

**Last Updated:** [Current Date]
**Project:** Babies BBQ Admin & Crew Dashboard Extension
**Confidentiality Level:** HIGH - Trade Secrets
