'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft, Package, Star, ShoppingCart, Trash2, Plus, Minus, CheckCircle, XCircle } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { useFavorites } from '@/lib/favorites-context'
import { useCart } from '@/lib/cart-context'

export default function FavoritesPage() {
  const { favorites, isLoading, removeFromFavorites, clearFavorites } = useFavorites()
  const { addItem } = useCart()
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({})
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  // Initialize quantities
  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {}
    favorites.forEach(item => {
      initialQuantities[item.id] = 1
    })
    setQuantities(initialQuantities)
  }, [favorites])

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantities(prev => ({ ...prev, [productId]: newQuantity }))
    }
  }

  const addToCart = (product: any) => {
    const quantity = quantities[product.id] || 1
    
    // Add multiple items based on quantity
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || '/placeholder-food.jpg',
        category: product.category,
        commission: product.commission || 0
      })
    }
    
    setAddedItems({ ...addedItems, [product.id]: true })
    
    // Reset added state after 2 seconds
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }))
    }, 2000)
  }

  const isAvailable = (item: any) => {
    // Check if item is available (not out of stock)
    return !item.is_out_of_stock
  }

  const handleRemoveFavorite = async (productId: string) => {
    await removeFromFavorites(productId)
  }

  const handleClearFavorites = async () => {
    if (confirm('Are you sure you want to remove all items from your favorites?')) {
      await clearFavorites()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lays-dark-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Favorites Page" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link 
              href="/account" 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-lays-dark-red" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Favorites</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {favorites.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No favorites yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start adding items to your favorites by browsing our menu and clicking the heart icon on items you love.
            </p>
            <Link 
              href="/"
              className="bbq-button-primary inline-flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>Browse Menu</span>
            </Link>
          </div>
        ) : (
          /* Favorites List */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Favorite Items ({favorites.length})
              </h2>
              {favorites.length > 0 && (
                <button
                  onClick={handleClearFavorites}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow duration-200">
                  <div className="relative aspect-w-16 aspect-h-12 bg-gray-200">
                    <img 
                      src={item.image_url || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop&crop=center'} 
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Heart Icon */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => handleRemoveFavorite(item.id)}
                        className="p-2 rounded-full bg-white/90 backdrop-blur-sm text-lays-bright-red hover:bg-red-50 transition-colors"
                        title="Remove from favorites"
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    
                    {/* Price */}
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-lays-dark-red font-bold text-lg px-3 py-2 rounded-lg">
                      ₱{item.price.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-2">
                      <div className="text-sm text-lays-dark-red font-medium mb-1">
                        {item.category}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-lays-dark-red transition-colors">
                        {item.name}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description || 'Delicious BBQ item prepared with care and attention to detail.'}
                    </p>
                    
                    {/* Availability Status */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                        isAvailable(item) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {isAvailable(item) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Available</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Quantity Selector */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, (quantities[item.id] || 1) - 1)}
                            disabled={!isAvailable(item) || (quantities[item.id] || 1) <= 1}
                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900">
                            {quantities[item.id] || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, (quantities[item.id] || 1) + 1)}
                            disabled={!isAvailable(item) || (quantities[item.id] || 1) >= 10}
                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={() => addToCart(item)}
                      disabled={addedItems[item.id] || !isAvailable(item)}
                      className={`w-full text-sm px-4 py-2 flex items-center justify-center space-x-2 transition-all duration-200 rounded-lg font-semibold ${
                        !isAvailable(item)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : addedItems[item.id] 
                            ? 'bg-green-500 hover:bg-green-600 text-white' 
                            : 'bbq-button-primary hover:scale-105'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {!isAvailable(item) 
                          ? 'Out of Stock' 
                          : addedItems[item.id] 
                            ? `Added ${quantities[item.id] || 1} item(s)!` 
                            : `Add ${quantities[item.id] || 1} to Cart`
                        }
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
