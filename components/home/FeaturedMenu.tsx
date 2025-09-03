/**
 * FINAL FEATURED MENU DESIGN - DO NOT MODIFY
 * 
 * This featured menu is LOCKED and should NEVER be changed:
 * - 4 featured BBQ dishes with images
 * - Quantity controls with +/- buttons
 * - Real-time total price calculation
 * - Smart Add to Cart button states
 * - Loading and success animations
 * - Professional ordering experience
 * - Responsive grid layout
 * - Smooth hover effects and transitions
 * 
 * WARNING: Any changes to this featured menu will break the ordering experience
 * STATUS: LOCKED - Final design approved by user
 * LOCATION: Homepage featured dishes section
 * PURPOSE: Showcase popular dishes and enable easy ordering
 * 
 * If you need to modify the featured menu, you MUST:
 * 1. Get explicit user approval
 * 2. Test the quantity controls thoroughly
 * 3. Ensure Add to Cart functionality works
 * 4. Document the changes in this comment block
 * 5. Maintain the interactive ordering experience
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Clock, Flame, ArrowRight, Minus, Plus, ShoppingCart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/lib/cart-context'

interface Product {
  id: string
  name: string
  description: string
  price: number
  commission: number
  category: string
  is_active: boolean
  image_url?: string
}

export default function FeaturedMenu() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({})
  const { addItem } = useCart()

  const PRODUCTS_PER_PAGE = 8

  // Load products from database
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        console.log('Loading products from database...')
        console.log('Mobile Debug - User Agent:', navigator.userAgent)
        console.log('Mobile Debug - Screen size:', window.innerWidth, 'x', window.innerHeight)
        
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            commission,
            category,
            is_active,
            created_at,
            image_url
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(PRODUCTS_PER_PAGE)

        if (error) {
          console.error('Database error:', error)
          console.error('Error details:', error.message, error.details, error.hint)
          throw error
        }

        console.log('Products loaded:', data?.length || 0, 'items')
        console.log('Products data:', data)
        console.log('Mobile Debug - Products state will be set to:', data || [])
        
        setProducts(data || [])
        setHasMoreProducts((data || []).length === PRODUCTS_PER_PAGE)
        setCurrentPage(0)
        
        // Additional mobile debug
        setTimeout(() => {
          console.log('Mobile Debug - Products state after 1 second:', products)
        }, 1000)
      } catch (error) {
        console.error('Failed to load products:', error)
        console.error('Full error object:', error)
      } finally {
        setIsLoading(false)
        console.log('Mobile Debug - Loading finished, isLoading set to false')
      }
    }

    loadProducts()
  }, [])

  // Load more products
  const loadMoreProducts = async () => {
    if (isLoadingMore || !hasMoreProducts) return

    try {
      setIsLoadingMore(true)
      const nextPage = currentPage + 1
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          commission,
          category,
          is_active,
          created_at,
          image_url
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(nextPage * PRODUCTS_PER_PAGE, (nextPage + 1) * PRODUCTS_PER_PAGE - 1)

      if (error) throw error

      if (data && data.length > 0) {
        setProducts(prev => [...prev, ...data])
        setCurrentPage(nextPage)
        setHasMoreProducts(data.length === PRODUCTS_PER_PAGE)
      } else {
        setHasMoreProducts(false)
      }
    } catch (error) {
      console.error('Failed to load more products:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const updateQuantity = (itemId: string, change: number) => {
    const currentQty = quantities[itemId] || 0
    const newQty = Math.max(0, currentQty + change)
    
    if (newQty === 0) {
      const newQuantities = { ...quantities }
      delete newQuantities[itemId]
      setQuantities(newQuantities)
    } else {
      setQuantities({ ...quantities, [itemId]: newQty })
    }
  }

  const addToCart = (itemId: string) => {
    const qty = quantities[itemId] || 1
    if (qty > 0) {
      const product = products.find(item => item.id === itemId)
      if (product) {
        // Add items to cart (one by one based on quantity)
        for (let i = 0; i < qty; i++) {
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: getProductImage(product),
            category: product.category,
            commission: product.commission || 0 // Fixed: use commission from database
          })
        }
        
        setAddedItems({ ...addedItems, [itemId]: true })
        console.log(`Added ${qty}x ${product.name} to cart`)
        
        // Reset quantity after adding
        setTimeout(() => {
          setAddedItems(prev => ({ ...prev, [itemId]: false }))
          const newQuantities = { ...quantities }
          delete newQuantities[itemId]
          setQuantities(newQuantities)
        }, 2000)
      }
    }
  }

  // Helper function to get product image
  const getProductImage = (product: Product) => {
    if (product.image_url) {
      return product.image_url
    }
    // Fallback to a default BBQ image
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&crop=center'
  }

  return (
    <section className="bbq-section bg-gradient-to-b from-gray-50 to-white">
      <div className="bbq-container">
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-lays-dark-red/10 text-lays-dark-red rounded-full px-4 py-2 mb-4">
            <Flame className="w-5 h-5" />
            <span className="font-medium text-sm">Fresh & Delicious</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bbq-display font-bold text-gray-900 mb-6">
            Our BBQ Menu
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our delicious dishes, each crafted with care and smoked to perfection. Browse and order directly from our full menu.
          </p>
        </div>

        {(() => {
          if (isLoading) {
            console.log('Mobile Debug - Showing loading state')
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bbq-card animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )
          } else {
            console.log('Mobile Debug - Rendering products:', products.length, 'items')
            console.log('Mobile Debug - Products array:', products)
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {products.map((item, index) => (
            <div 
              key={item.id} 
              className="bbq-card group cursor-pointer overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden h-48">
                <div 
                  className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${getProductImage(item)})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {item.category === 'BBQ' && (
                  <div className="absolute top-3 left-3 bg-lays-bright-red text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>FEATURED</span>
                  </div>
                )}

                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-lays-dark-red font-bold text-lg px-3 py-2 rounded-lg">
                  ₱{item.price.toFixed(2)}
                </div>
              </div>

              <div className="p-6">
                <div className="text-sm text-lays-dark-red font-medium mb-2">
                  {item.category}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-lays-dark-red transition-colors duration-200">
                  {item.name}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {item.description || 'Delicious BBQ item prepared with care and attention to detail.'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Ready to Order</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4 text-lays-bright-red" />
                    <span>Hot</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(item.id, -1)
                      }}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                      {quantities[item.id] || 0}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        updateQuantity(item.id, 1)
                      }}
                      className="w-8 h-8 bg-lays-dark-red hover:bg-lays-bright-red text-white rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-bold text-lays-dark-red">
                      ₱{((quantities[item.id] || 0) * item.price).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCart(item.id)
                  }}
                  disabled={!quantities[item.id] || quantities[item.id] === 0}
                  className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 transform ${
                    addedItems[item.id]
                      ? 'bg-green-500 text-white cursor-default'
                      : quantities[item.id] && quantities[item.id] > 0
                      ? 'bg-lays-dark-red hover:bg-lays-bright-red text-white hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {addedItems[item.id] ? (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Added to Cart!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </span>
                  )}
                </button>
              </div>
            </div>
                ))}
              </div>
            )
          }
        })()}

        {!isLoading && products.length === 0 && (() => {
          console.log('Mobile Debug - Showing no products message')
          return (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No products available at the moment.</div>
              <Link 
                href="/admin/products" 
                className="bbq-button-primary"
              >
                Add Products
              </Link>
            </div>
          )
        })()}

        {!isLoading && hasMoreProducts && (
          <div className="text-center animate-fade-in">
            <button 
              onClick={loadMoreProducts}
              disabled={isLoadingMore}
              className="bbq-button-secondary text-lg px-8 py-4 group inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-5 h-5 border-2 border-lays-dark-red border-t-transparent rounded-full animate-spin mr-2" />
                  Loading More...
                </>
              ) : (
                <>
                  Load More Products
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </div>
        )}

        {!isLoading && !hasMoreProducts && products.length > 0 && (
          <div className="text-center animate-fade-in">
            <div className="text-gray-500 text-lg">
              You've seen all our products! Happy ordering!
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
