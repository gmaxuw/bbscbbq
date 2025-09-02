# 🧭 **COMPLETE PAGE NAVIGATION GUIDE**

## **Your BBQ Restaurant System - All Available Pages**

---

## 🏠 **PUBLIC FACING PAGES** (No Login Required)

| Page | URL | Description |
|------|-----|-------------|
| **Homepage** | `http://localhost:3000/` | Complete BBQ website with Hero + Menu + Locations sections |
| **Cart** | `http://localhost:3000/cart` | Shopping cart for customers |
| **Account** | `http://localhost:3000/account` | User login, registration, and account management |
| **Checkout** | `http://localhost:3000/checkout` | Order placement and payment |

---

## 🔐 **ADMIN SYSTEM PAGES** (Requires Admin Login)

| Page | URL | Description |
|------|-----|-------------|
| **Admin Login** | `http://localhost:3000/admin/login` | Secure login for administrators |
| **Admin Dashboard** | `http://localhost:3000/admin` | Main admin control center with business overview |
| **Order Management** | `http://localhost:3000/admin/orders` | Manage all customer orders, status updates |
| **Product Management** | `http://localhost:3000/admin/products` | Manage menu items, prices, availability |
| **Crew Management** | `http://localhost:3000/admin/crew` | Manage staff members and attendance tracking |
| **Branch Management** | `http://localhost:3000/admin/branches` | Manage all branch locations |
| **Analytics & Reports** | `http://localhost:3000/admin/analytics` | Sales data, reports, and exports |
| **Promo Code Management** | `http://localhost:3000/admin/promos` | Create and manage discount codes |

---

## 👥 **CREW SYSTEM PAGES** (Requires Crew Login)

| Page | URL | Description |
|------|-----|-------------|
| **Crew Login** | `http://localhost:3000/crew/login` | Staff login for branch employees |
| **Crew Dashboard** | `http://localhost:3000/crew/dashboard` | Branch-specific staff interface |

---

## 🚀 **HOW TO ACCESS:**

### **Step 1: Start Your Server**
```bash
npm run dev
```

### **Step 2: Open Your Browser**
- Go to: `http://localhost:3000` (main homepage with everything)
- Bookmark this page for quick access

### **Step 3: Navigate to Shopping Pages**
- **Cart:** Click cart icon in header → `/cart`
- **Account:** Click user icon in header → `/account`
- **Checkout:** From cart page → `/checkout`
- **Admin System:** Direct URL access (separate system)

---

## 🔒 **SECURITY & ACCESS CONTROL:**

### **Public Pages** (No Login Required)
- ✅ **Homepage** - Complete website with Hero + Menu + Locations
- ✅ **Cart** - Shopping cart functionality
- ✅ **Account** - User login and registration
- ✅ **Checkout** - Order placement
- ✅ No authentication needed for browsing

### **Admin Pages** (Admin Login Required)
- 🔐 All `/admin/*` pages require admin authentication
- 🔐 Login at: `http://localhost:3000/admin/login`
- 🔐 Full access to all business operations

### **Crew Pages** (Crew Login Required)
- 🔐 All `/crew/*` pages require crew authentication
- 🔐 Login at: `http://localhost:3000/crew/login`
- 🔐 Branch-specific access only

---

## 📊 **DATABASE STATUS:**

### **✅ Tables Created (9/9):**
- `branches` → 4 rows (Quezon City, Makati, Taguig, Pasig)
- `products` → 18 rows (BBQ items, drinks, sides, desserts)
- `users` → 5 rows (admin, managers, staff)
- `orders` → 4 rows (customer orders)
- `order_items` → 9 rows (individual order items)
- `crew_attendance` → 3 rows (staff clock in/out)
- `promo_codes` → 4 rows (discount codes)
- `sales_reports` → 4 rows (daily reports)
- `system_logs` → 2 rows (audit trail)

### **✅ Sample Data Includes:**
- **4 Branch Locations** with managers
- **18 Menu Items** (BBQ, drinks, sides, desserts)
- **5 User Accounts** (admin, managers, staff)
- **4 Sample Orders** with order items
- **4 Promo Codes** for discounts
- **3 Crew Attendance** records
- **4 Sales Reports** for analytics

---

## 🎯 **NEXT STEPS:**

1. **Enhance Homepage** (Add Menu + Locations sections)
2. **Connect Shopping Flow** (Cart → Account → Checkout to database)
3. **Test Complete System** (Admin, Crew, Customer flows)
4. **Deploy to Production** (When ready)

---

## 📝 **QUICK REFERENCE:**

### **Most Important Pages:**
- **Homepage:** `http://localhost:3000/` (Main website with everything)
- **Cart:** `http://localhost:3000/cart` (Shopping cart)
- **Account:** `http://localhost:3000/account` (User login/management)
- **Admin Dashboard:** `http://localhost:3000/admin` (Business management)

### **Development Server:**
- **Start:** `npm run dev`
- **URL:** `http://localhost:3000`
- **Status:** Ready for database connection

---

**Last Updated:** January 2025  
**Database Status:** ✅ Complete (9 tables, sample data)  
**Page Status:** ✅ 4 pages created (Homepage, Cart, Account, Checkout)  
**Next Goal:** Enhance homepage with Menu + Locations sections
