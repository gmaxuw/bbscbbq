# RLS Implementation Guide - BBQ Restaurant Ordering System

## 🎯 Current Status
- **Project Phase**: Production Finalization
- **RLS Status**: Partially implemented with infinite recursion issues
- **Login Status**: Working with publishable key
- **Environment**: Using new Supabase API keys (publishable/secret)

## 🔑 Environment Variables Required

### Production (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://prqfpxrtopguvelmflhk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_bMBRmPH0Fdbqqk4jFnIbUw_mT34iyuz
SUPABASE_SERVICE_ROLE_KEY=sb_secret_sise6JUkP3k3hNMim8L3GQ_HKQhUL_X
```

### Key Types Explanation
- **Publishable Key**: Replaces traditional anon key for RLS-enabled projects
- **Secret Key**: Replaces service role key for RLS-enabled projects
- **Both are required** for proper RLS functionality

## 👥 User Types & Access Levels

### 1. Admin Users
- **Table**: `admin_users`
- **Roles**: `admin`, `crew`
- **Access**: Full system access
- **Authentication**: Supabase Auth + admin_users verification

### 2. Customers
- **Table**: `users` (customers)
- **Access**: Own data only
- **Authentication**: Supabase Auth only

### 3. Public
- **Access**: Read-only public data
- **Authentication**: None required

## 🗄️ Database Tables & RLS Requirements

### ADMIN TABLES (Need RLS)
| Table | Purpose | RLS Policy Needed | Access Level |
|-------|---------|-------------------|--------------|
| `admin_users` | Admin/crew accounts | ✅ | Admins: Full, Crew: Limited |
| `branches` | Branch management | ✅ | Admins: Full, Crew: Own branch |
| `products` | Product catalog | ✅ | Admins: Full, Crew: Read |
| `orders` | Order management | ✅ | Admins: Full, Crew: Own branch |
| `order_items` | Order details | ✅ | Admins: Full, Crew: Own branch |
| `promo_codes` | Promo management | ✅ | Admins: Full |
| `crew_attendance` | Crew tracking | ✅ | Admins: Full, Crew: Own |
| `sales_reports` | Business reports | ✅ | Admins: Full |
| `system_logs` | System logs | ✅ | Admins: Full |

### CUSTOMER TABLES (Need RLS)
| Table | Purpose | RLS Policy Needed | Access Level |
|-------|---------|-------------------|--------------|
| `users` | Customer accounts | ✅ | Own data only |
| `user_carts` | Shopping carts | ✅ | Own cart only |
| `user_favorites` | Customer favorites | ✅ | Own favorites only |

### PUBLIC TABLES (No RLS)
| Table | Purpose | RLS Policy Needed | Access Level |
|-------|---------|-------------------|--------------|
| `hero_settings` | Homepage settings | ❌ | Public read |
| `platform_settings` | Platform settings | ❌ | Public read |

## 🛡️ RLS Policy Strategy

### Phase 1: Fix Current Issues
1. **Drop problematic policies** causing infinite recursion
2. **Create simple working policies** for admin_users
3. **Test admin login** functionality
4. **Verify dashboard** loads without errors

### Phase 2: Implement Core RLS
1. **Admin tables**: Full access for admins, limited for crew
2. **Customer tables**: Own data only
3. **Public tables**: No RLS needed

### Phase 3: Advanced RLS
1. **Branch-specific access** for crew
2. **Role-based permissions** within admin
3. **Audit logging** for sensitive operations

## 🔧 Current Issues & Solutions

### Issue 1: Infinite Recursion in RLS Policies
**Problem**: `infinite recursion detected in policy for relation "admin_users"`
**Cause**: Circular dependencies in RLS policies
**Solution**: Create simple, non-circular policies

### Issue 2: Connection Issues
**Problem**: MCP tools not connecting to Supabase
**Cause**: Environment file encoding issues
**Solution**: Proper .env.local file with correct encoding

### Issue 3: Mixed Key Types
**Problem**: Confusion between traditional anon key and publishable key
**Solution**: Use publishable key for RLS-enabled projects

## 📋 Implementation Checklist

### ✅ Completed
- [x] Environment variables configured
- [x] Admin login working with publishable key
- [x] Database reset completed
- [x] Basic admin dashboard functionality

### 🔄 In Progress
- [ ] Fix RLS policies for admin_users
- [ ] Test admin login with RLS enabled
- [ ] Implement RLS for other tables

### ⏳ Pending
- [ ] Customer RLS policies
- [ ] Crew-specific access controls
- [ ] Public data access policies
- [ ] Testing all user flows

## 🚀 Next Steps

1. **Fix admin_users RLS policy** (priority 1)
2. **Test admin login** with RLS enabled
3. **Implement RLS for orders table** (priority 2)
4. **Implement RLS for products table** (priority 3)
5. **Test crew login** functionality
6. **Implement customer RLS** policies
7. **Full system testing**

## 🔍 Testing Strategy

### Admin Testing
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] Admin can manage orders
- [ ] Admin can manage products
- [ ] Admin can manage users

### Crew Testing
- [ ] Crew login works
- [ ] Crew dashboard loads
- [ ] Crew can view orders (own branch)
- [ ] Crew can update order status
- [ ] Crew cannot access admin functions

### Customer Testing
- [ ] Customer registration works
- [ ] Customer can view products
- [ ] Customer can create orders
- [ ] Customer can manage cart
- [ ] Customer can manage favorites

## 📝 SQL Commands for RLS

### Drop Problematic Policies
```sql
DROP POLICY IF EXISTS "Allow authenticated read" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin check" ON admin_users;
DROP POLICY IF EXISTS "Users can read self" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage all" ON admin_users;
```

### Create Working Admin Policy
```sql
CREATE POLICY "Allow read admin_users" ON admin_users
FOR SELECT
TO authenticated
USING (true);
```

### Enable RLS
```sql
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

## 🎯 Success Criteria

- [ ] All user types can login successfully
- [ ] RLS policies work without infinite recursion
- [ ] Admin dashboard loads without errors
- [ ] Crew dashboard loads with appropriate restrictions
- [ ] Customer functionality works as expected
- [ ] No security vulnerabilities in data access

## 📞 Support Notes

- **Supabase Project**: prqfpxrtopguvelmflhk
- **Environment**: Production
- **Key Type**: Publishable/Secret (new format)
- **RLS Status**: Partially implemented
- **Last Updated**: January 2025

---

**Note**: This document should be updated as RLS implementation progresses. Each completed item should be checked off and new issues should be documented.
