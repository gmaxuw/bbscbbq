'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import { useRouter } from 'next/navigation'
import { ShoppingCart, CreditCard, User, Phone, MapPin, AlertCircle, CheckCircle, Wifi, WifiOff, UserCheck, Edit3, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface Branch {
  id: string
  name: string
  address: string
  phone: string
  is_active: boolean
}

export default function CheckoutPage() {
  const { items, getTotalPrice, checkout, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    branch_id: ''
  })
  const [pickupData, setPickupData] = useState({
    name: '',
    phone: ''
  })
  const [orderForSomeoneElse, setOrderForSomeoneElse] = useState(false)
  const [pickupDateTime, setPickupDateTime] = useState({
    date: '',
    time: ''
  })
  const [paymentData, setPaymentData] = useState({
    method: 'gcash',
    reference: '',
    screenshot: null as File | null
  })
  const [branches, setBranches] = useState<Branch[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoadingBranches, setIsLoadingBranches] = useState(true)

  // Load customer data and branches
  useEffect(() => {
    loadCustomerData()
    loadBranches()
  }, [])

  // Check online status
  useEffect(() => {
    // Only setup on client side
    if (typeof window === 'undefined') return
    
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }
    
    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)
    checkOnlineStatus()
    
    return () => {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [])

  // Load customer data from localStorage (if logged in)
  const loadCustomerData = () => {
    if (typeof window !== 'undefined') {
      const customerName = localStorage.getItem('customer_name')
      const customerPhone = localStorage.getItem('customer_phone')
      const customerEmail = localStorage.getItem('customer_email')
      
      if (customerName && customerPhone) {
        setCustomerData({
          name: customerName,
          phone: customerPhone,
          email: customerEmail || '',
          branch_id: ''
        })
      }
    }
  }

  // Load branches from database
  const loadBranches = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address, phone, is_active')
        .eq('is_active', true)
        .order('created_at')

      if (error) {
        console.error('Error loading branches:', error)
        return
      }

      setBranches(data || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setIsLoadingBranches(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setIsProcessing(true)

    try {
      // Validate required fields
      if (!pickupDateTime.date || !pickupDateTime.time) {
        setErrors(['Please select pickup date and time'])
        return
      }

      if (!paymentData.reference || !paymentData.screenshot) {
        setErrors(['Please provide payment reference number and screenshot'])
        return
      }

      // Use pickup data if ordering for someone else, otherwise use customer data
      const orderData = orderForSomeoneElse ? {
        name: pickupData.name,
        phone: pickupData.phone,
        branch_id: customerData.branch_id,
        pickup_time: new Date(`${pickupDateTime.date}T${pickupDateTime.time}:00`).toISOString(),
        payment_method: paymentData.method,
        payment_reference: paymentData.reference,
        payment_screenshot: paymentData.screenshot
      } : {
        name: customerData.name,
        phone: customerData.phone,
        branch_id: customerData.branch_id,
        pickup_time: new Date(`${pickupDateTime.date}T${pickupDateTime.time}:00`).toISOString(),
        payment_method: paymentData.method,
        payment_reference: paymentData.reference,
        payment_screenshot: paymentData.screenshot
      }

      const result = await checkout(orderData)
      
      if (result.success) {
        // Store customer phone for order history lookup
        const customerPhone = orderForSomeoneElse ? pickupData.phone : customerData.phone
        localStorage.setItem('customer_phone', customerPhone)
        
        // Success - redirect to confirmation
        router.push(`/order-confirmation?order_id=${result.order_id}`)
      } else {
        // Handle conflicts or errors
        setErrors(result.conflicts || ['Order failed. Please try again.'])
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setErrors(['An unexpected error occurred. Please try again.'])
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some delicious BBQ items to get started!</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            </div>
            {!isOnline && (
              <div className="text-sm text-gray-600">
                Your order will be processed when connection is restored
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 py-3 border-b border-gray-200 last:border-b-0">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <ShoppingCart className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.category}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">₱{(item.price * item.quantity).toFixed(2)}</p>
                    {item.commission && (
                      <p className="text-xs text-gray-500">Commission: ₱{(item.commission * item.quantity).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>₱{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
            
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Order Issues</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <UserCheck className="w-5 h-5 text-lays-dark-red" />
                  <h3 className="text-lg font-medium text-gray-900">Paying Customer</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData({...customerData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Order for Someone Else Checkbox */}
              <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  id="orderForSomeoneElse"
                  checked={orderForSomeoneElse}
                  onChange={(e) => setOrderForSomeoneElse(e.target.checked)}
                  className="w-4 h-4 text-lays-orange-gold border-gray-300 rounded focus:ring-lays-orange-gold"
                />
                <label htmlFor="orderForSomeoneElse" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Order for someone else (different pickup person)</span>
                </label>
              </div>

              {/* Pickup Person Information (only shown when checkbox is checked) */}
              {orderForSomeoneElse && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="w-5 h-5 text-yellow-600" />
                    <h3 className="text-lg font-medium text-gray-900">Pickup Person</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Pickup Person Name *
                      </label>
                      <input
                        type="text"
                        value={pickupData.name}
                        onChange={(e) => setPickupData({...pickupData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                        required={orderForSomeoneElse}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Pickup Person Phone *
                      </label>
                      <input
                        type="tel"
                        value={pickupData.phone}
                        onChange={(e) => setPickupData({...pickupData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                        required={orderForSomeoneElse}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Pickup Location *
                </label>
                {isLoadingBranches ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-lays-orange-gold border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600">Loading branches...</span>
                  </div>
                ) : (
                  <select
                    value={customerData.branch_id}
                    onChange={(e) => setCustomerData({...customerData, branch_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                    required
                  >
                    <option value="">Select pickup location</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This branch will prepare your order
                </p>
              </div>

              {/* Pickup Date & Time */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">Pickup Schedule</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Date *
                    </label>
                    <input
                      type="date"
                      value={pickupDateTime.date}
                      onChange={(e) => setPickupDateTime({...pickupDateTime, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time *
                    </label>
                    <select
                      value={pickupDateTime.time}
                      onChange={(e) => setPickupDateTime({...pickupDateTime, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    >
                      <option value="">Select time</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">1:00 PM</option>
                      <option value="14:00">2:00 PM</option>
                      <option value="15:00">3:00 PM</option>
                      <option value="16:00">4:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="18:00">6:00 PM</option>
                      <option value="19:00">7:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Please allow at least 2 hours for preparation time
                </p>
              </div>

              {/* Payment Method & Verification */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">Payment Verification</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gcash"
                          checked={paymentData.method === 'gcash'}
                          onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                          className="w-4 h-4 text-lays-orange-gold border-gray-300 focus:ring-lays-orange-gold"
                        />
                        <span className="text-sm font-medium text-gray-700">GCash</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="bank_transfer"
                          checked={paymentData.method === 'bank_transfer'}
                          onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                          className="w-4 h-4 text-lays-orange-gold border-gray-300 focus:ring-lays-orange-gold"
                        />
                        <span className="text-sm font-medium text-gray-700">Bank Transfer</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number *
                    </label>
                    <input
                      type="text"
                      value={paymentData.reference}
                      onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                      placeholder="Enter payment reference number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the reference number from your payment
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Screenshot *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentData({...paymentData, screenshot: e.target.files?.[0] || null})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload screenshot of your payment confirmation
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Payment verification required. We accept GCash and Bank Transfer with manual verification.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-lays-orange-gold text-white rounded-lg hover:bg-lays-dark-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>{isOnline ? 'Place Order' : 'Queue Order'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}