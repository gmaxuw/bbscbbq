# 🚨 CREW MONITORING CONFLICTS ANALYSIS

## Overview
This document contains the complete code analysis of conflicting real-time systems in the crew monitoring implementation. Multiple systems are running simultaneously, causing potential performance issues and data inconsistencies.

---

## 1. **CREW DASHBOARD REAL-TIME CODE**

### File: `app/crew/dashboard/page.tsx`

#### **setupOnlineStatus Function (Lines 204-225)**
```typescript
const setupOnlineStatus = () => {
  if (typeof window === 'undefined') return
  
  const handleOnline = () => {
    setIsOnline(true)
    console.log('🌐 Back online - syncing pending updates')
    syncPendingUpdates()
  }
  const handleOffline = () => {
    setIsOnline(false)
    console.log('📴 Gone offline - storing data locally')
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  setIsOnline(navigator.onLine)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
```

#### **Crew-Specific Real-time Channel (Lines 129-181)**
```typescript
// Set up crew-specific real-time notifications
const setupCrewNotifications = async () => {
  if (!crewMember?.branch_id) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Subscribe to orders for this crew's branch
  const crewChannel = supabase
    .channel(`crew-${crewMember.branch_id}`)  // ❌ CONFLICT: Branch-specific channel
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'orders',
        filter: `branch_id=eq.${crewMember.branch_id}`
      }, 
      (payload) => {
        console.log('🍖 New order for crew branch:', payload.new)
        showCrewOrderNotification(payload.new)
      }
    )
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `branch_id=eq.${crewMember.branch_id}`
      }, 
      (payload) => {
        console.log('📝 Order status update for crew:', payload.new)
        showCrewStatusNotification(payload.new)
      }
    )
    .subscribe()

  return crewChannel
}
```

#### **Additional Real-time Subscription (Lines 627-685)**
```typescript
const setupRealtimeSubscription = () => {
  if (!crewMember?.branch_id) {
    console.log('No branch_id for realtime subscription')
    return
  }

  try {
    console.log('Setting up realtime subscription for branch:', crewMember.branch_id)

    const subscription = supabase
      .channel('crew_orders_changes')  // ❌ CONFLICT: Another channel name
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `branch_id=eq.${crewMember.branch_id}`
        },
        (payload) => {
          console.log('🔄 Order change detected:', payload.eventType, payload.new, payload.old)
          
          // Show instant notification for new orders
          console.log('Crew order change:', payload)
          console.log('Event type:', payload.eventType)
          if (payload.eventType === 'INSERT' && payload.new) {
            showCrewOrderNotification(payload.new)
          }
          
          // Reload orders immediately on any change
          loadOrders()
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('🔄 Order items change detected:', payload.eventType)
          // Reload orders when order items change
          loadOrders()
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime subscription error')
        }
      })

    setRealtimeSubscription(subscription)
    return subscription
  } catch (error) {
    console.error('Failed to setup realtime subscription:', error)
  }
}
```

#### **Crew Monitoring Provider Wrapper (Lines 1046-1850)**
```typescript
return (
  <CrewMonitoringProvider enableAutoTracking={true} enableRealTimeUpdates={true}>
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Crew Dashboard" />
      {/* ... rest of component */}
    </div>
  </CrewMonitoringProvider>
)
```

---

## 2. **CREW REALTIME SERVICE CODE**

### File: `lib/crew-realtime.ts`

#### **Complete Crew Realtime Service**
```typescript
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { CrewOnlineStatus } from './crew-monitoring';

export interface RealtimeCrewUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
}

export class CrewRealtimeService {
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<(update: RealtimeCrewUpdate) => void> = new Set();

  // Subscribe to real-time crew updates
  subscribeToCrewUpdates(
    onUpdate: (update: RealtimeCrewUpdate) => void,
    onError?: (error: Error) => void
  ): void {
    // Add subscriber
    this.subscribers.add(onUpdate);

    // Create channel if it doesn't exist
    if (!this.channel) {
      this.channel = supabase
        .channel('crew-monitoring')  // ❌ CONFLICT: Global monitoring channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_online_status'  // ❌ CONFLICT: Different table
          },
          (payload) => {
            const update: RealtimeCrewUpdate = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'crew_online_status',
              record: payload.new,
              old_record: payload.old
            };

            // Notify all subscribers
            this.subscribers.forEach(subscriber => {
              try {
                subscriber(update);
              } catch (error) {
                console.error('Error in crew update subscriber:', error);
                onError?.(error as Error);
              }
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'crew_activity_logs'  // ❌ CONFLICT: Different table
          },
          (payload) => {
            const update: RealtimeCrewUpdate = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: 'crew_activity_logs',
              record: payload.new,
              old_record: payload.old
            };

            // Notify all subscribers
            this.subscribers.forEach(subscriber => {
              try {
                subscriber(update);
              } catch (error) {
                console.error('Error in crew activity subscriber:', error);
                onError?.(error as Error);
              }
            });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Crew monitoring real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Crew monitoring real-time subscription error');
            onError?.(new Error('Failed to subscribe to crew updates'));
          }
        });
    }
  }

  // Unsubscribe from crew updates
  unsubscribeFromCrewUpdates(onUpdate: (update: RealtimeCrewUpdate) => void): void {
    this.subscribers.delete(onUpdate);

    // If no more subscribers, close the channel
    if (this.subscribers.size === 0 && this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  // Unsubscribe all
  unsubscribeAll(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.subscribers.clear();
  }

  // Get current online crew status
  async getCurrentOnlineCrew(): Promise<CrewOnlineStatus[]> {
    try {
      const { data, error } = await supabase.rpc('get_crew_online_status');
      
      if (error) {
        console.error('Error getting current online crew:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting current online crew:', error);
      return [];
    }
  }

  // Send notification to admins about crew activity
  async notifyCrewActivity(
    activityType: 'login' | 'logout' | 'status_change',
    crewName: string,
    branchName?: string,
    additionalData?: any
  ): Promise<void> {
    try {
      // This could be extended to send actual notifications
      // For now, we'll just log it
      console.log(`Crew Activity: ${crewName} ${activityType}${branchName ? ` at ${branchName}` : ''}`, additionalData);
      
      // You could integrate with a notification service here
      // e.g., send push notifications, emails, etc.
    } catch (error) {
      console.error('Error sending crew activity notification:', error);
    }
  }
}

// Export singleton instance
export const crewRealtime = new CrewRealtimeService();
```

