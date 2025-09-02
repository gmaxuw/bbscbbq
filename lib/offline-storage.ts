/**
 * Offline Storage System
 * Stores orders locally when internet is down and syncs when connection returns
 */

interface OfflineOrder {
  id: string
  referenceNumber: string
  orderData: any
  timestamp: number
  synced: boolean
}

const OFFLINE_ORDERS_KEY = 'bbq_offline_orders'
const SYNC_QUEUE_KEY = 'bbq_sync_queue'

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine
}

// Store order offline
export function storeOrderOffline(orderData: any, referenceNumber: string): void {
  try {
    const offlineOrder: OfflineOrder = {
      id: `offline_${Date.now()}`,
      referenceNumber,
      orderData,
      timestamp: Date.now(),
      synced: false
    }

    const existingOrders = getOfflineOrders()
    existingOrders.push(offlineOrder)
    
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(existingOrders))
    console.log('Order stored offline:', referenceNumber)
  } catch (error) {
    console.error('Error storing order offline:', error)
  }
}

// Get all offline orders
export function getOfflineOrders(): OfflineOrder[] {
  try {
    const stored = localStorage.getItem(OFFLINE_ORDERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error getting offline orders:', error)
    return []
  }
}

// Mark order as synced
export function markOrderAsSynced(orderId: string): void {
  try {
    const orders = getOfflineOrders()
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, synced: true } : order
    )
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(updatedOrders))
  } catch (error) {
    console.error('Error marking order as synced:', error)
  }
}

// Remove synced orders
export function removeSyncedOrders(): void {
  try {
    const orders = getOfflineOrders()
    const unsyncedOrders = orders.filter(order => !order.synced)
    localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(unsyncedOrders))
  } catch (error) {
    console.error('Error removing synced orders:', error)
  }
}

// Sync offline orders to Supabase
export async function syncOfflineOrders(supabase: any): Promise<void> {
  if (!isOnline()) {
    console.log('Still offline, cannot sync orders')
    return
  }

  const offlineOrders = getOfflineOrders().filter(order => !order.synced)
  
  if (offlineOrders.length === 0) {
    console.log('No offline orders to sync')
    return
  }

  console.log(`Syncing ${offlineOrders.length} offline orders...`)

  for (const order of offlineOrders) {
    try {
      // Create the order in Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order.orderData,
          reference_number: order.referenceNumber,
          created_at: new Date(order.timestamp).toISOString(),
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error syncing order:', error)
        continue
      }

      // Mark as synced
      markOrderAsSynced(order.id)
      console.log('Order synced successfully:', order.referenceNumber)
    } catch (error) {
      console.error('Error syncing order:', error)
    }
  }

  // Clean up synced orders
  removeSyncedOrders()
}

// Listen for online/offline events
export function setupOfflineListener(supabase: any): void {
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing offline orders...')
    syncOfflineOrders(supabase)
  })

  window.addEventListener('offline', () => {
    console.log('Connection lost, orders will be stored offline')
  })
}

// Get offline orders count
export function getOfflineOrdersCount(): number {
  return getOfflineOrders().filter(order => !order.synced).length
}
