/**
 * 🔐 CREW DASHBOARD - BRANCH STAFF INTERFACE 🛡️
 * 
 * This page provides comprehensive crew operations:
 * - Real-time order management for assigned branch
 * - Order status updates and preparation tracking
 * - Mobile-optimized interface with visible navigation
 * - Offline handling with graceful degradation
 * - Branch-specific order filtering
 * - Live data from Supabase with offline sync
 * 
 * ⚠️  WARNING: This is part of the crew dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /crew/dashboard route
 * 🎯  PURPOSE: Manage branch operations and orders
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  MapPin, 
  LogOut, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Bell,
  User,
  Clock,
  Filter,
  Search,
  QrCode,
  Eye
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DesignLock from '@/components/layout/DesignLock'
import { generateOrderQRCodeClient } from '@/lib/qr-generator-client'
// CrewMonitoringProvider removed - using unified system

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  pickup_time: string
  total_amount: number
  order_status: string
  payment_status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  cooking_started_at?: string
  ready_at?: string
  actual_pickup_time?: string
  order_items?: Array<{
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
}

interface CrewMember {
  id: string
  full_name: string
  branch_id: string
  branch_name: string
}

export default function CrewDashboard() {
  const [crewMember, setCrewMember] = useState<CrewMember | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showingCompletedOrders, setShowingCompletedOrders] = useState(false)
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([])
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([])
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'active' | 'history'>('active')
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [historyDateFilter, setHistoryDateFilter] = useState('today')
  // realtimeSubscription removed - using unified system
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authChecked) {
      checkAuth()
      loadOfflineData()
      
      // Safety timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('⏰ Auth timeout - forcing loading to false')
        setIsLoading(false)
        setAuthChecked(true)
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    }
  }, [authChecked])

  useEffect(() => {
    if (crewMember && crewMember.branch_id) {
      console.log('Crew member loaded, setting up orders and realtime')
      loadOrders()
      // Data refresh handled by unified system
      
      return () => {
        // Cleanup handled by unified system
      }
    }
  }, [crewMember])

  // Realtime cleanup handled by unified system

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, searchTerm])

  useEffect(() => {
    if (currentView === 'history' && crewMember?.branch_id) {
      loadOrderHistory()
    }
  }, [currentView, historyDateFilter, crewMember?.branch_id])

  // setupOnlineStatus removed - using unified system

  const loadOfflineData = () => {
    if (typeof window === 'undefined') return
    
    try {
      const savedOrders = localStorage.getItem('crew_offline_orders')
      const savedUpdates = localStorage.getItem('crew_pending_updates')
      
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders)
        setOfflineOrders(parsedOrders)
        console.log('📱 Loaded offline orders:', parsedOrders.length)
      }
      
      if (savedUpdates) {
        const parsedUpdates = JSON.parse(savedUpdates)
        setPendingUpdates(parsedUpdates)
        console.log('📱 Loaded pending updates:', parsedUpdates.length)
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  const saveOfflineData = () => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('crew_offline_orders', JSON.stringify(offlineOrders))
      localStorage.setItem('crew_pending_updates', JSON.stringify(pendingUpdates))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  const syncPendingUpdates = async () => {
    if (!isOnline || pendingUpdates.length === 0) return
    
    console.log('🔄 Syncing pending updates...')
    
    for (const update of pendingUpdates) {
      try {
        if (update.type === 'status_update') {
          await supabase
            .from('orders')
            .update({ order_status: update.newStatus })
            .eq('id', update.orderId)
        } else if (update.type === 'qr_code_update') {
          await supabase
            .from('orders')
            .update({ qr_code: update.qrCode })
            .eq('id', update.orderId)
        }
      } catch (error) {
        console.error('Failed to sync update:', error)
      }
    }
    
    setPendingUpdates([])
    localStorage.removeItem('crew_pending_updates')
    console.log('✅ Pending updates synced')
  }

  const checkAuth = async () => {
    try {
      console.log('🔍 Starting crew authentication check...')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/crew/login')
        return
      }

      console.log('✅ User found:', user.id)

      // Try multiple approaches to find the crew user
      let crewUser = null
      let crewError = null
      
      // Approach 1: Query by user_id
      try {
        const result1 = await supabase
          .from('admin_users')
          .select('role, branch_id, name')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()
        
        if (result1.data && result1.data.role === 'crew') {
          crewUser = result1.data
        } else {
          crewError = result1.error
        }
      } catch (error) {
        console.log('❌ Query by user_id failed:', error)
      }
      
      // Approach 2: Query by email if first approach failed
      if (!crewUser && user.email) {
        try {
          const result2 = await supabase
            .from('admin_users')
            .select('role, branch_id, name')
            .eq('email', user.email.toLowerCase().trim())
            .eq('is_active', true)
            .single()
          
          if (result2.data && result2.data.role === 'crew') {
            crewUser = result2.data
          } else {
            crewError = result2.error
          }
        } catch (error) {
          console.log('❌ Query by email failed:', error)
        }
      }

      if (crewError || !crewUser || crewUser.role !== 'crew') {
        console.error('❌ Invalid crew user or role:', crewError)
        
        // If it's an RLS error, don't sign out - just show error
        if (crewError && (crewError.code === 'PGRST116' || crewError.message?.includes('406'))) {
          console.log('⚠️ RLS policy error - user exists in auth but query blocked')
          setError('Authentication error. Please contact your administrator.')
          setIsLoading(false)
          setAuthChecked(true)
          return
        }
        
        await supabase.auth.signOut()
        router.push('/crew/login')
        return
      }

      console.log('✅ Crew user found:', crewUser.name, 'Role:', crewUser.role)

      if (crewUser.role !== 'crew' || !crewUser.branch_id) {
        console.log('❌ Invalid role or missing branch_id')
        await supabase.auth.signOut()
        router.push('/crew/login')
        return
      }

      console.log('🔍 Fetching branch data for branch_id:', crewUser.branch_id)
      
      // First test: Can we access branches table at all?
      console.log('🧪 Testing basic branches access...')
      const { data: allBranches, error: allBranchesError } = await supabase
        .from('branches')
        .select('id, name, is_active')
        .limit(5)
      
      console.log('All branches query result:', { allBranches, allBranchesError })
      
      if (allBranchesError) {
        console.error('❌ Cannot access branches table at all:', allBranchesError)
        console.log('This suggests an RLS policy issue')
        await supabase.auth.signOut()
        router.push('/crew/login')
        return
      }
      
      // Second test: Try to get the specific branch
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('name')
        .eq('id', crewUser.branch_id)
        .single()

      if (branchError || !branchData) {
        console.error('❌ Error fetching specific branch:', branchError)
        console.log('Branch error details:', branchError?.message, branchError?.code)
        console.log('Available branches:', allBranches)
        
        // Try to find the branch in the available branches
        const foundBranch = allBranches?.find(b => b.id === crewUser.branch_id)
        if (foundBranch) {
          console.log('✅ Found branch in available branches:', foundBranch)
          // Use the found branch data
          const crewData = {
            id: user.id,
            full_name: crewUser.name || user.email?.split('@')[0] || 'Crew Member',
            branch_id: crewUser.branch_id,
            branch_name: foundBranch.name
          }
          setCrewMember(crewData)
          setAuthChecked(true)
          return
        } else {
          console.log('❌ Branch not found in available branches')
          await supabase.auth.signOut()
          router.push('/crew/login')
          return
        }
      }

      console.log('✅ Branch found:', branchData.name)

      const crewData = {
        id: user.id,
        full_name: crewUser.name || user.email?.split('@')[0] || 'Crew Member',
        branch_id: crewUser.branch_id,
        branch_name: branchData?.name || 'Unknown Branch'
      }
      
      console.log('✅ Setting crew member data:', crewData)
      console.log('🔍 Crew member branch_id:', crewData.branch_id)
      console.log('🔍 Crew member branch_name:', crewData.branch_name)
      setCrewMember(crewData)
      setAuthChecked(true)
      setIsLoading(false) // Set loading to false on success
      console.log('✅ Authentication check completed successfully')
      
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      setIsLoading(false) // Set loading to false on error too
      router.push('/crew/login')
    } finally {
      setAuthChecked(true)
    }
  }

  const loadOrders = async () => {
    try {
      if (!crewMember?.branch_id) {
        console.log('❌ No crew member or branch_id, skipping order load')
        console.log('Crew member data:', crewMember)
        return
      }

      console.log('📋 Loading orders for branch:', crewMember.branch_id, 'Branch name:', crewMember.branch_name)
      setLastRefresh(new Date())

      // Test query to see if we can access orders at all
      console.log('🧪 Testing basic orders access...')
      const { data: testData, error: testError } = await supabase
        .from('orders')
        .select('id, order_number, branch_id')
        .limit(1)
      
      if (testError) {
        console.error('❌ Basic orders access failed:', testError)
      } else {
        console.log('✅ Basic orders access successful:', testData)
      }

      // Get ONLY active orders (not completed) - FIXED LOGIC
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          pickup_time,
          total_amount,
          subtotal,
          promo_discount,
          order_status,
          payment_status,
          qr_code,
          created_at,
          cooking_started_at,
          ready_at,
          actual_pickup_time,
          order_items(
            product_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .eq('branch_id', crewMember.branch_id)
        .neq('order_status', 'completed')
        .order('created_at', { ascending: false })

      // Reset completed orders flag - NO FALLBACK TO COMPLETED ORDERS
      setShowingCompletedOrders(false)
      console.log('✅ Loaded ACTIVE orders only:', data?.length || 0)

      if (error) {
        console.error('❌ Database error loading orders:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        throw error
      }
      
      console.log('✅ ACTIVE orders loaded successfully:', data?.length || 0)
      console.log('📊 Active order details:', data?.map(o => ({
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name,
        order_status: o.order_status,
        payment_status: o.payment_status
      })))
      
      // Update order count for active orders only
      setLastOrderCount(data?.length || 0)
      setOrders(data || [])
      
      // Load existing QR codes from database
      const existingQRCodes: Record<string, string> = {}
      data?.forEach(order => {
        if (order.qr_code) {
          existingQRCodes[order.id] = order.qr_code
        }
      })
      setQrCodes(existingQRCodes)
      
      // Save to offline storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('crew_offline_orders', JSON.stringify(data || []))
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
      // Use offline data if available
      if (offlineOrders.length > 0) {
        console.log('Using offline orders due to error')
        setOrders(offlineOrders)
      } else {
        setOrders([])
      }
    }
  }

  const loadOrderHistory = async () => {
    try {
      if (!crewMember?.branch_id) {
        console.log('No crew member or branch_id, skipping order history load')
        return
      }

      setHistoryLoading(true)
      console.log('Loading order history for branch:', crewMember.branch_id)

      // Calculate date range based on filter
      let startDate = new Date()
      let endDate = new Date()
      
      switch (historyDateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'all':
          startDate = new Date('2020-01-01') // Very old date to get all records
          break
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_phone,
          pickup_time,
          total_amount,
          subtotal,
          promo_discount,
          order_status,
          payment_status,
          qr_code,
          created_at,
          cooking_started_at,
          ready_at,
          actual_pickup_time,
          order_items(
            product_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .eq('branch_id', crewMember.branch_id)
        .eq('order_status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error loading order history:', error)
        throw error
      }
      
      console.log('Order history loaded successfully:', data?.length || 0)
      setOrderHistory(data || [])
    } catch (error) {
      console.error('Failed to load order history:', error)
      setOrderHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // setupRealtimeSubscription removed - using unified system

  // Show instant new order notification for crew
  // Show new order notification for crew (FULL NAME + AMOUNT)
  const showCrewOrderNotification = (order: any) => {
    console.log('🍖 Crew new order notification:', order)
    
    // Only run in browser environment
    if (typeof document === 'undefined') return
    
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-orange-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300'
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span class="text-lg">🍖</span>
        </div>
        <div>
          <div class="font-bold text-sm">New Order for Your Branch!</div>
          <div class="text-xs opacity-90">${order.customer_name} - ₱${order.total_amount?.toFixed(2) || '0.00'}</div>
          <div class="text-xs opacity-75">Order #${order.order_number}</div>
          <div class="text-xs opacity-75">Pickup: ${order.pickup_time}</div>
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

  // Show order status notification for crew
  const showCrewStatusNotification = (order: any) => {
    console.log('📝 Crew status notification:', order)
    
    // Only run in browser environment
    if (typeof document === 'undefined') return
    
    let statusMessage = ''
    let statusIcon = '📝'
    let bgColor = 'bg-blue-500'
    
    switch (order.order_status) {
      case 'confirmed':
        statusMessage = 'Order Confirmed!'
        statusIcon = '✅'
        bgColor = 'bg-green-500'
        break
      case 'preparing':
        statusMessage = 'Cooking Started!'
        statusIcon = '👨‍🍳'
        bgColor = 'bg-orange-500'
        break
      case 'ready':
        statusMessage = 'Ready for Pickup!'
        statusIcon = '🍴'
        bgColor = 'bg-green-600'
        break
      case 'completed':
        statusMessage = 'Order Completed!'
        statusIcon = '🎉'
        bgColor = 'bg-purple-500'
        break
      default:
        statusMessage = 'Order Updated!'
        statusIcon = '📝'
        bgColor = 'bg-blue-500'
    }
    
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300`
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

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    setIsRefreshing(true)
    try {
      await loadOrders()
    } finally {
      setIsRefreshing(false)
    }
  }

  const generateQRForOrder = async (order: Order) => {
    try {
      setGeneratingQR(order.id)
      console.log('🔍 Generating QR code for order:', order.order_number)
      
      const qrCodeDataURL = await generateOrderQRCodeClient(order.order_number, order.id)
      
      // Save QR code to database
      if (isOnline) {
        const { error } = await supabase
          .from('orders')
          .update({ qr_code: qrCodeDataURL })
          .eq('id', order.id)
        
        if (error) {
          console.error('❌ Failed to save QR code to database:', error)
          throw error
        }
        
        console.log('✅ QR code saved to database')
      } else {
        // Store for offline sync
        const update = {
          type: 'qr_code_update',
          orderId: order.id,
          qrCode: qrCodeDataURL,
          timestamp: new Date().toISOString()
        }
        
        setPendingUpdates(prev => [...prev, update])
        console.log('📱 QR code stored for offline sync')
      }
      
      setQrCodes(prev => ({
        ...prev,
        [order.id]: qrCodeDataURL
      }))
      
      console.log('✅ QR code generated and saved successfully')
    } catch (error) {
      console.error('❌ Failed to generate QR code:', error)
    } finally {
      setGeneratingQR(null)
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const closeOrderModal = () => {
    setShowOrderModal(false)
    setSelectedOrder(null)
  }

  const filterOrders = () => {
    let filtered = orders

    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' || statusFilter === 'confirmed') {
        // Show both pending and confirmed orders as "Ready to Cook" if they're paid
        filtered = filtered.filter(order => 
          (order.order_status === 'pending' || order.order_status === 'confirmed') && 
          order.payment_status === 'paid'
        )
      } else {
        filtered = filtered.filter(order => order.order_status === statusFilter)
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsSubmitting(true)

      // Prepare update data with timestamps
      const updateData: any = { order_status: newStatus }
      const now = new Date().toISOString()

      // Add specific timestamps based on status
      if (newStatus === 'preparing') {
        updateData.cooking_started_at = now
        console.log('🍳 Recording cooking start time:', now)
      } else if (newStatus === 'ready') {
        updateData.ready_at = now
        console.log('✅ Recording ready time:', now)
      } else if (newStatus === 'completed') {
        updateData.actual_pickup_time = now
        console.log('📦 Recording actual pickup time:', now)
      }

      if (isOnline) {
        // Online: Update directly to Supabase
        const { error } = await supabase
          .from('orders')
          .update(updateData)
          .eq('id', orderId)

        if (error) throw error

        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, ...updateData } : order
        ))

        // Log the action with timing info
        await supabase.from('system_logs').insert({
          log_type: 'order_status_update',
          order_id: orderId,
          user_id: crewMember?.id,
          message: `Order status updated to ${newStatus} by crew member at ${now}`,
          ip_address: '127.0.0.1'
        })

        console.log(`✅ Order ${orderId} updated to ${newStatus} with timestamps`)
      } else {
        // Offline: Store update for later sync
        const update = {
          type: 'status_update',
          orderId,
          newStatus,
          updateData,
          timestamp: now
        }
        
        setPendingUpdates(prev => [...prev, update])
        
        // Update local state immediately
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, ...updateData } : order
        ))
        
        console.log('📱 Offline update stored with timestamps:', update)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
      // End crew monitoring session before logout
      // crewMonitoring removed - using unified system
      
      await supabase.auth.signOut()
      router.push('/crew/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-lays-orange-gold'
      case 'confirmed': return 'bg-blue-500'
      case 'preparing': return 'bg-lays-orange-gold'
      case 'ready': return 'bg-green-500'
      case 'completed': return 'bg-lays-dark-red'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-lays-orange-gold'
      case 'paid': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesignLock pageName="Crew Dashboard" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!crewMember) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesignLock pageName="Crew Dashboard" />
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push('/crew/login')}
            className="bbq-button-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <DesignLock pageName="Crew Dashboard" />
      
      {/* Fixed Navigation Bar - Always Visible */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Brand & Branch */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-lays-dark-red rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔥</span>
                </div>
                <div>
                  <h1 className="font-bbq-display text-lg font-bold text-gray-900">
                    Crew Dashboard
                  </h1>
                  <p className="text-xs text-lays-dark-red">
                    {crewMember.branch_name}
                  </p>
                </div>
              </div>
            </div>
          
            {/* Center - Online Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">Online</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-orange-600">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
              {pendingUpdates.length > 0 && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">{pendingUpdates.length} pending</span>
                </div>
              )}
            </div>

            {/* Right Side - User & Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                title={`Refresh Orders${lastRefresh ? ` (Last: ${lastRefresh.toLocaleTimeString()})` : ''}`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  {crewMember.full_name}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - With Top Padding for Fixed Nav */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bbq-card p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-lays-orange-gold/10 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-lays-orange-gold" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>

            <div className="bbq-card p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ready to Cook</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => (o.order_status === 'confirmed' || o.order_status === 'pending') && o.payment_status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bbq-card p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-lays-orange-gold/10 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-lays-orange-gold" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cooking</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.order_status === 'preparing').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bbq-card p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ready for Pickup</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.order_status === 'ready').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bbq-card p-6 mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('active')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'active'
                    ? 'bg-white text-lays-dark-red shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Active Orders</span>
                  <span className="bg-lays-orange-gold text-white text-xs px-2 py-1 rounded-full">
                    {orders.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'history'
                    ? 'bg-white text-lays-dark-red shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Order History</span>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {orderHistory.length}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bbq-card p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders by customer name, phone, or order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bbq-input pl-10 w-full"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bbq-input"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Ready to Cook</option>
                  <option value="confirmed">Ready to Cook</option>
                  <option value="preparing">Cooking</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Filter for Order History */}
          {currentView === 'history' && (
            <div className="bbq-card p-6 mb-6">
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
                <select
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="bbq-input"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
                <button
                  onClick={() => loadOrderHistory()}
                  disabled={historyLoading}
                  className="bbq-button-primary text-sm px-4 py-2"
                >
                  {historyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="space-y-4">
            {currentView === 'active' ? (
              // Active Orders View
              filteredOrders.length === 0 ? (
                <div className="bbq-card p-8 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Orders</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No orders match your search criteria.' : 'No active orders for your branch.'}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div key={order.id} id={`order-${order.id}`} className="bbq-card p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.customer_name}
                            </h3>
                            <span className="px-2 py-1 bg-lays-dark-red text-white text-xs font-bold rounded">
                              #{order.order_number}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
                          <div className="space-y-1">
                            {order.order_items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span className="text-gray-900">
                                  {formatCurrency(item.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                      {/* Status Badges */}
                      <div className="flex items-center space-x-2 mb-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(order.order_status)}`}>
                          {order.order_status.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status.toUpperCase()}
                        </span>
                      </div>

                      {/* Timing Information */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">⏱️ Timing Details</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Order Placed:</span>
                            <span className="text-gray-900">{formatDateTime(order.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Scheduled Pickup:</span>
                            <span className="text-gray-900">{formatDateTime(order.pickup_time)}</span>
                          </div>
                          {order.cooking_started_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cooking Started:</span>
                              <span className="text-orange-600 font-medium">{formatDateTime(order.cooking_started_at)}</span>
                            </div>
                          )}
                          {order.ready_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Ready for Pickup:</span>
                              <span className="text-green-600 font-medium">{formatDateTime(order.ready_at)}</span>
                            </div>
                          )}
                          {order.actual_pickup_time && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Actually Picked Up:</span>
                              <span className="text-blue-600 font-medium">{formatDateTime(order.actual_pickup_time)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Timing Analysis */}
                        {order.ready_at && order.cooking_started_at && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Cooking Time:</span>
                              <span className="text-gray-900">
                                {Math.round((new Date(order.ready_at).getTime() - new Date(order.cooking_started_at).getTime()) / 60000)} min
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {order.actual_pickup_time && order.ready_at && (
                          <div className="mt-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Customer Wait Time:</span>
                              <span className={`font-medium ${
                                (new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000 > 15 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                {Math.round((new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000)} min
                                {(new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000 > 15 && ' (Late!)'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Action Buttons - Crew Workflow */}
                    <div className="flex flex-wrap gap-2">
                      {/* View Order Button */}
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="bbq-button-secondary text-sm px-4 py-2 flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Order</span>
                      </button>
                      {/* Start Cooking - Show for confirmed/paid orders that haven't started cooking yet */}
                      {(order.order_status === 'confirmed' || order.order_status === 'pending') && order.payment_status === 'paid' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          disabled={isSubmitting}
                          className="bbq-button-primary text-sm px-4 py-2"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Start Cooking
                        </button>
                      )}
                      
                      {/* Ready For Pickup - Show when order is being prepared */}
                      {order.order_status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          disabled={isSubmitting}
                          className="bbq-button-primary text-sm px-4 py-2"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ready For Pickup
                        </button>
                      )}
                      
                      {/* Complete Order - Show when order is ready for pickup */}
                      {order.order_status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          disabled={isSubmitting}
                          className="bbq-button-primary text-sm px-4 py-2"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Order
                        </button>
                      )}

                      {/* Show status if no action needed */}
                      {order.order_status === 'completed' && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Order Completed</span>
                        </div>
                      )}

                      {order.order_status === 'cancelled' && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Order Cancelled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            // Order History View
            historyLoading ? (
              <div className="bbq-card p-8 text-center">
                <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Order History...</h3>
                <p className="text-gray-600">Fetching completed orders from database</p>
              </div>
            ) : orderHistory.length === 0 ? (
              <div className="bbq-card p-8 text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Order History</h3>
                <p className="text-gray-600">
                  No completed orders found for the selected date range.
                </p>
              </div>
            ) : (
              orderHistory.map((order) => (
                <div key={order.id} className="bbq-card p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {order.customer_name}
                            </h3>
                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                              #{order.order_number}
                            </span>
                            <span className="px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded">
                              COMPLETED
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                          <p className="text-xs text-gray-500">
                            Completed: {formatDateTime(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(order.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
                          <div className="space-y-1">
                            {order.order_items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span className="text-gray-900">
                                  {formatCurrency(item.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                        {/* Status Badges */}
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-green-500">
                            COMPLETED
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status.toUpperCase()}
                          </span>
                        </div>

                        {/* Timing Summary for History */}
                        {(order.cooking_started_at || order.ready_at || order.actual_pickup_time) && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">⏱️ Order Timeline</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {order.cooking_started_at && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Cooking Started:</span>
                                  <span className="text-orange-600">{formatDateTime(order.cooking_started_at)}</span>
                                </div>
                              )}
                              {order.ready_at && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Ready for Pickup:</span>
                                  <span className="text-green-600">{formatDateTime(order.ready_at)}</span>
                                </div>
                              )}
                              {order.actual_pickup_time && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Actually Picked Up:</span>
                                  <span className="text-blue-600">{formatDateTime(order.actual_pickup_time)}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Performance Summary */}
                            {order.ready_at && order.cooking_started_at && order.actual_pickup_time && (
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">Cooking Time:</span>
                                  <span className="text-gray-900">
                                    {Math.round((new Date(order.ready_at).getTime() - new Date(order.cooking_started_at).getTime()) / 60000)} min
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">Customer Wait:</span>
                                  <span className={`font-medium ${
                                    (new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000 > 15 
                                      ? 'text-red-600' 
                                      : 'text-green-600'
                                  }`}>
                                    {Math.round((new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000)} min
                                    {(new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000 > 15 && ' (Late!)'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
          </div>

          {/* New Order Notification Modal */}
          {newOrderNotification && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-pulse">
                <div className="bg-lays-dark-red text-white p-6 rounded-t-2xl text-center">
                  <div className="text-6xl mb-4">🆕</div>
                  <h2 className="text-3xl font-bold mb-2">NEW ORDER!</h2>
                  <p className="text-lg opacity-90">Customer just placed an order</p>
                </div>

                <div className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {newOrderNotification.customer_name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-lays-dark-red text-white text-sm font-bold rounded-full">
                        #{newOrderNotification.order_number}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(newOrderNotification.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  {newOrderNotification.order_items && newOrderNotification.order_items.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Order Contains:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {newOrderNotification.order_items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.product_name}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                        {newOrderNotification.order_items.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{newOrderNotification.order_items.length - 3} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setNewOrderNotification(null)}
                      className="flex-1 bbq-button-primary"
                    >
                      Got It!
                    </button>
                    <button
                      onClick={() => {
                        setNewOrderNotification(null)
                        // Scroll to the order in the list
                        if (typeof document !== 'undefined') {
                          const orderElement = document.getElementById(`order-${newOrderNotification.id}`)
                          if (orderElement) {
                            orderElement.scrollIntoView({ behavior: 'smooth' })
                          }
                        }
                      }}
                      className="flex-1 bbq-button-secondary"
                    >
                      View Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Details Modal */}
          {showOrderModal && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-lays-dark-red rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                      <p className="text-sm text-gray-600">#{selectedOrder.order_number}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeOrderModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Order Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedOrder.order_status === 'completed' ? 'bg-green-500' :
                        selectedOrder.order_status === 'ready' ? 'bg-blue-500' :
                        selectedOrder.order_status === 'cooking' ? 'bg-orange-500' :
                        selectedOrder.order_status === 'preparing' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-lg font-semibold capitalize">{selectedOrder.order_status}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedOrder.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedOrder.payment_status}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                      <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                      <p><strong>Phone:</strong> {selectedOrder.customer_phone}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                      <p><strong>Total:</strong> ₱{selectedOrder.total_amount.toFixed(2)}</p>
                      <p><strong>Pickup Time:</strong> {new Date(selectedOrder.pickup_time).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.order_items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                          <span className="font-medium">{item.product_name}</span>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">{item.quantity}x ₱{item.unit_price.toFixed(2)}</div>
                            <div className="font-semibold">₱{(item.quantity * item.unit_price).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        <h4 className="text-lg font-semibold text-gray-800">Customer Verification QR Code</h4>
                      </div>
                    </div>
                    
                    {qrCodes[selectedOrder.id] ? (
                      <div className="text-center">
                        <div className="inline-block p-4 bg-white rounded-xl shadow-lg border-2 border-blue-200">
                          <img 
                            src={qrCodes[selectedOrder.id]} 
                            alt={`QR Code for ${selectedOrder.order_number}`}
                            className="w-64 h-64 mx-auto"
                          />
                        </div>
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            📱 Customer Instructions:
                          </p>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>• Open your phone camera</p>
                            <p>• Point camera at this QR code</p>
                            <p>• Tap the notification to verify order</p>
                            <p>• Or visit: <span className="font-mono bg-gray-100 px-2 py-1 rounded">/verify-order</span></p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <QrCode className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-gray-700 mb-4 font-medium">
                          Generate QR code for customer verification
                        </p>
                        <p className="text-sm text-gray-600 mb-6">
                          This QR code allows customers to verify their order status using their phone camera
                        </p>
                        <button
                          onClick={() => generateQRForOrder(selectedOrder)}
                          disabled={generatingQR === selectedOrder.id}
                          className="bbq-button-primary px-6 py-3 text-sm font-medium"
                        >
                          {generatingQR === selectedOrder.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating QR Code...
                            </>
                          ) : (
                            <>
                              <QrCode className="w-4 h-4 mr-2" />
                              Generate QR Code
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                  <button
                    onClick={closeOrderModal}
                    className="bbq-button-secondary px-6 py-2"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}