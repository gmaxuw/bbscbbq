'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Minus, Plus, Trash2, CreditCard } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import DesignLock from '@/components/layout/DesignLock'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalItems, getTotalPrice, getItemTotalPrice, getPlatformFee, getTotalPriceWithPlatformFee, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleCheckout = () => {
    setIsProcessing(true)
    // Navigate to checkout page using Next.js router
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesignLock pageName="Cart Page" />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-lays-dark-red" />
                <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link 
              href="/" 
              className="bbq-button-primary text-lg px-8 py-4"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Cart Page" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-6 h-6 text-lays-dark-red" />
                <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                <span className="bg-lays-orange-gold text-white text-sm px-3 py-1 rounded-full">
                  {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <button
              onClick={clearCart}
              className="text-gray-500 hover:text-red-600 transition-colors text-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-lg font-bold text-lays-dark-red">
                      ₱{(item.price + (item.commission || 0)).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-lays-dark-red hover:bg-lays-bright-red text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Item Total */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-medium">Item Total</span>
                    <span className="text-lg font-bold text-lays-dark-red">
                      ₱{getItemTotalPrice(item).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({getTotalItems()})</span>
                  <span>₱{getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee</span>
                  <span>₱{getPlatformFee().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>VAT (12%)</span>
                  <span>₱{(getTotalPriceWithPlatformFee() * 0.12).toFixed(2)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>₱{(getTotalPriceWithPlatformFee() * 1.12).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="bbq-button-primary w-full py-4 text-lg font-semibold flex items-center justify-center space-x-2 mt-6"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Checkout</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                You will be redirected to the checkout page to complete your order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}