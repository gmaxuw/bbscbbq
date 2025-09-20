'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, MapPin, Phone, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DesignLock from '@/components/layout/DesignLock'

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
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
  delivery_address: string
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  total_amount: number
  payment_method: string
  gcash_reference?: string
  payment_screenshot?: string
  created_at: string
  estimated_ready_time: string
  pickup_time: string
  cooking_started_at?: string
  ready_at?: string
  actual_pickup_time?: string
  order_items: OrderItem[]
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [realtimeSubscription, setRealtimeSubscription] = useState<any>(null)

  const supabase = createClient()

  // Get order number from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const orderNum = urlParams.get('order')
    if (orderNum) {
      setOrderNumber(orderNum)
      loadOrder(orderNum)
      setupRealtimeSubscription(orderNum)
    }
    
    // Cleanup on unmount
    return () => {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription)
      }
    }
  }, [])

  // Set up real-time subscription for order tracking
  const setupRealtimeSubscription = (orderNum: string) => {
    try {
      console.log('🔄 Setting up track-order real-time subscription for:', orderNum)

      const subscription = supabase
        .channel('track_order_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `order_number=eq.${orderNum}`
          },
          (payload) => {
            console.log('🔄 Track order change detected:', payload.eventType, payload.new)
            
            // Refresh order data
            console.log('📱 Track order update detected, refreshing data...')
            loadOrder(orderNum)
          }
        )
        .subscribe((status) => {
          console.log('📡 Track order real-time subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Track order real-time subscription active')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Track order real-time subscription error')
          }
        })

      setRealtimeSubscription(subscription)
      return subscription
    } catch (error) {
      console.error('Failed to setup track order real-time subscription:', error)
    }
  }

  const loadOrder = async (orderNum: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      const { data, error: queryError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            product:products (
              name,
              image_url
            )
          )
        `)
        .eq('order_number', orderNum)
        .single()

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setError('Order not found. Please check your order number.')
        } else {
          setError('Error loading order. Please try again.')
        }
        return
      }

      setOrder(data)
    } catch (error) {
      console.error('Error loading order:', error)
      setError('Error loading order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (orderNumber.trim()) {
      loadOrder(orderNumber.trim())
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'preparing':
        return 'text-blue-600 bg-blue-100'
      case 'ready':
        return 'text-green-600 bg-green-100'
      case 'delivered':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'preparing':
        return <Package className="w-4 h-4" />
      case 'ready':
        return <CheckCircle className="w-4 h-4" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
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

  const generateQRCode = (orderNum: string, customerName: string) => {
    const qrData = `${orderNum}|${customerName}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Track Order Page" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {!order ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Your Order Number</h2>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Number
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="bbq-input w-full"
                    placeholder="e.g., 20240115-001"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bbq-button-primary w-full flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Track Order</span>
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Status Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{order.order_number}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 mt-2">
                    ₱{(order.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center mb-6">
                <div className="inline-block border-2 border-gray-200 rounded-lg p-4 bg-white">
                  <img 
                    src={generateQRCode(order.order_number, order.customer_name)} 
                    alt="Order QR Code" 
                    className="w-32 h-32 mx-auto"
                  />
                  <p className="text-sm text-gray-600 mt-2">Show this QR code when claiming</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {order.customer_name}</p>
                    <p><strong>Phone:</strong> {order.customer_phone}</p>
                    <p><strong>Email:</strong> {order.customer_email}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Payment:</strong> {order.payment_method.toUpperCase()}</p>
                    <p><strong>Scheduled Pickup:</strong> {formatDate(order.pickup_time)}</p>
                    {order.estimated_ready_time && (
                      <p><strong>Estimated Ready:</strong> {formatDate(order.estimated_ready_time)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup Timing Information */}
              {(order.cooking_started_at || order.ready_at || order.actual_pickup_time) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-lays-dark-red" />
                    <span>Pickup Timeline</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-gray-600 mb-1">Order Placed</div>
                      <div className="font-medium text-gray-900">{formatDate(order.created_at)}</div>
                    </div>
                    
                    {order.cooking_started_at && (
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-orange-600 mb-1">Cooking Started</div>
                        <div className="font-medium text-orange-800">{formatDate(order.cooking_started_at)}</div>
                      </div>
                    )}
                    
                    {order.ready_at && (
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-600 mb-1">Ready for Pickup</div>
                        <div className="font-medium text-green-800">{formatDate(order.ready_at)}</div>
                      </div>
                    )}
                    
                    {order.actual_pickup_time && (
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-blue-600 mb-1">Actually Picked Up</div>
                        <div className="font-medium text-blue-800">{formatDate(order.actual_pickup_time)}</div>
                      </div>
                    )}
                  </div>

                  {/* Timing Analysis for Customer */}
                  {order.ready_at && order.actual_pickup_time && (
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-2">Your Pickup Details</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Food was ready at:</span>
                          <span className="font-medium text-green-600">{formatDate(order.ready_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">You picked up at:</span>
                          <span className="font-medium text-blue-600">{formatDate(order.actual_pickup_time)}</span>
                        </div>
                        <div className="flex justify-between col-span-full pt-2 border-t">
                          <span className="text-gray-600">Your wait time:</span>
                          <span className={`font-medium ${
                            (new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000 > 15 
                              ? 'text-red-600' 
                              : 'text-green-600'
                          }`}>
                            {Math.round((new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000)} minutes
                            {(new Date(order.actual_pickup_time).getTime() - new Date(order.ready_at).getTime()) / 60000 > 15 && ' (You were late!)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.order_items?.map((item) => (
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
                      <h4 className="font-medium text-gray-900">{item.product?.name}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₱{(item.total_price || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">₱{(item.unit_price || 0).toLocaleString()} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="text-center">
              <Link 
                href="/"
                className="bbq-button-primary"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
