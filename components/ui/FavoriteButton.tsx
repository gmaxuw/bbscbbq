'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/lib/favorites-context'

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

interface FavoriteButtonProps {
  product: Product
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function FavoriteButton({ 
  product, 
  size = 'md', 
  className = '' 
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoading } = useFavorites()
  
  const isFavorited = isFavorite(product.id)
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    
    await toggleFavorite(product)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        p-2 rounded-full transition-all duration-200 
        hover:scale-110 active:scale-95
        ${isFavorited 
          ? 'text-lays-bright-red bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 hover:text-lays-bright-red hover:bg-red-50'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`${sizeClasses[size]} ${isFavorited ? 'fill-current' : ''}`}
      />
    </button>
  )
}
