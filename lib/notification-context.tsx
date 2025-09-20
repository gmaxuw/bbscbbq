'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
  showOrderNotification: (order: any) => void
  showOrderStatusNotification: (order: any) => void
  showPublicOrderNotification: (order: any) => void
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

  // Censor name function - creates strategic asterisks
  const censorName = (name: string) => {
    if (!name || name.length < 2) return name
    
    const words = name.split(' ')
    const censoredWords = words.map(word => {
      if (word.length <= 2) return word
      
      // Keep first and last letter, replace middle with asterisks
      const first = word[0]
      const last = word[word.length - 1]
      const middle = '*'.repeat(Math.max(1, word.length - 2))
      
      return first + middle + last
    })
    
    return censoredWords.join(' ')
  }

  // COOL PUBLIC notification function (shows to everyone on HOMEPAGE ONLY)
  const showPublicOrderNotification = (order: any) => {
    console.log('🔥 COOL public notification:', order)
    
    // Only show on homepage (check if we're on the main page)
    const isHomepage = window.location.pathname === '/' || window.location.pathname === '/home'
    if (!isHomepage) {
      console.log('Not on homepage, skipping public notification')
      return
    }
    
    const censoredName = censorName(order.customer_name)
    
    // Create a fun, public notification that shows to everyone
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 left-4 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm transform -translate-x-full transition-transform duration-500'
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <span class="text-xl">🍖</span>
        </div>
        <div>
          <div class="font-bold text-sm">🔥 Someone just ordered BBQ!</div>
          <div class="text-xs opacity-90">${censoredName} ordered ₱${order.total_amount?.toFixed(2) || '0.00'}</div>
          <div class="text-xs opacity-75">Order #${order.order_number}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Animate in from left
    setTimeout(() => {
      notification.classList.remove('-translate-x-full')
    }, 100)
    
    // Auto remove after 8 seconds (longer for public notifications)
    setTimeout(() => {
      notification.classList.add('-translate-x-full')
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 500)
    }, 8000)
  }

  // Global real-time subscription setup with PRIVACY
  useEffect(() => {
    console.log('🔔 Setting up PRIVACY-AWARE global notifications...')
    
    // Get current user info for privacy filtering
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    }
    
    // Subscribe to new orders (PUBLIC notifications only)
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
          table: 'orders' 
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
    showOrderStatusNotification,
    showPublicOrderNotification
  }

  // Add test functions to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).testPublicNotification = () => {
        showPublicOrderNotification({
          order_number: 'TEST-001',
          customer_name: 'Test Customer',
          total_amount: 3000.00
        })
      }
    }
  }, [])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
