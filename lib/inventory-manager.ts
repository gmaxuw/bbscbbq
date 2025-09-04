/**
 * 🏪 INVENTORY MANAGEMENT SYSTEM
 * 
 * This handles real-time stock tracking, offline sync, and commission management
 * for the BBQ business app. It ensures data consistency across online/offline states.
 * 
 * Features:
 * - Real-time stock updates when orders are placed
 * - Offline order queuing and sync when internet returns
 * - Commission tracking for every transaction
 * - Stock conflict resolution for simultaneous orders
 * - Sales analytics data extraction
 */

import { createClient } from '@/lib/supabase'

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  unit_commission: number
  subtotal: number
}

export interface PendingOrder {
  id: string
  items: OrderItem[]
  total_amount: number
  total_commission: number
  customer_name: string
  customer_phone: string
  timestamp: number
  status: 'pending' | 'synced' | 'conflict'
}

export interface StockUpdate {
  product_id: string
  quantity_change: number
  operation: 'add' | 'subtract'
  reason: 'order' | 'restock' | 'adjustment'
  order_id?: string
}

class InventoryManager {
  private pendingOrders: PendingOrder[] = []
  private isOnline: boolean = true
  private syncInProgress: boolean = false

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeOfflineDetection()
      this.loadPendingOrders()
    }
  }

  /**
   * Initialize offline detection and auto-sync
   */
  private initializeOfflineDetection() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncPendingOrders()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Check online status periodically
    setInterval(() => {
      const wasOffline = !this.isOnline
      this.isOnline = navigator.onLine
      
      if (wasOffline && this.isOnline) {
        this.syncPendingOrders()
      }
    }, 5000)
  }

  /**
   * Load pending orders from localStorage
   */
  private loadPendingOrders() {
    try {
      const stored = localStorage.getItem('pending_orders')
      if (stored) {
        this.pendingOrders = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load pending orders:', error)
    }
  }

  /**
   * Save pending orders to localStorage
   */
  private savePendingOrders() {
    try {
      localStorage.setItem('pending_orders', JSON.stringify(this.pendingOrders))
    } catch (error) {
      console.error('Failed to save pending orders:', error)
    }
  }

  /**
   * Process an order and update stock
   */
  async processOrder(orderData: {
    items: OrderItem[]
    customer_name: string
    customer_phone: string
    branch_id?: string
  }): Promise<{ success: boolean; order_id?: string; conflicts?: string[] }> {
    try {
      if (this.isOnline) {
        return await this.processOnlineOrder(orderData)
      } else {
        return await this.processOfflineOrder(orderData)
      }
    } catch (error) {
      console.error('Failed to process order:', error)
      return { success: false }
    }
  }

  /**
   * Process order when online
   */
  private async processOnlineOrder(orderData: {
    items: OrderItem[]
    customer_name: string
    customer_phone: string
    branch_id?: string
  }): Promise<{ success: boolean; order_id?: string; conflicts?: string[] }> {
    const supabase = createClient()
    
    // Check stock availability first
    const stockChecks = await Promise.all(
      orderData.items.map(async (item) => {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product_id)
          .single()

        return {
          product_id: item.product_id,
          product_name: product?.name || 'Unknown',
          available: (product?.stock_quantity || 0) >= item.quantity,
          current_stock: product?.stock_quantity || 0
        }
      })
    )

    // Check for conflicts
    const conflicts = stockChecks.filter(check => !check.available)
    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts: conflicts.map(c => `${c.product_name} (only ${c.current_stock} available)`)
      }
    }

    // Create order
    const total_amount = orderData.items.reduce((sum, item) => sum + item.subtotal, 0)
    const total_commission = orderData.items.reduce((sum, item) => sum + (item.unit_commission * item.quantity), 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        branch_id: orderData.branch_id,
        subtotal: total_amount,
        total_amount: total_amount,
        total_commission: total_commission,
        order_status: 'pending',
        payment_status: 'pending'
      }])
      .select()
      .single()

    if (orderError) throw orderError

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_commission: item.unit_commission,
      subtotal: item.subtotal
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Update stock quantities
    await this.updateStockQuantities(orderData.items, order.id)

    return { success: true, order_id: order.id }
  }

  /**
   * Process order when offline
   */
  private async processOfflineOrder(orderData: {
    items: OrderItem[]
    customer_name: string
    customer_phone: string
    branch_id?: string
  }): Promise<{ success: boolean; order_id?: string }> {
    const orderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const pendingOrder: PendingOrder = {
      id: orderId,
      items: orderData.items,
      total_amount: orderData.items.reduce((sum, item) => sum + item.subtotal, 0),
      total_commission: orderData.items.reduce((sum, item) => sum + (item.unit_commission * item.quantity), 0),
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      timestamp: Date.now(),
      status: 'pending'
    }

    this.pendingOrders.push(pendingOrder)
    this.savePendingOrders()

    return { success: true, order_id: orderId }
  }

  /**
   * Update stock quantities in database
   */
  private async updateStockQuantities(items: OrderItem[], orderId: string) {
    const supabase = createClient()
    
    for (const item of items) {
      // Get current stock
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single()

      if (product) {
        const newStock = Math.max(0, product.stock_quantity - item.quantity)
        
        // Update stock
        await supabase
          .from('products')
          .update({
            stock_quantity: newStock,
            is_out_of_stock: newStock === 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.product_id)

        // Log stock change
        await supabase
          .from('system_logs')
          .insert([{
            log_type: 'stock_update',
            order_id: orderId,
            message: `Stock reduced by ${item.quantity} for product ${item.product_name}`,
            error_details: {
              product_id: item.product_id,
              quantity_change: -item.quantity,
              new_stock: newStock
            }
          }])
      }
    }
  }

  /**
   * Sync pending orders when back online
   */
  private async syncPendingOrders() {
    if (this.syncInProgress || this.pendingOrders.length === 0) return

    this.syncInProgress = true
    console.log('🔄 Syncing pending orders...')

    const ordersToSync = [...this.pendingOrders]
    const syncedOrders: string[] = []
    const failedOrders: string[] = []

    for (const order of ordersToSync) {
      try {
        const result = await this.processOnlineOrder({
          items: order.items,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone
        })

        if (result.success) {
          syncedOrders.push(order.id)
          order.status = 'synced'
        } else {
          failedOrders.push(order.id)
          order.status = 'conflict'
          
          // Notify customer about conflicts
          this.notifyCustomerConflict(order, result.conflicts || [])
        }
      } catch (error) {
        console.error(`Failed to sync order ${order.id}:`, error)
        failedOrders.push(order.id)
      }
    }

    // Remove synced orders
    this.pendingOrders = this.pendingOrders.filter(order => !syncedOrders.includes(order.id))
    this.savePendingOrders()

    console.log(`✅ Synced ${syncedOrders.length} orders, ${failedOrders.length} failed`)
    this.syncInProgress = false
  }

  /**
   * Notify customer about stock conflicts
   */
  private notifyCustomerConflict(order: PendingOrder, conflicts: string[]) {
    // This would integrate with your notification system
    console.log(`⚠️ Order conflict for ${order.customer_name}:`, conflicts)
    
    // You could send SMS, email, or push notification here
    // For now, we'll just log it
    alert(`Order conflict detected! Some items are no longer available: ${conflicts.join(', ')}`)
  }

  /**
   * Add stock to a product (admin restock)
   */
  async addStock(productId: string, quantity: number, reason: string = 'restock') {
    try {
      const supabase = createClient()
      
      // Get current stock
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity, name')
        .eq('id', productId)
        .single()

      if (product) {
        const newStock = product.stock_quantity + quantity
        
        // Update stock
        await supabase
          .from('products')
          .update({
            stock_quantity: newStock,
            is_out_of_stock: newStock === 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)

        // Log stock change
        await supabase
          .from('system_logs')
          .insert([{
            log_type: 'stock_update',
            message: `Stock increased by ${quantity} for product ${product.name} (${reason})`,
            error_details: {
              product_id: productId,
              quantity_change: quantity,
              new_stock: newStock,
              reason: reason
            }
          }])

        return { success: true, new_stock: newStock }
      }
    } catch (error) {
      console.error('Failed to add stock:', error)
      return { success: false }
    }
  }

  /**
   * Get sales analytics data
   */
  async getSalesAnalytics(startDate: string, endDate: string) {
    try {
      const supabase = createClient()
      
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(name, category)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('order_status', 'completed')

      if (!orders) return null

      const analytics = {
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
        total_commission: orders.reduce((sum, order) => sum + (order.total_commission || 0), 0),
        products_sold: orders.reduce((sum, order) => 
          sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
        ),
        top_products: this.calculateTopProducts(orders),
        daily_sales: this.calculateDailySales(orders)
      }

      return analytics
    } catch (error) {
      console.error('Failed to get sales analytics:', error)
      return null
    }
  }

  /**
   * Calculate top selling products
   */
  private calculateTopProducts(orders: any[]) {
    const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {}

    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product?.name || 'Unknown',
            quantity: 0,
            revenue: 0
          }
        }
        productSales[productId].quantity += item.quantity
        productSales[productId].revenue += item.subtotal
      })
    })

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }

  /**
   * Calculate daily sales
   */
  private calculateDailySales(orders: any[]) {
    const dailySales: { [key: string]: { revenue: number; orders: number } } = {}

    orders.forEach(order => {
      const date = order.created_at.split('T')[0]
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, orders: 0 }
      }
      dailySales[date].revenue += order.total_amount || 0
      dailySales[date].orders += 1
    })

    return Object.entries(dailySales)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Get pending orders count
   */
  getPendingOrdersCount(): number {
    return this.pendingOrders.filter(order => order.status === 'pending').length
  }

  /**
   * Get pending orders
   */
  getPendingOrders(): PendingOrder[] {
    return this.pendingOrders
  }

  /**
   * Clear resolved conflicts
   */
  clearResolvedConflicts() {
    this.pendingOrders = this.pendingOrders.filter(order => order.status !== 'conflict')
    this.savePendingOrders()
  }
}

// Export singleton instance
export const inventoryManager = new InventoryManager()
export default inventoryManager

