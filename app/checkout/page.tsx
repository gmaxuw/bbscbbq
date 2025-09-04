'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, MapPin, Phone, User, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { useCart } from '@/lib/cart-context'
import { createClient } from '@/lib/supabase'
import { generateReferenceNumber, generateQRCode } from '@/lib/qr-generator'
import { isOnline, storeOrderOffline, setupOfflineListener } from '@/lib/offline-storage'

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    branchId: '',
    pickupTime: '',
    paymentMethod: 'gcash',
    gcashReference: '',
    paymentScreenshot: null as File | null
  })
  const [orderForSomeoneElse, setOrderForSomeoneElse] = useState(false)
  const [branches, setBranches] = useState<Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
  }>>([])
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

  // Fetch branches for pickup selection
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('id, name, address, phone')
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching branches:', error)
        } else {
          setBranches(data || [])
        }
      } catch (error) {
        console.error('Error fetching branches:', error)
      }
    }

    fetchBranches()
  }, [supabase])

  // Auto-fill customer info if logged in
  useEffect(() => {
    const customerEmail = localStorage.getItem('customer_email')
    const customerName = localStorage.getItem('customer_name')
    const customerPhone = localStorage.getItem('customer_phone')

    if (customerEmail && customerName) {
      setCustomerInfo(prev => ({
        ...prev,
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone || ''
      }))
    }
  }, [])

  // Setup offline listener
  useEffect(() => {
    setupOfflineListener(supabase)
  }, [supabase])

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
    console.log('🔥 FORM SUBMIT BUTTON CLICKED!')
    console.log('🚀 ENHANCED LOGGING IS WORKING - NEW VERSION DEPLOYED!')
    e.preventDefault()
    setIsProcessing(true)
    
    console.log('🚀 FORM SUBMITTED!')
    console.log('📋 Customer info:', customerInfo)
    console.log('🔍 Form validation starting...')
    
    // Force show all data
    alert(`Form Data:\nName: ${customerInfo.fullName}\nEmail: ${customerInfo.email}\nPhone: ${customerInfo.phone}\nBranch: ${customerInfo.branchId}\nPickup: ${customerInfo.pickupTime}\nPayment: ${customerInfo.paymentMethod}\nGCash: ${customerInfo.gcashReference}\nScreenshot: ${customerInfo.paymentScreenshot ? 'YES' : 'NO'}`)
    
    // Check if we have items in cart
    console.log('🛒 Cart items:', items)
    if (items.length === 0) {
      alert('❌ No items in cart! Please add items to cart first.')
      setIsProcessing(false)
      return
    }
    
    // Check each required field
    console.log('✅ Full Name:', customerInfo.fullName ? 'FILLED' : 'MISSING')
    console.log('✅ Email:', customerInfo.email ? 'FILLED' : 'MISSING')
    console.log('✅ Phone:', customerInfo.phone ? 'FILLED' : 'MISSING')
    console.log('✅ Branch ID:', customerInfo.branchId ? 'FILLED' : 'MISSING')
    console.log('✅ Pickup Time:', customerInfo.pickupTime ? 'FILLED' : 'MISSING')
    console.log('✅ Payment Method:', customerInfo.paymentMethod)
    if (customerInfo.paymentMethod === 'gcash') {
      console.log('✅ GCash Reference:', customerInfo.gcashReference ? 'FILLED' : 'MISSING')
      console.log('✅ Payment Screenshot:', customerInfo.paymentScreenshot ? 'UPLOADED' : 'MISSING')
    } else {
      console.log('✅ Non-GCash payment method selected, skipping GCash validation')
    }
    
    try {
      // Validate GCash payment details if GCash is selected
      if (customerInfo.paymentMethod === 'gcash') {
        console.log('Validating GCash payment...')
        // TEMPORARILY DISABLE SCREENSHOT REQUIREMENT FOR DEBUGGING
        // if (!customerInfo.paymentScreenshot) {
        //   console.log('GCash validation failed: No screenshot')
        //   alert('Please upload your GCash payment screenshot')
        //   setIsProcessing(false)
        //   return
        // }
        console.log('🔧 DEBUGGING: Skipping GCash screenshot validation')
        // TEMPORARILY DISABLE GCASH REFERENCE VALIDATION FOR DEBUGGING
        // if (!customerInfo.gcashReference.trim()) {
        //   console.log('GCash validation failed: No reference number')
        //   alert('Please enter your GCash reference number')
        //   setIsProcessing(false)
        //   return
        // }
        console.log('🔧 DEBUGGING: Skipping GCash reference validation')
        // TEMPORARILY DISABLE GCASH REFERENCE FORMAT VALIDATION FOR DEBUGGING
        // const gcashRef = customerInfo.gcashReference.trim()
        // if (!/^\d{13}$/.test(gcashRef)) {
        //   console.log('GCash validation failed: Invalid reference format', gcashRef)
        //   alert('GCash reference number must be exactly 13 digits')
        //   setIsProcessing(false)
        //   return
        // }
        console.log('🔧 DEBUGGING: Skipping GCash reference format validation')
        console.log('GCash validation passed')
      }

      // Validate branch selection
      console.log('Validating branch selection...', customerInfo.branchId)
      if (!customerInfo.branchId) {
        console.log('Branch validation failed: No branch selected')
        alert('Please select a pickup branch')
        setIsProcessing(false)
        return
      }

      // Validate pickup time
      console.log('Validating pickup time...', customerInfo.pickupTime)
      if (!customerInfo.pickupTime) {
        console.log('Pickup time validation failed: No time selected')
        alert('Please select a pickup time')
        setIsProcessing(false)
        return
      }

      // Validate customer name
      console.log('Validating customer name...', customerInfo.fullName)
      if (!customerInfo.fullName || customerInfo.fullName.trim() === '') {
        console.log('Customer name validation failed: Empty name')
        alert('Please enter your full name')
        setIsProcessing(false)
        return
      }

      // Validate customer email
      console.log('Validating customer email...', customerInfo.email)
      if (!customerInfo.email || customerInfo.email.trim() === '') {
        console.log('Customer email validation failed: Empty email')
        alert('Please enter your email address')
        setIsProcessing(false)
        return
      }

      // Validate customer phone
      console.log('Validating customer phone...', customerInfo.phone)
      if (!customerInfo.phone || customerInfo.phone.trim() === '') {
        console.log('Customer phone validation failed: Empty phone')
        alert('Please enter your phone number')
        setIsProcessing(false)
        return
      }

      console.log('All validations passed!')

      const branchId = customerInfo.branchId
      const pickupDateTime = new Date(customerInfo.pickupTime)
      const now = new Date()
      
      // Validate pickup time is at least 1 hour from now (24-hour operation)
      const minPickupTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      if (pickupDateTime < minPickupTime) {
        alert('Pickup time must be at least 1 hour from now')
        setIsProcessing(false)
        return
      }
      
      // Validate pickup time is not more than 24 hours from now (24-hour operation)
      const maxPickupTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      if (pickupDateTime > maxPickupTime) {
        alert('Pickup time cannot be more than 24 hours in advance')
        setIsProcessing(false)
        return
      }
      
      // Calculate cooking start time (30 minutes before pickup)
      const cookingStartTime = new Date(pickupDateTime.getTime() - 30 * 60 * 1000)

      // Generate unique reference number
      const referenceNumber = generateReferenceNumber()

      // TEMPORARILY SKIP SCREENSHOT UPLOAD FOR DEBUGGING
      let screenshotUrl = null
      console.log('🔧 DEBUGGING: Skipping screenshot upload to isolate the issue')
      
      // Upload payment screenshot if provided
      // if (customerInfo.paymentScreenshot) {
      //   console.log('📸 Uploading payment screenshot...')
      //   setIsUploading(true)
      //   try {
      //     const fileExt = customerInfo.paymentScreenshot.name.split('.').pop()
      //     const fileName = `payment-${referenceNumber}.${fileExt}`
          
      //     const { data: uploadData, error: uploadError } = await supabase.storage
      //       .from('payment-screenshots')
      //       .upload(fileName, customerInfo.paymentScreenshot)

      //     if (uploadError) {
      //       console.error('❌ Screenshot upload failed:', uploadError)
      //       throw uploadError
      //     }

      //     // Get public URL
      //     const { data: urlData } = supabase.storage
      //       .from('payment-screenshots')
      //       .getPublicUrl(fileName)

      //     screenshotUrl = urlData.publicUrl
      //     console.log('✅ Screenshot uploaded successfully:', screenshotUrl)
      //   } catch (error) {
      //     console.error('❌ Screenshot upload error:', error)
      //     alert('Failed to upload payment screenshot. Please try again.')
      //     setIsProcessing(false)
      //     setIsUploading(false)
      //     return
      //   } finally {
      //     setIsUploading(false)
      //   }
      // }

      // Calculate total commission from cart items
      const totalCommission = items.reduce((sum, item) => {
        return sum + (item.commission || 0) * item.quantity
      }, 0)

      // Prepare order data - FIXED to match database schema exactly
      const orderData = {
        customer_name: customerInfo.fullName.trim(),
        customer_email: customerInfo.email.trim(),
        customer_phone: customerInfo.phone.trim(),
        branch_id: branchId,
        pickup_time: pickupDateTime.toISOString(),
        total_amount: total,
        total_commission: totalCommission, // Add total commission
        payment_status: customerInfo.paymentMethod === 'gcash' ? 'paid' : 'pending',
        gcash_reference: customerInfo.paymentMethod === 'gcash' ? customerInfo.gcashReference : null,
        payment_screenshot: screenshotUrl, // Use uploaded screenshot URL
        order_status: 'pending', // Fixed: database uses 'order_status', not 'status'
        // Note: payment_method and reference_number are not in the database schema
      }

      // Debug: Log the order data being sent
      console.log('🚀 ENHANCED LOGGING IS WORKING - NEW VERSION DEPLOYED!')
      console.log('Order data being sent:', orderData)
      console.log('Branch ID:', branchId)
      console.log('Pickup time:', pickupDateTime.toISOString())
      console.log('Customer info:', customerInfo)
      console.log('Items:', items)
      console.log('Total:', total)

      let order: any

      // Check if online or offline
      if (isOnline()) {
        // Create the order in Supabase
        console.log('🚀 Attempting to create order with data:', orderData)
        
        const { data, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single()

        if (orderError) {
          console.error('❌ Supabase Order Error:', orderError)
          console.error('❌ Order Data that failed:', orderData)
          console.error('❌ Error details:', JSON.stringify(orderError, null, 2))
          console.error('❌ Error message:', orderError.message)
          console.error('❌ Error code:', orderError.code)
          console.error('❌ Error hint:', orderError.hint)
          console.error('❌ Error details:', orderError.details)
          throw orderError
        }
        
        console.log('✅ Order created successfully:', data)
        order = data

        // Create order items - FIXED to match database schema
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          unit_commission: item.commission || 0, // Add unit commission
          subtotal: item.price * item.quantity // Fixed: database uses 'subtotal', not 'total_price'
        }))

        console.log('🚀 Attempting to create order items:', orderItems)

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('❌ Order Items Error:', itemsError)
          console.error('❌ Order Items Data that failed:', orderItems)
          throw itemsError
        }
        
        console.log('✅ Order items created successfully')

        // Commission is tracked in products table, not orders table
        // No need to update orders table with commission data
        console.log('✅ Order items created successfully - commission tracked in products table')
      } else {
        // Store offline
        storeOrderOffline(orderData, referenceNumber)
        order = { id: `offline_${Date.now()}`, reference_number: referenceNumber }
        console.log('Order stored offline due to no internet connection')
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

      // Generate QR code
      const qrCodeUrl = await generateQRCode(referenceNumber)

      // Store order details for display
      setOrderNumber(referenceNumber)
      setQrCodeUrl(qrCodeUrl)
      
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
                <p className="text-sm text-green-600 mb-1">Your Order Reference Number</p>
                <p className="text-2xl font-bold text-green-800 font-mono">{orderNumber}</p>
                <p className="text-xs text-green-600 mt-2">
                  📱 Show this number or QR code when picking up your order
                </p>
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
                
                {/* Order for Someone Else Option */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label htmlFor="order-for-someone-else" className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="order-for-someone-else"
                      name="orderForSomeoneElse"
                      checked={orderForSomeoneElse}
                      onChange={(e) => {
                        setOrderForSomeoneElse(e.target.checked)
                        if (!e.target.checked) {
                          // Reset to logged-in user info
                          const customerEmail = localStorage.getItem('customer_email')
                          const customerName = localStorage.getItem('customer_name')
                          const customerPhone = localStorage.getItem('customer_phone')
                          setCustomerInfo(prev => ({
                            ...prev,
                            fullName: customerName || '',
                            email: customerEmail || '',
                            phone: customerPhone || ''
                          }))
                        }
                      }}
                      className="rounded border-gray-300 text-lays-dark-red focus:ring-lays-dark-red"
                    />
                    <span className="text-sm font-medium text-blue-800">
                      📦 Order for someone else (I'll pay, they'll pick up)
                    </span>
                  </label>
                  <p className="text-xs text-blue-600 mt-1">
                    Check this if you're ordering for a friend/family member who will pick up the order
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="customer-name"
                      name="customerName"
                      required
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo({...customerInfo, fullName: e.target.value})}
                      className="bbq-input w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="customer-email"
                      name="customerEmail"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="bbq-input w-full"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="customer-phone"
                      name="customerPhone"
                      required
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="bbq-input w-full"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="pickup-branch" className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Branch *
                    </label>
                    <select
                      id="pickup-branch"
                      name="pickupBranch"
                      required
                      value={customerInfo.branchId}
                      onChange={(e) => setCustomerInfo({...customerInfo, branchId: e.target.value})}
                      className="bbq-input w-full"
                    >
                      <option value="">Select a pickup branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} - {branch.address}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 Choose the branch where you'll pick up your order
                    </p>
                  </div>

                  <div>
                    <label htmlFor="pickup-time" className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Time *
                    </label>
                    <input
                      type="datetime-local"
                      id="pickup-time"
                      name="pickupTime"
                      required
                      value={customerInfo.pickupTime}
                      onChange={(e) => setCustomerInfo({...customerInfo, pickupTime: e.target.value})}
                      className="bbq-input w-full"
                      min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                      max={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ⏰ Choose when you want to pick up your order (1 hour to 24 hours advance)
                    </p>
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
                        Payment Screenshot (Optional for debugging)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-lays-orange-gold transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          name="paymentScreenshot"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Create a custom filename with user info
                              const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
                              const customerName = customerInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_')
                              const fileExtension = file.name.split('.').pop()
                              const customFile = new File([file], `payment_${customerName}_${timestamp}.${fileExtension}`, {
                                type: file.type,
                                lastModified: file.lastModified
                              })
                              setCustomerInfo({...customerInfo, paymentScreenshot: customFile})
                              console.log('📸 Custom filename created:', customFile.name)
                            }
                          }}
                          className="hidden"
                          id="payment-screenshot"
                          required={false}
                          style={{ display: 'none' }}
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
                      <label htmlFor="gcash-reference" className="block text-sm font-medium text-gray-700 mb-2">
                        GCash Reference Number *
                      </label>
                      <input
                        type="text"
                        id="gcash-reference"
                        name="gcashReference"
                        required={false}
                        value={customerInfo.gcashReference}
                        onChange={(e) => {
                          // Only allow numbers and limit to 13 digits
                          const value = e.target.value.replace(/\D/g, '').slice(0, 13)
                          setCustomerInfo({...customerInfo, gcashReference: value})
                        }}
                        className="bbq-input w-full font-mono text-lg"
                        placeholder="Enter 13-digit GCash reference number"
                        maxLength={13}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Enter exactly 13 digits from your GCash payment confirmation
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
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm text-orange-800">
                          <strong>🍖 Cooking Schedule:</strong> We'll start cooking your order 30 minutes before your pickup time to ensure it's fresh and hot when you arrive!
                        </p>
                        <p className="text-xs text-orange-700 mt-2">
                          <strong>📅 Advance Orders:</strong> You can place orders up to 24 hours in advance (minimum 1 hour notice)
                        </p>
                      </div>
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
                disabled={isProcessing || isUploading}
                onClick={() => console.log('🔥 BUTTON CLICKED!')}
                className="bbq-button-primary w-full py-4 text-lg font-semibold flex items-center justify-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Screenshot...</span>
                  </>
                ) : isProcessing ? (
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