---

## 3. **GLOBAL NOTIFICATION CONTEXT CODE**

### File: `lib/notification-context.tsx`

#### **Global Orders Channel (Lines 225-295)**
```typescript
// Subscribe to new orders (PUBLIC notifications only)
const ordersChannel = supabase
  .channel('global-orders', {  // ❌ CONFLICT: Global orders channel
    config: {
      broadcast: { self: true },
      presence: { key: 'global' }
    }
  })
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'orders'  // ❌ CONFLICT: Same table, different channel
    }, 
    async (payload) => {
      console.log('🆕 New order received!', payload)
      const order = payload.new
      const user = await getCurrentUser()
      
      // 1. PUBLIC notification to everyone on HOMEPAGE ONLY (censored name)
      showPublicOrderNotification(order)
      
      // 2. ADMIN notification (full name + amount)
      if (user && user.email === 'gabu.sacro@gmail.com') {
        showOrderNotification(order)
      }
      
      // 3. CREW notification (full name + amount) - will be handled by crew-specific logic
      // This will be implemented in crew dashboard
    }
  )
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'orders'  // ❌ CONFLICT: Same table, different channel
    }, 
    async (payload) => {
      console.log('📝 Order update received!', payload)
      const order = payload.new
      const user = await getCurrentUser()
      
      // 1. ADMIN gets all status updates
      if (user && user.email === 'gabu.sacro@gmail.com') {
        showOrderStatusNotification(order)
      }
      
      // 2. CUSTOMER gets only THEIR order status updates
      if (user && user.email === order.customer_email) {
        showOrderStatusNotification(order)
      }
      
      // 3. CREW gets notifications for their branch orders
      // (This will be handled by crew-specific logic in crew dashboard)
    }
  )
  .subscribe((status) => {
    console.log('📡 Global orders channel status:', status)
    if (status === 'SUBSCRIBED') {
      console.log('✅ Global real-time notifications active!')
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Global real-time failed! Setting up polling...')
      setupGlobalPolling()
    } else if (status === 'TIMED_OUT') {
      console.log('⏰ Global real-time timed out - switching to polling (this is normal)')
      setupGlobalPolling()
    } else if (status === 'CLOSED') {
      console.log('🔒 Global real-time closed - switching to polling (this is normal)')
      setupGlobalPolling()
    }
  })
```

#### **Global Polling Fallback (Lines 298-353)**
```typescript
// Global polling fallback
const setupGlobalPolling = () => {
  console.log('🔄 Setting up GLOBAL polling...')
  
  const pollInterval = setInterval(async () => {
    try {
      // Get the latest order timestamp - handle RLS properly
      const { data: latestOrder, error: orderError } = await supabase
        .from('orders')
        .select('created_at, id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        
      if (orderError) {
        console.log('⚠️ Polling order check failed (RLS):', orderError.message)
        return // Skip this poll cycle
      }

      if (!latestOrder) {
        // No orders yet; nothing to do
        return
      }

      if (latestOrder) {
        const latestTime = new Date(latestOrder.created_at).getTime()
        const lastCheck = localStorage.getItem('globalLastOrderCheck')
        const lastCheckTime = lastCheck ? parseInt(lastCheck) : 0

        // If there's a new order since last check
        if (latestTime > lastCheckTime) {
          console.log('🆕 Global new order detected via polling!')
          
          // Get the new order details
          const { data: newOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('id', latestOrder.id)
            .maybeSingle()

          if (newOrder) {
            showOrderNotification(newOrder)
          }

          // Update last check time
          localStorage.setItem('globalLastOrderCheck', latestTime.toString())
        }
      }
    } catch (error) {
      console.log('⚠️ Global polling error (RLS/Network):', error)
      // Don't log as error since this is expected with RLS
    }
  }, 5000) // Poll every 5 seconds (reduced frequency)

  // Store interval ID for cleanup
  ;(window as any).globalPollInterval = pollInterval
}
```

