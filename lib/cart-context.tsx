'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  category: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('bbq-cart')
      console.log('🛒 Loading cart from localStorage:', savedCart)
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          console.log('🛒 Parsed cart:', parsedCart)
          setItems(parsedCart)
        } catch (error) {
          console.error('Failed to load cart from localStorage:', error)
        }
      } else {
        console.log('🛒 No saved cart found in localStorage')
      }
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🛒 Saving cart to localStorage:', items)
      localStorage.setItem('bbq-cart', JSON.stringify(items))
    }
  }, [items])

  const addItem = (newItem: Omit<CartItem, 'quantity'>) => {
    console.log('🛒 Adding item to cart:', newItem)
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id)
      
      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
        console.log('🛒 Updated existing item, new cart:', updatedItems)
        return updatedItems
      } else {
        // Add new item with quantity 1
        const newItems = [...prevItems, { ...newItem, quantity: 1 }]
        console.log('🛒 Added new item, new cart:', newItems)
        return newItems
      }
    })
  }

  const removeItem = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
