'use client'

import { useState, useEffect } from 'react'
import { useFavorites } from '@/lib/favorites-context'
import { supabase } from '@/lib/supabase'
import FavoriteButton from '@/components/ui/FavoriteButton'

interface Product {
  id: string
  name: string
  description?: string
  price: number
  commission: number
  image_url?: string
  category: string
  is_featured: boolean
  is_active: boolean
}

export default function TestFavoritesPage() {
  const { favorites, isLoading } = useFavorites()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(5)
      
      setProducts(data || [])
    }
    
    loadProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Favorites Test Page</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Favorites ({favorites.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">{fav.name}</h3>
                <p className="text-gray-600">₱{fav.price}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Test Products (Click Heart to Add/Remove)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{product.name}</h3>
                  <FavoriteButton product={product} size="sm" />
                </div>
                <p className="text-gray-600">₱{product.price}</p>
                <p className="text-sm text-gray-500">{product.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
