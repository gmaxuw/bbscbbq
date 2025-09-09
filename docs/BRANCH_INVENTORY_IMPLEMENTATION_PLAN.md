# 🏪 BRANCH-SPECIFIC INVENTORY IMPLEMENTATION PLAN

## 📋 **EXECUTIVE SUMMARY**

**CRITICAL ISSUE**: Current inventory system is global across all branches, causing stock conflicts when customers order from different locations. This creates operational chaos and potential business disaster.

**SOLUTION**: Implement branch-specific inventory management system with proper database schema, API endpoints, and frontend integration.

---

## 🚨 **CURRENT PROBLEM ANALYSIS**

### **Existing System Issues:**
- **Global Inventory**: `products.stock_quantity` affects ALL branches
- **Order Impact**: Order from any branch reduces global stock
- **Branch Confusion**: All branches show same stock levels
- **Operational Risk**: Stock runs out across all locations simultaneously

### **Business Impact:**
- **Customer Frustration**: Orders fail due to false stock availability
- **Revenue Loss**: Unable to fulfill orders from any branch
- **Operational Chaos**: Crew members can't track actual inventory
- **Scalability Issues**: Cannot expand to multiple locations effectively

---

## 🎯 **SOLUTION ARCHITECTURE**

### **Phase 1: Database Schema Redesign**

#### **1.1 New Table: `branch_inventory`**
```sql
CREATE TABLE branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  is_out_of_stock BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(branch_id, product_id),
  CHECK(stock_quantity >= 0),
  CHECK(min_stock_level >= 0)
);

-- Indexes for performance
CREATE INDEX idx_branch_inventory_branch_id ON branch_inventory(branch_id);
CREATE INDEX idx_branch_inventory_product_id ON branch_inventory(product_id);
CREATE INDEX idx_branch_inventory_out_of_stock ON branch_inventory(is_out_of_stock);
```

#### **1.2 Migration Strategy**
```sql
-- Step 1: Create branch_inventory table
-- Step 2: Populate with current global inventory for all branches
-- Step 3: Update existing orders to use branch-specific inventory
-- Step 4: Add RLS policies for security
-- Step 5: Create triggers for automatic updates
```

#### **1.3 RLS Policies**
```sql
-- Branch inventory policies
CREATE POLICY "Users can view branch inventory" ON branch_inventory
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage branch inventory" ON branch_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

CREATE POLICY "Crew can view their branch inventory" ON branch_inventory
  FOR SELECT USING (
    branch_id IN (
      SELECT branch_id FROM admin_users 
      WHERE user_id = auth.uid() 
      AND role = 'crew' 
      AND is_active = true
    )
  );
```

### **Phase 2: Backend API Implementation**

#### **2.1 New API Endpoints**

**File: `app/api/admin/branch-inventory/route.ts`**
```typescript
// GET /api/admin/branch-inventory
// - Get inventory for specific branch
// - Get inventory for all branches
// - Filter by product, branch, stock status

// POST /api/admin/branch-inventory
// - Add new inventory entry
// - Bulk import inventory

// PUT /api/admin/branch-inventory/[id]
// - Update inventory quantity
// - Update min stock level

// DELETE /api/admin/branch-inventory/[id]
// - Remove inventory entry
```

**File: `app/api/admin/branch-inventory/[branchId]/[productId]/route.ts`**
```typescript
// GET /api/admin/branch-inventory/[branchId]/[productId]
// - Get specific product inventory for branch

// PUT /api/admin/branch-inventory/[branchId]/[productId]
// - Update specific product inventory
// - Handle stock adjustments
```

#### **2.2 Inventory Management Service**

**File: `lib/branch-inventory-manager.ts`**
```typescript
class BranchInventoryManager {
  // Get inventory for specific branch
  async getBranchInventory(branchId: string)
  
  // Get inventory for all branches
  async getAllBranchInventory()
  
  // Update inventory quantity
  async updateInventory(branchId: string, productId: string, quantity: number)
  
  // Process order (reduce stock)
  async processOrder(orderId: string, branchId: string)
  
  // Check availability
  async checkAvailability(branchId: string, productId: string, requestedQty: number)
  
  // Get low stock alerts
  async getLowStockAlerts(branchId?: string)
  
  // Bulk update inventory
  async bulkUpdateInventory(updates: InventoryUpdate[])
}
```

