'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Package, ChefHat } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'
import { validateReferenceNumber } from '@/lib/qr-generator'

interface Order {
  id: string
  reference_number: string
  customer_name: string
  customer_phone: string
  pickup_time: string
  cooking_start_time: string
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  branch_id: string
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    product: {
      name: string
    }
  }>
  branch: {
    name: string
    address: string
  }
}

export default function VerifyOrderPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) {
      fetchOrder(ref)
    } else {
      setError('No reference number provided')
      setIsLoading(false)
    }
  }, [searchParams])

  const fetchOrder = async (referenceNumber: string) => {
    try {
      setIsLoading(true)
      
      if (!validateReferenceNumber(referenceNumber)) {
        setError('Invalid reference number format')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            product:products (
              name
            )
          ),
          branch:branches (
            name,
            address
          )
        `)
        .eq('order_number', referenceNumber.toUpperCase())
        .single()

      if (error) {
        console.error('Error fetching order:', error)
        setError('Order not found')
      } else {
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to fetch order details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cooking': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />
      case 'preparing': return <Package className="w-5 h-5" />
      case 'cooking': return <ChefHat className="w-5 h-5" />
      case 'ready': return <CheckCircle className="w-5 h-5" />
      case 'completed': return <CheckCircle className="w-5 h-5" />
      default: return <Clock className="w-5 h-5" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Your order is being processed'
      case 'preparing': return 'We are preparing your order'
      case 'cooking': return 'Your BBQ is being cooked fresh'
      case 'ready': return 'Your order is ready for pickup!'
      case 'completed': return 'Order completed'
      default: return 'Order status unknown'
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Order Verification" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying order...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Order Verification" />
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="bbq-button-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Order Verification" />
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">The order reference number is invalid or the order doesn't exist.</p>
            <button
              onClick={() => window.history.back()}
              className="bbq-button-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Order Verification" />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-lays-orange-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Verified</h1>
            <p className="text-gray-600">Reference: {order.reference_number}</p>
          </div>

          {/* Status */}
          <div className={`border-2 rounded-lg p-4 mb-6 ${getStatusColor(order.status)}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <div>
                <h3 className="font-semibold capitalize">{order.status}</h3>
                <p className="text-sm opacity-75">{getStatusMessage(order.status)}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p><strong>Name:</strong> {order.customer_name}</p>
                <p><strong>Phone:</strong> {order.customer_phone}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Pickup Information</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p><strong>Branch:</strong> {order.branch.name}</p>
                <p><strong>Address:</strong> {order.branch.address}</p>
                <p><strong>Pickup Time:</strong> {formatTime(order.pickup_time)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between py-1">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>₱{(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>₱{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Payment Status</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p><strong>Method:</strong> {order.payment_method}</p>
                <p><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Message */}
          {order.status === 'ready' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Your order is ready! Please proceed to the counter to claim your BBQ.
                </p>
              </div>
            </div>
          )}

          {order.status !== 'ready' && order.status !== 'completed' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800">
                  Your order is still being prepared. We'll notify you when it's ready for pickup.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
