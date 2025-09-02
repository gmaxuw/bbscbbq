'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, MapPin, Phone, User, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase'

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: 'cash',
    gcashReference: '',
    paymentScreenshot: null as File | null
  })
  const { items, getTotalPrice, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  // Wait for cart to load from localStorage before checking if empty
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCartLoaded(true)
    }, 100) // Give cart context time to load from localStorage

    return () => clearTimeout(timer)
  }, [])

  // Redirect to cart if empty (but only after cart is loaded)
  useEffect(() => {
    if (isCartLoaded && items.length === 0 && !orderComplete) {
      router.push('/cart')
    }
  }, [items, orderComplete, isCartLoaded, router])

  const subtotal = getTotalPrice()
  const tax = subtotal * 0.12
  const total = subtotal + tax

  // Show loading while cart is being loaded
  if (!isCartLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Checkout Page" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    try {
      // Validate GCash payment details if GCash is selected
      if (customerInfo.paymentMethod === 'gcash') {
        if (!customerInfo.paymentScreenshot) {
          alert('Please upload your GCash payment screenshot')
          setIsProcessing(false)
          return
        }
        if (!customerInfo.gcashReference.trim()) {
          alert('Please enter your GCash reference number')
          setIsProcessing(false)
          return
        }
      }

      // Get the first branch (you can modify this logic later)
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .limit(1)

      if (!branches || branches.length === 0) {
        throw new Error('No active branches found')
      }

      const branchId = branches[0].id

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerInfo.fullName,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          delivery_address: customerInfo.address,
          branch_id: branchId,
          total_amount: total,
          payment_method: customerInfo.paymentMethod,
          payment_status: customerInfo.paymentMethod === 'cash' ? 'pending' : 'paid',
          gcash_reference: customerInfo.paymentMethod === 'gcash' ? customerInfo.gcashReference : null,
          status: 'pending',
          estimated_ready_time: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw itemsError
      }

      // Store customer email for order history lookup
      localStorage.setItem('customer_email', customerInfo.email)

      // Send confirmation email with QR code
      try {
        const { data: orderWithItems } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              product:products (
                name
              )
            )
          `)
          .eq('id', order.id)
          .single()

        // Call Edge Function to send confirmation email
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-order-confirmation', {
          body: { orderData: orderWithItems }
        })

        if (emailError) {
          console.error('Email sending failed:', emailError)
          // Don't fail the order if email fails
        } else {
          console.log('Email sent successfully:', emailResult)
          // Store order details for display
          setOrderNumber(order.order_number || 'N/A')
          setQrCodeUrl(emailResult?.qrCodeUrl || '')
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail the order if email fails
      }

      console.log('Order created successfully:', order)

      // Store order details for display
      setOrderNumber(order.order_number || 'N/A')
      
      // Clear cart and show success
      clearCart()
      setOrderComplete(true)
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Order Complete Page" />
        
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            
            {orderNumber && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-600 mb-1">Your Order Number</p>
                <p className="text-2xl font-bold text-green-800">{orderNumber}</p>
              </div>
            )}
            
            {qrCodeUrl && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">Show this QR code when claiming your order:</p>
                <div className="inline-block border-2 border-gray-200 rounded-lg p-4 bg-white">
                  <img 
                    src={qrCodeUrl} 
                    alt="Order QR Code" 
                    className="w-32 h-32 mx-auto"
                  />
                </div>
              </div>
            )}
            
            <p className="text-gray-600 mb-6">
              Thank you for your order! We'll prepare your delicious BBQ and notify you when it's ready.
              {orderNumber && ` Your order number is ${orderNumber}.`}
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/" 
                className="bbq-button-primary w-full block text-center"
              >
                Back to Home
              </Link>
              <Link 
                href="/orders" 
                className="bbq-button-secondary w-full block text-center"
              >
                View Order History
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Checkout Page" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/cart" 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2 text-lays-dark-red" />
                  Customer Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo({...customerInfo, fullName: e.target.value})}
                      className="bbq-input w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="bbq-input w-full"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="bbq-input w-full"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <textarea
                      required
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                      className="bbq-input w-full h-24 resize-none"
                      placeholder="Enter your delivery address"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-lays-dark-red" />
                  Payment Method
                </h2>
                
                <div className="space-y-3">
                  {[
                    { value: 'cash', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
                    { value: 'gcash', label: 'GCash', description: 'Pay via GCash mobile payment' },
                    { value: 'card', label: 'Credit/Debit Card', description: 'Pay with your card' },
                    { value: 'paymaya', label: 'PayMaya', description: 'Pay via PayMaya wallet' }
                  ].map((method) => (
                    <label key={method.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={customerInfo.paymentMethod === method.value}
                        onChange={(e) => setCustomerInfo({...customerInfo, paymentMethod: e.target.value})}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{method.label}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* GCash Payment Details */}
              {customerInfo.paymentMethod === 'gcash' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-lays-dark-red" />
                    GCash Payment Details
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Payment Screenshot Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Screenshot *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-lays-orange-gold transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setCustomerInfo({...customerInfo, paymentScreenshot: file})
                            }
                          }}
                          className="hidden"
                          id="payment-screenshot"
                          required={customerInfo.paymentMethod === 'gcash'}
                        />
                        <label htmlFor="payment-screenshot" className="cursor-pointer">
                          {customerInfo.paymentScreenshot ? (
                            <div className="space-y-3">
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(customerInfo.paymentScreenshot)}
                                  alt="Payment Screenshot Preview"
                                  className="w-full max-w-xs h-auto rounded-lg mx-auto border border-gray-200"
                                />
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-green-600">
                                  {customerInfo.paymentScreenshot.name}
                                </p>
                                <p className="text-xs text-gray-500">Click to change image</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                              <p className="text-sm font-medium text-gray-600">
                                Upload GCash Payment Screenshot
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, or JPEG (Max 5MB)
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* GCash Reference Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GCash Reference Number *
                      </label>
                      <input
                        type="text"
                        required={customerInfo.paymentMethod === 'gcash'}
                        value={customerInfo.gcashReference}
                        onChange={(e) => setCustomerInfo({...customerInfo, gcashReference: e.target.value})}
                        className="bbq-input w-full font-mono text-lg"
                        placeholder="Enter the reference number from your GCash payment"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Find this number in your GCash app after making the payment
                      </p>
                    </div>

                    {/* GCash Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800 mb-2">📱 How to Pay with GCash:</h3>
                      <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Open your GCash app</li>
                        <li>Go to "Send Money" or "Pay Bills"</li>
                        <li>Enter our GCash number: <strong>09XX-XXX-XXXX</strong></li>
                        <li>Enter the exact amount: <strong>₱{total.toFixed(2)}</strong></li>
                        <li>Complete the payment and take a screenshot</li>
                        <li>Upload the screenshot and enter the reference number above</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-semibold text-gray-900">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>₱{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>VAT (12%)</span>
                      <span>₱{tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-bold text-gray-900">
                        <span>Total</span>
                        <span>₱{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="bbq-button-primary w-full py-4 text-lg font-semibold flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Place Order - ₱{total.toFixed(2)}</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center">
                By placing this order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