#### **2.3 Order Processing Updates**

**File: `lib/inventory-manager.ts` (Updated)**
```typescript
// Update existing processOrder function
async processOrder(orderId: string) {
  // 1. Get order details with branch_id
  // 2. For each order item:
  //    - Check branch-specific inventory
  //    - Reduce branch-specific stock
  //    - Update branch-specific is_out_of_stock
  // 3. Log inventory changes
  // 4. Send low stock alerts if needed
}
```

### **Phase 3: Frontend Implementation**

#### **3.1 Admin Branch Inventory Management**

**File: `app/admin/settings/page.tsx` (Updated)**
```typescript
// Add new tab: 'inventory'
const [activeTab, setActiveTab] = useState<'products' | 'branches' | 'crew' | 'profile' | 'general' | 'promos' | 'inventory'>('products')

// New inventory management section
const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])
const [selectedBranch, setSelectedBranch] = useState<string>('all')
const [inventorySearchTerm, setInventorySearchTerm] = useState('')
const [showInventoryForm, setShowInventoryForm] = useState(false)
```

**Features:**
- **Branch Selection**: Dropdown to select specific branch
- **Inventory Grid**: Product × Branch matrix view
- **Bulk Updates**: Update multiple products at once
- **Low Stock Alerts**: Highlight products below min level
- **Export/Import**: CSV import/export functionality
- **Real-time Updates**: Live inventory tracking

#### **3.2 Crew Inventory Dashboard**

**File: `app/crew/dashboard/page.tsx` (Updated)**
```typescript
// Add inventory section to crew dashboard
const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])
const [lowStockItems, setLowStockItems] = useState<Product[]>([])

// Show only crew's branch inventory
// Display low stock alerts
// Quick inventory adjustment interface
```

#### **3.3 Customer Product Display**

**File: `components/home/FeaturedMenu.tsx` (Updated)**
```typescript
// Update availability check to use branch-specific inventory
const getAvailabilityStatus = (product: Product, branchId: string) => {
  // Check branch-specific inventory instead of global
  // Show "Available at [Branch Name]" or "Out of Stock"
  // Handle multiple branch availability
}
```

**File: `app/favorites/page.tsx` (Updated)**
```typescript
// Update product availability display
// Show branch-specific stock levels
// Allow customers to select preferred branch
```

### **Phase 4: Order Flow Updates**

#### **4.1 Checkout Process**

**File: `app/checkout/page.tsx` (Updated)**
```typescript
// Add branch selection for customers
const [selectedBranch, setSelectedBranch] = useState<string>('')
const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])

// Validate inventory before order submission
// Show branch-specific availability
// Handle branch-specific pricing (if needed)
```

#### **4.2 Cart Management**

**File: `lib/cart-context.tsx` (Updated)**
```typescript
// Add branch context to cart
const [selectedBranch, setSelectedBranch] = useState<string>('')
const [branchInventory, setBranchInventory] = useState<BranchInventory[]>([])

// Update addToCart to check branch inventory
// Show branch-specific availability in cart
// Handle branch switching
```

### **Phase 5: Data Migration**

#### **5.1 Migration Script**

**File: `scripts/migrate-to-branch-inventory.sql`**
```sql
-- Step 1: Create branch_inventory table
-- Step 2: Populate with current global inventory
-- Step 3: Update existing orders to use branch inventory
-- Step 4: Add constraints and indexes
-- Step 5: Test data integrity
```

#### **5.2 Data Population Strategy**
```typescript
// For each branch:
//   For each product:
//     - Copy global stock_quantity to branch_inventory
//     - Set min_stock_level to current global value
//     - Calculate is_out_of_stock based on branch stock
//     - Preserve existing order history
```

### **Phase 6: Testing Strategy**

#### **6.1 Unit Tests**
```typescript
// Test inventory management functions
// Test order processing with branch inventory
// Test availability checks
// Test low stock alerts
```

#### **6.2 Integration Tests**
```typescript
// Test complete order flow
// Test admin inventory management
// Test crew dashboard updates
// Test customer product display
```

#### **6.3 User Acceptance Tests**
```typescript
// Test admin can manage branch inventory
// Test crew can view their branch inventory
// Test customers can order from specific branch
// Test inventory updates in real-time
```

---

