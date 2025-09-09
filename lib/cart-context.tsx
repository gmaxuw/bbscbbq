'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
import { inventoryManager } from './inventory-manager'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  category: string
  commission?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  syncCartWithDatabase: () => Promise<void>
  checkout: (customerData: { name: string; phone: string; branch_id?: string; pickup_time?: string; payment_method?: string; payment_reference?: string; payment_screenshot_url?: string; user_id?: string }) => Promise<{ success: boolean; order_id?: string; conflicts?: string[] }>
  isSyncing: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const supabase = createClient()

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('bbq-cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          setItems(parsedCart)
        } catch (error) {
          console.error('Failed to load cart from localStorage:', error)
        }
      }
    }
  }, [])

  // Sync cart with database when user logs in (skip on admin pages)
  useEffect(() => {
    const syncCart = async () => {
      // Skip cart sync on admin pages
      if (typeof window !== 'undefined' && 
          (window.location.pathname.startsWith('/admin') || 
           window.location.pathname.startsWith('/crew'))) {
        return
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await syncCartWithDatabase()
      }
    }
    
    syncCart()
  }, [supabase])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bbq-cart', JSON.stringify(items))
    }
  }, [items])

  // Sync cart with database
  const syncCartWithDatabase = async () => {
    // Skip cart sync on admin pages
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      console.log('🛒 Admin page detected, skipping cart sync')
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('🛒 No user logged in, skipping database sync')
      return
    }

    setIsSyncing(true)
    try {
      // First, load cart from database
      const { data: dbCart, error: fetchError } = await supabase
        .from('user_carts')
        .select(`
          product_id,
          quantity,
          products (
            id,
            name,
            price,
            image_url,
            category,
            commission
          )
        `)
        .eq('user_id', user.id)

      if (fetchError) {
        console.error('🛒 Error fetching cart from database:', fetchError)
        return
      }

      // Convert database cart to local cart format
      const dbCartItems: CartItem[] = dbCart?.map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        quantity: item.quantity,
        image: item.products.image_url,
        category: item.products.category,
        commission: item.products.commission
      })) || []

      // Merge with local cart (database takes precedence for logged-in users)
      if (dbCartItems.length > 0) {
        console.log('🛒 Syncing cart from database:', dbCartItems)
        setItems(dbCartItems)
        // Update localStorage with synced cart
        localStorage.setItem('bbq-cart', JSON.stringify(dbCartItems))
      } else {
        // No database cart, upload local cart to database
        if (items.length > 0) {
          console.log('🛒 Uploading local cart to database:', items)
          await uploadCartToDatabase(items)
        }
      }
    } catch (error) {
      console.error('🛒 Error syncing cart with database:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Upload local cart to database
  const uploadCartToDatabase = async (cartItems: CartItem[]) => {
    // Skip cart sync on admin pages
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      console.log('🛒 Admin page detected, skipping cart upload')
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Clear existing cart in database
      await supabase
        .from('user_carts')
        .delete()
        .eq('user_id', user.id)

      // Insert new cart items
      const cartData = cartItems.map(item => ({
        user_id: user.id,
        product_id: item.id,
        quantity: item.quantity
      }))

      const { error } = await supabase
        .from('user_carts')
        .upsert(cartData, { 
          onConflict: 'user_id,product_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('🛒 Error uploading cart to database:', error)
      } else {
        console.log('🛒 Cart uploaded to database successfully')
      }
    } catch (error) {
      console.error('🛒 Error uploading cart to database:', error)
    }
  }

  const addItem = async (newItem: Omit<CartItem, 'quantity'>) => {
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
        // Sync with database
        uploadCartToDatabase(updatedItems)
        return updatedItems
      } else {
        // Add new item with quantity 1
        const newItems = [...prevItems, { ...newItem, quantity: 1 }]
        console.log('🛒 Added new item, new cart:', newItems)
        // Sync with database
        uploadCartToDatabase(newItems)
        return newItems
      }
    })
  }

  const removeItem = async (id: string) => {
    const newItems = items.filter(item => item.id !== id)
    setItems(newItems)
    // Sync with database
    await uploadCartToDatabase(newItems)
  }

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id)
      return
    }

    const newItems = items.map(item =>
      item.id === id ? { ...item, quantity } : item
    )
    setItems(newItems)
    // Sync with database
    await uploadCartToDatabase(newItems)
  }

  const clearCart = async () => {
    setItems([])
    // Clear from database
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_carts')
        .delete()
        .eq('user_id', user.id)
    }
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const checkout = async (customerData: { 
    name: string; 
    phone: string; 
    branch_id?: string;
    pickup_time?: string;
    payment_method?: string;
    payment_reference?: string;
    payment_screenshot_url?: string;
    user_id?: string;
  }) => {
    if (items.length === 0) {
      return { success: false, conflicts: ['Cart is empty'] }
    }

    try {
      // Convert cart items to order items format
      const orderItems = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        unit_commission: item.commission || 0,
        subtotal: item.price * item.quantity
      }))

      // Process order through inventory manager
      const result = await inventoryManager.processOrder({
        items: orderItems,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        branch_id: customerData.branch_id,
        pickup_time: customerData.pickup_time,
        payment_method: customerData.payment_method,
        payment_reference: customerData.payment_reference,
        payment_screenshot_url: customerData.payment_screenshot_url,
        user_id: customerData.user_id
      })

      if (result.success) {
        // Clear cart on successful order
        clearCart()
      }

      return result
    } catch (error) {
      console.error('Checkout failed:', error)
      return { success: false, conflicts: ['Checkout failed. Please try again.'] }
    }
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
        syncCartWithDatabase,
        checkout,
        isSyncing,
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
