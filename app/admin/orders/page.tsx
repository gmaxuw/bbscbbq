/**
 * 🔐 ADMIN ORDER MANAGEMENT PAGE 🛡️
 * 
 * This page provides comprehensive order management:
 * - View all orders across all branches
 * - Payment verification with screenshot preview
 * - Order status updates (pending → confirmed → preparing → ready → completed)
 * - Real-time order updates
 * - Order filtering and search
 * - Order details with customer information
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/orders route
 * 🎯  PURPOSE: Central order management for all business operations
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AdminLayout from '@/components/admin/AdminLayout'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  branch_id: string
  pickup_time: string
  subtotal: number
  total_amount: number
  total_commission: number
  promo_code?: string
  promo_discount?: number
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  payment_method?: string
  gcash_reference?: string
  payment_screenshot_url?: string
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  estimated_ready_time?: string
  qr_code?: string
  created_at: string
  updated_at: string
  branch?: {
    name: string
    address: string
  }
  order_items?: Array<{
    id: string
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
    unit_commission: number
    subtotal: number
    product?: {
      name: string
    }
  }>
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, paymentFilter])

  const checkAuth = async () => {
    try {
      console.log('🔐 Checking authentication...')
      
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 Current user:', user?.email)
      
      if (!user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/admin/login')
        return
      }

      // Check user role from auth.users metadata
      const userRole = user.user_metadata?.role
      const userName = user.user_metadata?.full_name || user.email

      console.log('👤 User data:', { userRole, userName })

      if (!userRole || !['admin', 'crew'].includes(userRole)) {
        console.log('❌ User not authorized, redirecting to login')
        await supabase.auth.signOut()
        router.push('/admin/login')
        return
      }

      console.log('✅ Admin/Crew authenticated successfully')
      setUser({ role: userRole, full_name: userName })
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      
      console.log('🔄 Loading orders...')
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          branch:branches(name, address),
          order_items(
            *,
            product:products(name)
          )
        `)
        .order('created_at', { ascending: false })

      console.log('📊 Orders query result:', { data, error })

      if (error) {
        console.error('❌ Orders query error:', error)
        throw error
      }

      console.log('✅ Orders loaded successfully:', data?.length || 0, 'orders')
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter)
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentFilter)
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Update local state - reload from database to avoid type issues
      await loadOrders()

      // Close modal if open
      setShowOrderModal(false)
      setSelectedOrder(null)

      console.log(`Order ${orderId} status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const verifyPayment = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          order_status: 'confirmed', // Auto-confirm order when payment is verified
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, payment_status: 'paid', order_status: 'confirmed', updated_at: new Date().toISOString() }
          : order
      ))

      // Update selected order if it's the one being verified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          payment_status: 'paid',
          order_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
      }

      console.log(`✅ GCash payment verified for order ${orderId}`)
    } catch (error) {
      console.error('❌ Failed to verify payment:', error)
      alert('Failed to verify payment. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'preparing': return <AlertCircle className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <AdminLayout 
        currentPage="orders" 
        userName={user?.full_name || 'Admin'}
        pageTitle="Loading Orders..."
      >
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout 
      currentPage="orders" 
      userName={user?.full_name || 'Admin'}
      pageTitle="Order Management"
      pageDescription="Manage all orders, verify payments, and update order statuses across all branches."
    >
      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, phone, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.order_number || order.id.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.pickup_time).toLocaleString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_phone}
                      </div>
                      {order.customer_email && (
                        <div className="text-sm text-gray-500">
                          {order.customer_email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.branch?.name || 'Unknown Branch'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        ₱{(order.total_amount || 0).toLocaleString()}
                      </div>
                      {order.promo_code && (
                        <div className="text-sm text-gray-500">
                          Promo: {order.promo_code}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                      <div className="text-xs text-gray-500">
                        {order.payment_method === 'gcash' ? 'GCash' : order.payment_method}
                      </div>
                      {order.gcash_reference && (
                        <div className="text-xs text-gray-500 font-mono">
                          Ref: {order.gcash_reference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                      {getStatusIcon(order.order_status)}
                      <span className="ml-1">{order.order_status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderModal(true)
                        }}
                        className="text-lays-orange-gold hover:text-lays-dark-red"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.payment_status === 'pending' && (
                        <button
                          onClick={() => verifyPayment(order.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Verify Payment"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {orders.length === 0 ? 'No orders found' : 'No orders match your filters'}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - #{selectedOrder.id.slice(-8)}
                </h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Name:</span>
                      <span>{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                    {selectedOrder.customer_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedOrder.customer_email}</span>
                      </div>
                    )}
                  </div>

                  <h4 className="text-md font-semibold text-gray-900">Order Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Pickup: {new Date(selectedOrder.pickup_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedOrder.branch?.name || 'Unknown Branch'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Total: ₱{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                    </div>
                    {selectedOrder.promo_code && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Promo:</span>
                        <span>{selectedOrder.promo_code} (-₱{selectedOrder.promo_discount || 0})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-900">Order Items</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.quantity} × ₱{item.unit_price}
                          </div>
                        </div>
                        <div className="font-medium">
                          ₱{(item.subtotal || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* GCash Payment Details */}
                  {selectedOrder.payment_method === 'gcash' && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">GCash Payment Details</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        {selectedOrder.gcash_reference && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-blue-800">GCash Reference Number:</span>
                            </div>
                            <div className="bg-white border-2 border-blue-300 rounded-lg p-3">
                              <span className="font-mono text-2xl font-bold text-blue-900 tracking-wider">
                                {selectedOrder.gcash_reference}
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 mt-2">
                              📱 <strong>Compare this number with your GCash app</strong>
                            </p>
                          </div>
                        )}
                        
                        {selectedOrder.payment_screenshot_url && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-gray-700">GCash Payment Screenshot:</span>
                              <button
                                onClick={() => window.open(selectedOrder.payment_screenshot_url, '_blank')}
                                className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center space-x-1"
                              >
                                <span>Open in New Tab</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                              <img
                                src={selectedOrder.payment_screenshot_url}
                                alt="GCash Payment Screenshot"
                                className="w-full max-w-2xl h-auto rounded-lg cursor-pointer hover:shadow-lg transition-shadow mx-auto block"
                                onClick={() => window.open(selectedOrder.payment_screenshot_url, '_blank')}
                              />
                            </div>
                            <div className="mt-2 text-center">
                              <p className="text-sm text-gray-600">
                                💡 <strong>Tip:</strong> Click the image to open full size, then compare with your GCash app
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {selectedOrder.payment_status === 'pending' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                              <span className="text-yellow-800 font-medium">Manual Verification Checklist</span>
                            </div>
                            <div className="space-y-2 text-sm text-yellow-700">
                              <div className="flex items-center space-x-2">
                                <span className="w-4 h-4 bg-yellow-200 rounded-full flex items-center justify-center text-xs">1</span>
                                <span>Check reference number matches your GCash app</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-4 h-4 bg-yellow-200 rounded-full flex items-center justify-center text-xs">2</span>
                                <span>Verify payment amount matches order total: <strong>₱{(selectedOrder.total_amount || 0).toLocaleString()}</strong></span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="w-4 h-4 bg-yellow-200 rounded-full flex items-center justify-center text-xs">3</span>
                                <span>Confirm payment screenshot is legitimate</span>
                              </div>
                            </div>
                            <div className="mt-3 p-2 bg-yellow-100 rounded border border-yellow-300">
                              <p className="text-xs text-yellow-800">
                                💡 <strong>Tip:</strong> Open the screenshot in a new tab for easier comparison with your phone
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-2">
                  {selectedOrder.payment_status === 'pending' && (
                    <button
                      onClick={() => verifyPayment(selectedOrder.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      title="Verify GCash payment after checking reference number and screenshot"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify GCash Payment</span>
                    </button>
                  )}
                  {selectedOrder.payment_status === 'paid' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Payment Verified</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {selectedOrder.order_status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Preparing
                    </button>
                  )}
                  {selectedOrder.order_status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {selectedOrder.order_status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}