## 🗂️ **FILE STRUCTURE CHANGES**

### **New Files:**
```
lib/
├── branch-inventory-manager.ts
├── inventory-migration.ts
└── branch-inventory-types.ts

app/api/admin/branch-inventory/
├── route.ts
├── [branchId]/
│   └── [productId]/
│       └── route.ts
└── bulk-update/
    └── route.ts

components/admin/
├── BranchInventoryGrid.tsx
├── InventoryBulkUpdate.tsx
└── LowStockAlerts.tsx

scripts/
├── migrate-to-branch-inventory.sql
└── populate-branch-inventory.ts
```

### **Modified Files:**
```
app/admin/settings/page.tsx          # Add inventory tab
app/crew/dashboard/page.tsx          # Add inventory section
app/checkout/page.tsx                # Add branch selection
app/favorites/page.tsx               # Update availability
components/home/FeaturedMenu.tsx     # Update availability
lib/inventory-manager.ts             # Update order processing
lib/cart-context.tsx                 # Add branch context
```

---

## ⚡ **IMPLEMENTATION TIMELINE**

### **Week 1: Database & Backend**
- [ ] Create branch_inventory table
- [ ] Implement RLS policies
- [ ] Create API endpoints
- [ ] Update inventory manager

### **Week 2: Frontend Admin**
- [ ] Add inventory tab to admin settings
- [ ] Create branch inventory grid
- [ ] Implement bulk update functionality
- [ ] Add low stock alerts

### **Week 3: Frontend Customer**
- [ ] Update product availability display
- [ ] Add branch selection to checkout
- [ ] Update cart management
- [ ] Test order flow

### **Week 4: Testing & Migration**
- [ ] Run data migration
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates

---

## 🔒 **SECURITY CONSIDERATIONS**

### **Access Control:**
- **Admins**: Full access to all branch inventory
- **Crew**: Read-only access to their branch inventory
- **Customers**: View-only access to availability

### **Data Validation:**
- **Stock quantities** must be non-negative
- **Min stock levels** must be reasonable
- **Inventory updates** must be logged
- **Bulk operations** must be rate-limited

### **Audit Trail:**
- **All inventory changes** logged in system_logs
- **User actions** tracked with timestamps
- **Low stock alerts** sent to relevant users
- **Data integrity** checks run periodically

---

## 📊 **MONITORING & ALERTS**

### **Key Metrics:**
- **Inventory accuracy** per branch
- **Low stock frequency** by product
- **Order fulfillment rate** by branch
- **Inventory turnover** by branch

### **Alert System:**
- **Low stock alerts** when below min level
- **Out of stock alerts** when inventory reaches 0
- **Negative inventory alerts** for data integrity
- **Bulk update confirmations** for large changes

---

## 🚀 **ROLLBACK PLAN**

### **If Issues Arise:**
1. **Disable branch inventory** feature flag
2. **Revert to global inventory** system
3. **Restore from backup** if data corruption
4. **Gradual re-enablement** after fixes

### **Backup Strategy:**
- **Full database backup** before migration
- **Incremental backups** during implementation
- **Test environment** for validation
- **Staging environment** for final testing

---

## 📈 **SUCCESS CRITERIA**

### **Functional Requirements:**
- [ ] Each branch has independent inventory
- [ ] Orders only affect ordering branch
- [ ] Admin can manage all branch inventory
- [ ] Crew can view their branch inventory
- [ ] Customers see accurate availability

### **Performance Requirements:**
- [ ] Inventory queries < 200ms
- [ ] Order processing < 500ms
- [ ] Real-time updates < 1s
- [ ] Bulk operations < 5s

### **Business Requirements:**
- [ ] Zero inventory conflicts
- [ ] Accurate stock levels
- [ ] Improved order fulfillment
- [ ] Better operational control

---

## 💡 **FUTURE ENHANCEMENTS**

### **Phase 2 Features:**
- **Transfer inventory** between branches
- **Automatic reordering** based on sales
- **Inventory forecasting** using AI
- **Multi-location** order fulfillment

### **Phase 3 Features:**
- **Supplier integration** for restocking
- **Inventory analytics** dashboard
- **Mobile app** for crew inventory
- **Barcode scanning** for updates

---

**This comprehensive plan ensures a smooth transition to branch-specific inventory management while maintaining system stability and business continuity.**
