'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
  showOrderNotification: (order: any) => void
  showOrderStatusNotification: (order: any) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<any[]>([])

  // Global notification function
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now()
    const notification = {
      id,
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  // Order notification function
  const showOrderNotification = (order: any) => {
    console.log('🔔 Global order notification:', order)
    
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300'
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span class="text-lg">🛒</span>
        </div>
        <div>
          <div class="font-bold text-sm">New Order!</div>
          <div class="text-xs opacity-90">${order.customer_name} - ₱${order.total_amount}</div>
          <div class="text-xs opacity-75">Order #${order.order_number}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 5000)
  }

  // Order status notification function
  const showOrderStatusNotification = (order: any) => {
    console.log('🔔 Global order status notification:', order)
    
    let statusMessage = ''
    let statusIcon = '📝'
    let bgColor = 'bg-blue-500'
    
    switch (order.order_status) {
      case 'confirmed':
        statusMessage = 'Order Confirmed! 🎉'
        statusIcon = '✅'
        bgColor = 'bg-green-500'
        break
      case 'preparing':
        statusMessage = 'Cooking Started! 🔥'
        statusIcon = '👨‍🍳'
        bgColor = 'bg-orange-500'
        break
      case 'ready':
        statusMessage = 'Ready for Pickup! 🍽️'
        statusIcon = '🍴'
        bgColor = 'bg-green-600'
        break
      case 'completed':
        statusMessage = 'Order Completed! ✅'
        statusIcon = '🎉'
        bgColor = 'bg-purple-500'
        break
      default:
        statusMessage = 'Order Updated! 📝'
        statusIcon = '📝'
        bgColor = 'bg-blue-500'
    }
    
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300`
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span class="text-lg">${statusIcon}</span>
        </div>
        <div>
          <div class="font-bold text-sm">${statusMessage}</div>
          <div class="text-xs opacity-90">Order #${order.order_number}</div>
          <div class="text-xs opacity-75">${order.customer_name}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full')
    }, 100)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 5000)
  }

  // Global real-time subscription setup
  useEffect(() => {
    console.log('🔔 Setting up GLOBAL real-time notifications...')
    
    // Subscribe to new orders
    const ordersChannel = supabase
      .channel('global-orders', {
        config: {
          broadcast: { self: true },
          presence: { key: 'global' }
        }
      })
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          console.log('🆕 Global new order received!', payload)
          showOrderNotification(payload.new)
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          console.log('📝 Global order update received!', payload)
          showOrderStatusNotification(payload.new)
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
          console.error('⏰ Global real-time timed out! Setting up polling...')
          setupGlobalPolling()
        } else if (status === 'CLOSED') {
          console.log('🔒 Global real-time closed! Setting up polling...')
          setupGlobalPolling()
        }
      })

    // Global polling fallback
    const setupGlobalPolling = () => {
      console.log('🔄 Setting up GLOBAL polling...')
      
      const pollInterval = setInterval(async () => {
        try {
          // Get the latest order timestamp
          const { data: latestOrder } = await supabase
            .from('orders')
            .select('created_at, id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

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
                .single()

              if (newOrder) {
                showOrderNotification(newOrder)
              }

              // Update last check time
              localStorage.setItem('globalLastOrderCheck', latestTime.toString())
            }
          }
        } catch (error) {
          console.error('Global polling error:', error)
        }
      }, 3000) // Poll every 3 seconds

      // Store interval ID for cleanup
      ;(window as any).globalPollInterval = pollInterval
    }

    // Cleanup on unmount
    return () => {
      supabase.removeAllChannels()
      if ((window as any).globalPollInterval) {
        clearInterval((window as any).globalPollInterval)
        ;(window as any).globalPollInterval = null
      }
    }
  }, [])

  const value = {
    showNotification,
    showOrderNotification,
    showOrderStatusNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
