'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, MapPin, Phone, Receipt, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      // In a real app, you'd fetch order details from the database
      // For now, we'll simulate the order details
      setTimeout(() => {
        setOrderDetails({
          id: orderId,
          customer_name: 'John Doe', // This would come from the order
          customer_phone: '+63 912 345 6789',
          total_amount: 450.00,
          order_status: 'pending',
          estimated_ready_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          items: [
            { name: 'BBQ Pork Belly', quantity: 2, price: 150.00 },
            { name: 'BBQ Chicken', quantity: 1, price: 150.00 }
          ]
        })
        setIsLoading(false)
      }, 1000)
    }
  }, [orderId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-lays-orange-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Your order has been successfully placed</p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
            <span className="text-sm text-gray-500">#{orderDetails.id}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium text-gray-900">{orderDetails.customer_name}</p>
                <p className="text-sm text-gray-600">{orderDetails.customer_phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Estimated Ready Time</p>
                <p className="font-medium text-gray-900">
                  {orderDetails.estimated_ready_time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {orderDetails.estimated_ready_time.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Pickup Location</p>
                <p className="font-medium text-gray-900">Main Branch - Downtown</p>
                <p className="text-sm text-gray-600">123 Main Street, Surigao City</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
          
          <div className="space-y-3">
            {orderDetails.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">₱{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <span>Total</span>
              <span>₱{orderDetails.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Payment Information</h3>
          <p className="text-blue-800 mb-2">
            Payment will be collected upon pickup. Please bring exact change or prepare your preferred payment method.
          </p>
          <div className="text-sm text-blue-700">
            <p>• Cash payments are accepted</p>
            <p>• GCash payments are welcome</p>
            <p>• Credit/Debit cards are accepted</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">What's Next?</h3>
          <div className="text-yellow-800 space-y-2">
            <p>1. You will receive a confirmation SMS shortly</p>
            <p>2. We'll start preparing your order</p>
            <p>3. We'll notify you when your order is ready for pickup</p>
            <p>4. Please arrive at the estimated time to pick up your order</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Link
            href="/"
            className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 px-4 py-3 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors flex items-center justify-center space-x-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  )
}

