/**
 * 🔐 CREW DASHBOARD - BRANCH STAFF INTERFACE 🛡️
 * 
 * This page provides comprehensive crew operations:
 * - Real-time order management for assigned branch
 * - Order status updates and preparation tracking
 * - Clock in/out functionality
 * - Mobile-optimized interface
 * - Offline handling with graceful degradation
 * - Branch-specific order filtering
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
  Clock, 
  MapPin, 
  LogOut, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Bell,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PageTemplate, { PageHeading, PageCard, PageButton } from '@/components/templates/PageTemplate'

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  pickup_time: string
  total_amount: number
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  order_items?: Array<{
    product_name: string
    quantity: number
    price: number
  }>
}

interface CrewMember {
  id: string
  full_name: string
  branch_id: string
  branch_name: string
}

interface AttendanceRecord {
  id: string
  clock_in: string
  clock_out?: string
  total_hours?: number
}

export default function CrewDashboard() {
  const [crewMember, setCrewMember] = useState<CrewMember | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showClockOut, setShowClockOut] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    setupOnlineStatus()
  }, [])

  useEffect(() => {
    if (crewMember) {
      loadOrders()
      loadAttendance()
      setupRealtimeSubscription()
    }
  }, [crewMember])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter])

  const setupOnlineStatus = () => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/crew/login')
        return
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          branch_id,
          branches(name)
        `)
        .eq('id', user.id)
        .eq('role', 'crew')
        .eq('is_active', true)
        .single()

      if (error || !userData) {
        await supabase.auth.signOut()
        router.push('/crew/login')
        return
      }

      setCrewMember({
        id: userData.id,
        full_name: userData.full_name,
        branch_id: userData.branch_id,
        branch_name: userData.branches?.name || 'Unknown Branch'
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/crew/login')
    }
  }

  const loadOrders = async () => {
    try {
      if (!crewMember?.branch_id) return

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            product_name,
            quantity,
            price
          )
        `)
        .eq('branch_id', crewMember.branch_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAttendance = async () => {
    try {
      if (!crewMember?.id) return

      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('crew_attendance')
        .select('*')
        .eq('user_id', crewMember.id)
        .eq('date', today)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      setAttendance(data || null)
    } catch (error) {
      console.error('Failed to load attendance:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!crewMember?.branch_id) return

    const subscription = supabase
      .channel('crew_orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `branch_id=eq.${crewMember.branch_id}`
        },
        () => {
          loadOrders() // Reload orders on any change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const filterOrders = () => {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter)
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setIsSubmitting(true)

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
    } catch (error) {
      console.error('Failed to update order status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClockIn = async () => {
    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('crew_attendance')
        .insert({
          user_id: crewMember!.id,
          branch_id: crewMember!.branch_id,
          date: new Date().toISOString().split('T')[0],
          clock_in: new Date().toISOString()
        })

      if (error) throw error

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'crew_clock_in',
        user_id: crewMember!.id,
        message: `Crew member clocked in at ${crewMember!.branch_name}`,
        ip_address: '127.0.0.1'
      })

      loadAttendance()
    } catch (error) {
      console.error('Failed to clock in:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClockOut = async () => {
    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('crew_attendance')
        .update({
          clock_out: new Date().toISOString()
        })
        .eq('id', attendance!.id)

      if (error) throw error

      // Log the action
      await supabase.from('system_logs').insert({
        log_type: 'crew_clock_out',
        user_id: crewMember!.id,
        message: `Crew member clocked out at ${crewMember!.branch_name}`,
        ip_address: '127.0.0.1'
      })

      loadAttendance()
      setShowClockOut(false)
    } catch (error) {
      console.error('Failed to clock out:', error)
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

  const calculateHours = (clockIn: string, clockOut?: string) => {
    if (!clockOut) return 'Active'
    const start = new Date(clockIn)
    const end = new Date(clockOut)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    return `${hours.toFixed(2)}h`
  }

  if (isLoading) {
    return (
      <PageTemplate pageName="Crew Dashboard">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </PageTemplate>
    )
  }

  if (!crewMember) {
    return (
      <PageTemplate pageName="Crew Dashboard">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this dashboard.</p>
        </div>
      </PageTemplate>
    )
  }

  const pendingOrders = orders.filter(o => o.order_status === 'pending').length
  const preparingOrders = orders.filter(o => o.order_status === 'preparing').length
  const readyOrders = orders.filter(o => o.order_status === 'ready').length

  return (
    <PageTemplate pageName="Crew Dashboard">
      {/* Header with Status */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <PageHeading 
              title={`Welcome, ${crewMember.full_name}`}
              subtitle={crewMember.branch_name}
            />
          </div>
          
          {/* Online Status & Actions */}
          <div className="flex items-center space-x-3">
            {/* Online Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Clock In/Out Button */}
            {!attendance ? (
              <PageButton
                variant="primary"
                onClick={handleClockIn}
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Clock In</span>
              </PageButton>
            ) : !attendance.clock_out ? (
              <PageButton
                variant="secondary"
                onClick={() => setShowClockOut(true)}
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Clock Out</span>
              </PageButton>
            ) : (
              <div className="text-sm text-gray-600">
                Clocked out: {calculateHours(attendance.clock_in, attendance.clock_out)}
              </div>
            )}

            {/* Sign Out Button */}
            <PageButton
              variant="secondary"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </PageButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <PageCard className="text-center">
            <h3 className="text-2xl font-bold text-lays-orange-gold">{pendingOrders}</h3>
            <p className="text-gray-600">Pending Orders</p>
          </PageCard>
          <PageCard className="text-center">
            <h3 className="text-2xl font-bold text-lays-dark-red">{preparingOrders}</h3>
            <p className="text-gray-600">Preparing</p>
          </PageCard>
          <PageCard className="text-center">
            <h3 className="text-2xl font-bold text-green-600">{readyOrders}</h3>
            <p className="text-gray-600">Ready for Pickup</p>
          </PageCard>
          <PageCard className="text-center">
            <h3 className="text-2xl font-bold text-gray-600">{orders.length}</h3>
            <p className="text-gray-600">Total Orders</p>
          </PageCard>
        </div>
      </div>

      {/* Order Status Filter */}
      <PageCard className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-lays-dark-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-lays-orange-gold text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingOrders})
          </button>
          <button
            onClick={() => setStatusFilter('preparing')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'preparing'
                ? 'bg-lays-dark-red text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Preparing ({preparingOrders})
          </button>
          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'ready'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Ready ({readyOrders})
          </button>
        </div>
      </PageCard>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <PageCard key={order.id} className="hover:shadow-lg transition-shadow duration-200">
            <div className="space-y-4">
              {/* Order Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{order.customer_name}</h3>
                  <p className="text-sm text-gray-600">{order.customer_phone}</p>
                  <p className="text-sm text-gray-500">Pickup: {formatDateTime(order.pickup_time)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">{formatCurrency(order.total_amount)}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(order.order_status)}`}>
                      {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.order_items && order.order_items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Order Items:</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Actions */}
              <div className="border-t pt-4">
                <div className="flex flex-wrap gap-2">
                  {order.order_status === 'pending' && (
                    <PageButton
                      variant="primary"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Order
                    </PageButton>
                  )}
                  
                  {order.order_status === 'confirmed' && (
                    <PageButton
                      variant="primary"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      disabled={isSubmitting}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Start Preparing
                    </PageButton>
                  )}
                  
                  {order.order_status === 'preparing' && (
                    <PageButton
                      variant="primary"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Ready
                    </PageButton>
                  )}
                  
                  {order.order_status === 'ready' && (
                    <PageButton
                      variant="primary"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Order
                    </PageButton>
                  )}
                  
                  {['pending', 'confirmed', 'preparing'].includes(order.order_status) && (
                    <PageButton
                      variant="secondary"
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      disabled={isSubmitting}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Order
                    </PageButton>
                  )}
                </div>
              </div>
            </div>
          </PageCard>
        ))}
      </div>

      {/* No Orders Message */}
      {filteredOrders.length === 0 && (
        <PageCard className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' 
              ? `No orders with status "${statusFilter}" found.` 
              : 'No orders have been placed yet.'
            }
          </p>
        </PageCard>
      )}

      {/* Clock Out Confirmation Modal */}
      {showClockOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <PageCard className="max-w-md w-full">
            <div className="text-center">
              <Clock className="w-16 h-16 text-lays-orange-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Clock Out</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clock out? This will record your end time for today.
              </p>
              <div className="flex space-x-3">
                <PageButton
                  variant="primary"
                  onClick={handleClockOut}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Processing...' : 'Yes, Clock Out'}
                </PageButton>
                <PageButton
                  variant="secondary"
                  onClick={() => setShowClockOut(false)}
                  className="flex-1"
                >
                  Cancel
                </PageButton>
              </div>
            </div>
          </PageCard>
        </div>
      )}
    </PageTemplate>
  )
}