---

## 4. **CREW MONITORING CONTEXT CODE**

### File: `lib/crew-monitoring-context.tsx`

#### **Real-time Updates Effect (Lines 186-199)**
```typescript
// Real-time updates
useEffect(() => {
  if (!enableRealTimeUpdates) return;

  // Initial load
  refreshOnlineStatus();

  // Set up interval for periodic updates
  const interval = setInterval(refreshOnlineStatus, 10000); // Every 10 seconds for better real-time feel

  return () => {
    clearInterval(interval);
  };
}, [enableRealTimeUpdates, refreshOnlineStatus]);
```

#### **Auto-start Session Effect (Lines 173-184)**
```typescript
// Auto-start session on mount if enabled
useEffect(() => {
  if (enableAutoTracking) {
    startSession();
  }

  return () => {
    if (enableAutoTracking) {
      crewMonitoring.cleanup();
    }
  };
}, [enableAutoTracking, startSession]);
```

#### **Page Tracking Effect (Lines 201-219)**
```typescript
// Track page changes
useEffect(() => {
  if (!enableAutoTracking || !isOnline) return;

  const handleRouteChange = () => {
    const currentPage = window.location.pathname;
    trackPageView(currentPage);
  };

  // Track initial page
  handleRouteChange();

  // Listen for route changes (Next.js)
  window.addEventListener('popstate', handleRouteChange);

  return () => {
    window.removeEventListener('popstate', handleRouteChange);
  };
}, [enableAutoTracking, isOnline, trackPageView]);
```

#### **Periodic Cleanup Effect (Lines 247-258)**
```typescript
// Periodic cleanup of stale sessions (every 5 minutes)
useEffect(() => {
  const cleanupInterval = setInterval(async () => {
    try {
      await crewMonitoring.cleanupStaleSessions();
    } catch (error) {
      console.error('Error during periodic cleanup:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  return () => clearInterval(cleanupInterval);
}, []);
```

---

## 5. **ADDITIONAL CONFLICTING CODE**

### **Crew Dashboard Polling (Lines 124-127)**
```typescript
// Simple data refresh + crew-specific notifications
const refreshInterval = setInterval(() => {
  loadOrders()
}, 10000) // Refresh every 10 seconds for faster updates
```

### **Crew Dashboard Cleanup (Lines 175-180)**
```typescript
return () => {
  clearInterval(refreshInterval)
  if ((window as any).crewChannel) {
    (window as any).crewChannel.unsubscribe()
  }
}
```

### **Crew Dashboard Realtime Cleanup (Lines 185-192)**
```typescript
// Cleanup realtime subscription on unmount
useEffect(() => {
  return () => {
    if (realtimeSubscription) {
      console.log('🧹 Component unmounting, cleaning up realtime subscription')
      realtimeSubscription.unsubscribe()
    }
  }
}, [realtimeSubscription])
```

---

## 🚨 **IDENTIFIED CONFLICTS**

### **1. Multiple Real-time Channels**
- `global-orders` (notification-context.tsx)
- `crew-monitoring` (crew-realtime.ts)
- `crew-${branch_id}` (crew dashboard)
- `crew_orders_changes` (crew dashboard)

### **2. Duplicate Session Tracking**
- Crew dashboard has its own `setupOnlineStatus()`
- Crew monitoring context has its own session management
- Both systems track online/offline status independently

### **3. Overlapping Table Subscriptions**
- Multiple channels listening to `orders` table
- Different filters but same table
- Potential for duplicate processing

### **4. Multiple Polling Intervals**
- Global polling (5 seconds)
- Crew dashboard polling (10 seconds)
- Crew monitoring polling (10 seconds)
- Periodic cleanup (5 minutes)

### **5. Memory Leaks Potential**
- Multiple intervals not properly cleaned up
- Multiple channels not properly unsubscribed
- Window event listeners not removed

---

## 📊 **PERFORMANCE IMPACT**

### **Current State:**
- **4+ Concurrent Supabase Channels**
- **3+ Polling Intervals**
- **Multiple Event Listeners**
- **Duplicate Data Processing**

### **Recommended State:**
- **1 Consolidated Channel Manager**
- **1 Polling Interval**
- **Single Source of Truth**
- **Event Delegation Pattern**

---

## 🔧 **MINIMAL FIX RECOMMENDATIONS**

1. **Consolidate Channels**: Create single `RealtimeManager`
2. **Remove Duplicates**: Eliminate duplicate session tracking
3. **Single Polling**: Use one polling mechanism
4. **Proper Cleanup**: Ensure all intervals/channels are cleaned up
5. **Event Delegation**: Use single event handler for all updates

This analysis provides the complete code base for identifying and resolving the crew monitoring conflicts.
