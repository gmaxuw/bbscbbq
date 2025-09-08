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
  Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DesignLock from '@/components/layout/DesignLock'
import { generateOrderQRCodeClient } from '@/lib/qr-generator-client'

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
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([])
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([])
  const [newOrderNotification, setNewOrderNotification] = useState<Order | null>(null)
  const [lastOrderCount, setLastOrderCount] = useState(0)
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({})
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authChecked) {
    checkAuth()
    setupOnlineStatus()
      loadOfflineData()
    }
  }, [authChecked])

  useEffect(() => {
    if (crewMember && crewMember.branch_id) {
      console.log('Crew member loaded, setting up orders and realtime')
      loadOrders()
      setupRealtimeSubscription()
    }
  }, [crewMember])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, searchTerm])

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

      const { data: crewUser, error: crewError } = await supabase
        .from('admin_users')
        .select('role, branch_id, name')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (crewError || !crewUser || crewUser.role !== 'crew') {
        console.error('❌ Invalid crew user or role:', crewError)
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

      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('name')
        .eq('id', crewUser.branch_id)
        .single()

      if (branchError || !branchData) {
        console.error('❌ Error fetching branch:', branchError)
        await supabase.auth.signOut()
        router.push('/crew/login')
        return
      }

      console.log('✅ Branch found:', branchData.name)

      const crewData = {
        id: user.id,
        full_name: crewUser.name || user.email?.split('@')[0] || 'Crew Member',
        branch_id: crewUser.branch_id,
        branch_name: branchData?.name || 'Unknown Branch'
      }
      
      console.log('✅ Setting crew member data:', crewData)
      setCrewMember(crewData)
      setAuthChecked(true)
      console.log('✅ Authentication check completed successfully')
      
    } catch (error) {
      console.error('❌ Auth check failed:', error)
      router.push('/crew/login')
    } finally {
      setIsLoading(false)
      setAuthChecked(true)
    }
  }

  const loadOrders = async () => {
    try {
      if (!crewMember?.branch_id) {
        console.log('No crew member or branch_id, skipping order load')
        return
      }

      console.log('Loading orders for branch:', crewMember.branch_id)

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
          order_items(
            product_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .eq('branch_id', crewMember.branch_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error loading orders:', error)
        throw error
      }
      
      console.log('Orders loaded successfully:', data?.length || 0)
      
      // Check for new orders and show notification
      if (data && data.length > lastOrderCount && lastOrderCount > 0) {
        const newOrder = data[0] // Most recent order
        console.log('🆕 NEW ORDER DETECTED:', newOrder.customer_name)
        setNewOrderNotification(newOrder)
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
          setNewOrderNotification(null)
        }, 10000)
      }
      
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

  const setupRealtimeSubscription = () => {
    if (!crewMember?.branch_id) {
      console.log('No branch_id for realtime subscription')
      return
    }

    try {
      console.log('Setting up realtime subscription for branch:', crewMember.branch_id)

    const subscription = supabase
      .channel('crew_orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `branch_id=eq.${crewMember.branch_id}`
        },
          (payload) => {
            console.log('🔄 Order change detected:', payload.eventType)
            // Reload orders immediately on any change
            loadOrders()
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_items',
            filter: `order_id=in.(${orders.map(o => o.id).join(',')})`
          },
          (payload) => {
            console.log('🔄 Order items change detected:', payload.eventType)
            // Reload orders when order items change
            loadOrders()
        }
      )
      .subscribe()

    return () => {
        console.log('Unsubscribing from realtime updates')
      subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error)
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    await loadOrders()
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

  const filterOrders = () => {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter)
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

      if (isOnline) {
        // Online: Update directly to Supabase
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, order_status: newStatus } : order
      ))

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'order_status_update',
        order_id: orderId,
        user_id: crewMember?.id,
        message: `Order status updated to ${newStatus} by crew member`,
        ip_address: '127.0.0.1'
      })
      } else {
        // Offline: Store update for later sync
        const update = {
          type: 'status_update',
          orderId,
          newStatus,
          timestamp: new Date().toISOString()
        }
        
        setPendingUpdates(prev => [...prev, update])
        
        // Update local state immediately
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, order_status: newStatus } : order
        ))
        
        console.log('📱 Offline update stored:', update)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
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
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
                title="Refresh Orders"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bbq-card p-6">
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

            <div className="bbq-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.order_status === 'pending').length}
              </p>
            </div>
          </div>
            </div>

            <div className="bbq-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-lays-orange-gold/10 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-lays-orange-gold" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Preparing</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.order_status === 'preparing').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bbq-card p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ready</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter(o => o.order_status === 'ready').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bbq-card p-6 mb-6">
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
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
        </div>
            </div>
          </div>

      {/* Orders List */}
      <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bbq-card p-8 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'No orders match your search criteria.' : 'No orders available for your branch.'}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} id={`order-${order.id}`} className="bbq-card p-6">
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

                      {/* QR Code Section */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Order Verification</h4>
                          <span className="text-xs text-gray-500">#{order.order_number}</span>
                        </div>
                        
                        {qrCodes[order.id] ? (
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <img 
                                src={qrCodes[order.id]} 
                                alt={`QR Code for ${order.order_number}`}
                                className="w-20 h-20 border border-gray-200 rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 mb-1">
                                Scan this QR code to verify order ownership
                              </p>
                              <p className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                                {order.order_number}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-600 mb-3">
                              Generate QR code for customer verification
                            </p>
                            <button
                              onClick={() => generateQRForOrder(order)}
                              disabled={generatingQR === order.id}
                              className="bbq-button-primary text-sm px-4 py-2"
                            >
                              {generatingQR === order.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Search className="w-4 h-4 mr-2" />
                                  Generate QR Code
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {order.order_status === 'pending' && (
                        <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      disabled={isSubmitting}
                          className="bbq-button-primary text-sm px-4 py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Order
                        </button>
                  )}
                  
                  {order.order_status === 'confirmed' && (
                        <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      disabled={isSubmitting}
                          className="bbq-button-primary text-sm px-4 py-2"
                    >
                          <RefreshCw className="w-4 h-4 mr-2" />
                      Start Cooking
                        </button>
                  )}
                  
                  {order.order_status === 'preparing' && (
                        <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      disabled={isSubmitting}
                          className="bbq-button-primary text-sm px-4 py-2"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                          Mark Ready
                        </button>
                  )}
                  
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
                    </div>
                  </div>
                </div>
              ))
                  )}
                </div>
              </div>
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
                    const orderElement = document.getElementById(`order-${newOrderNotification.id}`)
                    if (orderElement) {
                      orderElement.scrollIntoView({ behavior: 'smooth' })
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
    </div>
  )
}