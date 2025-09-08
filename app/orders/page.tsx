'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Eye, MapPin, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DesignLock from '@/components/layout/DesignLock'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  subtotal: number
  product: {
    name: string
    image_url?: string
  }
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  branch_id: string
  pickup_time: string
  subtotal: number
  promo_discount?: number
  total_amount: number
  total_commission: number
  payment_method: string
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  gcash_reference?: string
  payment_screenshot_url?: string
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  estimated_ready_time?: string
  qr_code?: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
  branch?: {
    name: string
    address: string
    phone: string
  }
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadOrders()
    
    // Set up real-time subscription for order updates
    const userEmail = localStorage.getItem('customer_email')
    if (userEmail) {
      const subscription = supabase
        .channel('order-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `customer_email=eq.${userEmail}`
          },
          (payload) => {
            console.log('Order update received:', payload)
            loadOrders() // Reload orders when any order is updated
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      
      // Get current user's email and phone from localStorage or session
      const userEmail = localStorage.getItem('customer_email') || 'demo@example.com'
      const userPhone = localStorage.getItem('customer_phone') || ''
      
      // Query orders by either email or phone number
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              image_url
            )
          ),
          branch:branches (
            name,
            address,
            phone
          )
        `)
        .or(`customer_email.eq.${userEmail},customer_phone.eq.${userPhone}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        return
      }

      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'confirmed':
        return 'text-blue-600 bg-blue-100'
      case 'preparing':
        return 'text-orange-600 bg-orange-100'
      case 'ready':
        return 'text-green-600 bg-green-100'
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Payment'
      case 'confirmed':
        return 'Payment Confirmed'
      case 'preparing':
        return 'Preparing Your Order'
      case 'ready':
        return 'Ready for Pickup'
      case 'completed':
        return 'Order Completed'
      case 'cancelled':
        return 'Order Cancelled'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />
      case 'preparing':
        return <Package className="w-4 h-4" />
      case 'ready':
        return <CheckCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      case 'refunded':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Payment Pending'
      case 'paid':
        return 'Payment Verified'
      case 'cancelled':
        return 'Payment Cancelled'
      case 'refunded':
        return 'Payment Refunded'
      default:
        return status
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'paid':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      case 'refunded':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getOrderProgressSteps = (order: Order) => {
    const steps = [
      { label: 'Order Placed', completed: true, current: false },
      { label: 'Payment Verified', completed: order.payment_status === 'paid', current: order.payment_status === 'pending' },
      { label: 'Preparing', completed: order.order_status === 'preparing' || order.order_status === 'ready' || order.order_status === 'completed', current: order.order_status === 'preparing' },
      { label: 'Ready for Pickup', completed: order.order_status === 'ready' || order.order_status === 'completed', current: order.order_status === 'ready' },
      { label: 'Completed', completed: order.order_status === 'completed', current: false }
    ]

    // If order is cancelled, show cancelled status
    if (order.order_status === 'cancelled' || order.payment_status === 'cancelled') {
      return [
        { label: 'Order Placed', completed: true, current: false },
        { label: 'Cancelled', completed: true, current: true }
      ]
    }

    return steps
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesignLock pageName="Customer Orders Page" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Customer Orders Page" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/account" 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start exploring our delicious BBQ menu!</p>
            <Link 
              href="/"
              className="bbq-button-primary"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="space-y-2">
                      {/* Payment Status */}
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        {getPaymentStatusIcon(order.payment_status)}
                        <span>{getPaymentStatusText(order.payment_status)}</span>
                      </div>
                      
                      {/* Order Status */}
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                        {getStatusIcon(order.order_status)}
                        <span>{getStatusText(order.order_status)}</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      ₱{(order.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pickup Location</h4>
                    <p className="text-sm text-gray-600 flex items-start space-x-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                      <span>{order.branch?.name || 'Branch not found'}</span>
                    </p>
                    <p className="text-xs text-gray-500 ml-6">{order.branch?.address}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pickup Time</h4>
                    <p className="text-sm text-gray-600 flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(order.pickup_time)}</span>
                    </p>
                  </div>
                </div>

                {/* Order Progress */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Order Progress</h4>
                  <div className="flex items-center space-x-4">
                    {getOrderProgressSteps(order).map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.completed 
                            ? 'bg-green-500 text-white' 
                            : step.current 
                            ? 'bg-lays-orange-gold text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`text-sm ${
                          step.completed || step.current 
                            ? 'text-gray-900 font-medium' 
                            : 'text-gray-500'
                        }`}>
                          {step.label}
                        </span>
                        {index < getOrderProgressSteps(order).length - 1 && (
                          <div className={`w-8 h-0.5 ${
                            step.completed ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={() => viewOrderDetails(order)}
                    className="bbq-button-secondary flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowOrderDetails(false)}></div>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Order #{selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Order Status */}
              <div className="mb-6">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.order_status)}`}>
                  {getStatusIcon(selectedOrder.order_status)}
                  <span>{getStatusText(selectedOrder.order_status)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Placed on {formatDate(selectedOrder.created_at)}
                </p>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{item.product?.name}</h5>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₱{(item.subtotal || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">₱{(item.unit_price || 0).toLocaleString()} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">₱{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {selectedOrder.promo_discount && selectedOrder.promo_discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-green-600">-₱{(selectedOrder.promo_discount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">₱{(selectedOrder.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {(selectedOrder.payment_method === 'gcash' || selectedOrder.payment_method === 'bank_transfer') && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{selectedOrder.payment_method === 'gcash' ? 'GCash' : 'Bank Transfer'} Payment</h4>
                  {selectedOrder.gcash_reference && (
                    <p className="text-sm text-gray-600">
                      Reference: {selectedOrder.gcash_reference}
                    </p>
                  )}
                </div>
              )}

              {/* QR Code for Pickup */}
              {selectedOrder.payment_status === 'paid' && selectedOrder.qr_code && (
                <div className="mt-6 p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-green-900 mb-2">Pickup QR Code</h4>
                    <p className="text-sm text-green-700 mb-4">
                      Show this QR code when picking up your order
                    </p>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img 
                        src={selectedOrder.qr_code} 
                        alt="Pickup QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      Order #{selectedOrder.order_number}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Pending Message */}
              {selectedOrder.payment_status === 'pending' && (
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Payment Verification Pending</h4>
                      <p className="text-sm text-yellow-700">
                        Your payment is being verified by our admin team. You'll receive a QR code once verified.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
