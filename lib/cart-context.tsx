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
  getItemTotalPrice: (item: CartItem) => number
  getPlatformFee: () => number
  getTotalPriceWithPlatformFee: () => number
  syncCartWithDatabase: () => Promise<void>
  checkout: (customerData: { name: string; phone: string; branch_id?: string; pickup_time?: string; payment_method?: string; payment_reference?: string; payment_screenshot_url?: string; user_id?: string }) => Promise<{ success: boolean; order_id?: string; conflicts?: string[] }>
  isSyncing: boolean
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const [platformFee, setPlatformFee] = useState(20) // Default ₱20
  const supabase = createClient()

  // Load cart from localStorage on mount
  useEffect(() => {
    console.log('🛒 Cart context loading...')
    if (typeof window !== 'undefined') {
      // Load platform fee first
      loadPlatformFee()
      
      // Set up real-time subscription for platform fee changes
      const platformFeeChannel = supabase
        .channel('platform_fee_changes')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'platform_settings',
            filter: 'setting_key=eq.platform_fee'
          }, 
          (payload) => {
            console.log('💰 Platform fee updated:', payload.new)
            if (payload.new?.setting_value) {
              setPlatformFee(parseFloat(payload.new.setting_value) || 20)
            }
          }
        )
        .subscribe()
      
      // Load cart from localStorage FIRST
      const savedCart = localStorage.getItem('bbq-cart')
      console.log('🛒 Saved cart from localStorage:', savedCart)
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          console.log('🛒 Parsed cart:', parsedCart)
          setItems(parsedCart)
        } catch (error) {
          console.error('❌ Failed to load cart from localStorage:', error)
        }
      }
      
      // Then sync with database (but don't override if database is empty)
      syncCartWithDatabase().finally(() => {
        console.log('🛒 Cart loading complete')
        setIsLoading(false)
      })
      
      // Fallback timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('⏰ Cart loading timeout - forcing completion (this is normal)')
        setIsLoading(false)
      }, 5000) // 5 second timeout
      
      return () => {
        clearTimeout(timeout)
        platformFeeChannel.unsubscribe()
      }
    } else {
      // Server-side, mark as not loading
      console.log('🛒 Server-side, marking as not loading')
      setIsLoading(false)
    }
  }, [])

  // This useEffect is now handled in the main cart loading useEffect above

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
        // No database cart, check if we have local cart to upload
        const localCart = localStorage.getItem('bbq-cart')
        if (localCart) {
          try {
            const parsedLocalCart = JSON.parse(localCart)
            if (parsedLocalCart.length > 0) {
              console.log('🛒 Uploading local cart to database:', parsedLocalCart)
              await uploadCartToDatabase(parsedLocalCart)
              // DON'T override the current items - keep localStorage data
            }
          } catch (error) {
            console.error('❌ Failed to parse local cart:', error)
          }
        }
        // If no local cart either, keep current items (don't clear them)
        console.log('🛒 No database or local cart found, keeping current items')
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
    if (!user) {
      console.log('🛒 No user logged in, skipping database upload')
      return
    }
    
    console.log('🛒 Uploading cart to database for user:', user.id, 'Items:', cartItems.length)

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
            ? { ...item, quantity: item.quantity + 1, image: newItem.image || item.image }
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
    return items.reduce((total, item) => {
      const itemPrice = item.price + (item.commission || 0) // Add commission to price
      return total + (itemPrice * item.quantity)
    }, 0)
  }

  // Helper function to get item price including commission
  const getItemTotalPrice = (item: CartItem) => {
    return (item.price + (item.commission || 0)) * item.quantity
  }

  // Load platform fee from Supabase
  const loadPlatformFee = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'platform_fee')
        .single()

      if (error) throw error
      
      if (data) {
        setPlatformFee(parseFloat(data.setting_value) || 20)
      }
    } catch (error) {
      console.error('Failed to load platform fee:', error)
      setPlatformFee(20) // Default fallback
    }
  }

  // Helper function to get platform fee
  const getPlatformFee = () => {
    return platformFee
  }

  // Helper function to get total price including platform fee
  const getTotalPriceWithPlatformFee = () => {
    return getTotalPrice() + platformFee
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
        subtotal: (item.price + (item.commission || 0)) * item.quantity // Include commission in subtotal
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
        getItemTotalPrice,
        getPlatformFee,
        getTotalPriceWithPlatformFee,
        syncCartWithDatabase,
        checkout,
        isSyncing,
        isLoading,
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
