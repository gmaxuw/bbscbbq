'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

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

interface FavoritesContextType {
  favorites: Product[]
  isLoading: boolean
  addToFavorites: (product: Product) => Promise<void>
  removeFromFavorites: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
  toggleFavorite: (product: Product) => Promise<void>
  clearFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Load favorites from localStorage and database
  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      
      // First, try to get from localStorage (for offline support)
      const localFavorites = localStorage.getItem('bbq-favorites')
      if (localFavorites) {
        const parsedFavorites = JSON.parse(localFavorites)
        setFavorites(parsedFavorites)
      }

      // Then try to sync with database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await syncFavoritesWithDatabase()
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncFavoritesWithDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get favorites from database
      const { data: dbFavorites, error } = await supabase
        .from('user_favorites')
        .select(`
          product_id,
          products (
            id,
            name,
            description,
            price,
            commission,
            image_url,
            category,
            is_featured,
            is_active
          )
        `)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching favorites from database:', error)
        return
      }

      // Transform the data
      const favoriteProducts = dbFavorites
        ?.map(fav => fav.products)
        .filter(Boolean) as unknown as Product[] || []

      setFavorites(favoriteProducts)
      
      // Update localStorage
      localStorage.setItem('bbq-favorites', JSON.stringify(favoriteProducts))
    } catch (error) {
      console.error('Error syncing favorites with database:', error)
    }
  }

  const addToFavorites = async (product: Product) => {
    try {
      // Add to local state
      const newFavorites = [...favorites, product]
      setFavorites(newFavorites)
      
      // Update localStorage
      localStorage.setItem('bbq-favorites', JSON.stringify(newFavorites))

      // Add to database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            product_id: product.id
          })

        if (error) {
          console.error('Error adding to database favorites:', error)
          // Revert local state if database fails
          setFavorites(favorites)
          localStorage.setItem('bbq-favorites', JSON.stringify(favorites))
        }
      }
    } catch (error) {
      console.error('Error adding to favorites:', error)
      // Revert local state
      setFavorites(favorites)
      localStorage.setItem('bbq-favorites', JSON.stringify(favorites))
    }
  }

  const removeFromFavorites = async (productId: string) => {
    try {
      // Remove from local state
      const newFavorites = favorites.filter(fav => fav.id !== productId)
      setFavorites(newFavorites)
      
      // Update localStorage
      localStorage.setItem('bbq-favorites', JSON.stringify(newFavorites))

      // Remove from database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)

        if (error) {
          console.error('Error removing from database favorites:', error)
          // Revert local state if database fails
          setFavorites(favorites)
          localStorage.setItem('bbq-favorites', JSON.stringify(favorites))
        }
      }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      // Revert local state
      setFavorites(favorites)
      localStorage.setItem('bbq-favorites', JSON.stringify(favorites))
    }
  }

  const isFavorite = (productId: string) => {
    return favorites.some(fav => fav.id === productId)
  }

  const toggleFavorite = async (product: Product) => {
    if (isFavorite(product.id)) {
      await removeFromFavorites(product.id)
    } else {
      await addToFavorites(product)
    }
  }

  const clearFavorites = async () => {
    try {
      setFavorites([])
      localStorage.removeItem('bbq-favorites')

      // Clear from database if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
      }
    } catch (error) {
      console.error('Error clearing favorites:', error)
    }
  }

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    clearFavorites
  }

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
