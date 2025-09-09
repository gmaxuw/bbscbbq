'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  User, LogIn, UserPlus, ArrowLeft, Package, Settings, LogOut, 
  Clock, Star, TrendingUp, Heart, ShoppingBag, MapPin, 
  Calendar, CreditCard, Bell, Edit3, Eye, EyeOff, 
  CheckCircle, XCircle, AlertCircle, Loader2, QrCode, RefreshCw
} from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'

// Types for better data management
interface UserStats {
  totalOrders: number
  totalSpent: number
  favoriteItems: number
  averageOrderValue: number
  lastOrderDate: string | null
  memberSince: string
}

interface Order {
  id: string
  order_number: string
  total_amount: number
  order_status: string
  payment_status: string
  created_at: string
  pickup_time: string
  actual_pickup_time?: string
  ready_at?: string
  cooking_started_at?: string
  branch_name: string
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
  }>
}

interface FavoriteItem {
  id: string
  name: string
  price: number
  image_url: string
  category: string
  times_ordered: number
}

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userId, setUserId] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(true)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  // Real data from database
  const [userStats, setUserStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteItems: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    memberSince: new Date().toISOString().split('T')[0]
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileEditData, setProfileEditData] = useState({
    fullName: '',
    phone: ''
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Fetch user data from database
  const fetchUserData = async () => {
    if (!userEmail && !userPhone) return
    
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Force fresh data by adding cache busting timestamp
      const cacheBuster = Date.now()
      
      // Fetch user stats with cache busting
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          created_at,
          order_status,
          payment_status,
          order_number,
          pickup_time,
          actual_pickup_time,
          ready_at,
          cooking_started_at,
          updated_at,
          order_items (
            product_name,
            quantity,
            unit_price
          )
        `)
        .or(`customer_email.eq.${userEmail},customer_phone.eq.${userPhone}`)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        return
      }

      // Debug: Log the actual data being fetched
      console.log('🔍 DEBUG: Fresh orders data fetched:', {
        totalOrders: ordersData?.length || 0,
        orders: ordersData?.map(order => ({
          order_number: order.order_number,
          order_status: order.order_status,
          payment_status: order.payment_status,
          updated_at: order.updated_at
        }))
      })

      // Calculate stats
      const totalOrders = ordersData?.length || 0
      const totalSpent = ordersData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lastOrderDate = ordersData?.[0]?.created_at || null
      const memberSince = ordersData?.[ordersData.length - 1]?.created_at || new Date().toISOString()

      // Process recent orders
      const recentOrdersData = ordersData?.slice(0, 5).map(order => ({
        id: order.id,
        order_number: order.order_number || `#${order.id.slice(-8).toUpperCase()}`,
        total_amount: parseFloat(order.total_amount),
        order_status: order.order_status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        pickup_time: order.pickup_time,
        actual_pickup_time: order.actual_pickup_time,
        ready_at: order.ready_at,
        cooking_started_at: order.cooking_started_at,
        branch_name: 'Main Branch',
        items: order.order_items || []
      })) || []

      // Calculate favorite items
      const productCounts: { [key: string]: { name: string; price: number; image_url: string; category: string; count: number } } = {}
      
      ordersData?.forEach(order => {
        order.order_items?.forEach(item => {
          if (productCounts[item.product_name]) {
            productCounts[item.product_name].count += item.quantity
          } else {
            productCounts[item.product_name] = {
              name: item.product_name,
              price: parseFloat(item.unit_price),
              image_url: '',
              category: 'bbq',
              count: item.quantity
            }
          }
        })
      })

      const favoriteItemsData = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((item, index) => ({
          id: `fav-${index}`,
          name: item.name,
          price: item.price,
          image_url: item.image_url,
          category: item.category,
          times_ordered: item.count
        }))

      setUserStats({
        totalOrders,
        totalSpent,
        favoriteItems: favoriteItemsData.length,
        averageOrderValue,
        lastOrderDate,
        memberSince: memberSince.split('T')[0]
      })

      setRecentOrders(recentOrdersData)
      setFavoriteItems(favoriteItemsData)
      setLastRefresh(new Date())

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Force refresh data
  const handleRefresh = async () => {
    console.log('🔄 Force refreshing user data...')
    await fetchUserData()
  }

  // Check for existing customer session on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const customerEmail = localStorage.getItem('customer_email')
      const customerName = localStorage.getItem('customer_name')
      const customerPhone = localStorage.getItem('customer_phone')
      const customerId = localStorage.getItem('customer_id')
      
      if (customerEmail) {
        setUserEmail(customerEmail)
        setUserName(customerName || '')
        setUserPhone(customerPhone || '')
        setUserId(customerId || '')
        setIsLoggedIn(true)
      }
    }
  }, [])

  // Fetch data when user is logged in
  useEffect(() => {
    if (isLoggedIn && (userEmail || userPhone)) {
      fetchUserData()
    }
  }, [isLoggedIn, userEmail, userPhone])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Login attempt:', loginData)
    
    try {
      const supabase = createClient()
      
      // Use Supabase Auth for proper authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      })
      
      if (authError) {
        console.error('Authentication error:', authError)
        alert('Invalid email or password. Please try again.')
        return
      }
      
      if (!authData.user) {
        alert('Login failed. Please try again.')
        return
      }
      
      // Get customer data from auth.users with role metadata
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Customer account not found.')
        return
      }
      
      // Check if user has customer role
      const userRole = user.user_metadata?.role
      if (userRole !== 'customer') {
        alert('This account is not a customer account.')
        return
      }
      
      console.log('Customer login successful:', user)
      
      // Store customer data for order lookup and display
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_email', user.email || '')
        localStorage.setItem('customer_name', user.user_metadata?.full_name || '')
        localStorage.setItem('customer_phone', user.user_metadata?.phone || '')
        localStorage.setItem('customer_id', user.id)
      }
      
      setUserEmail(user.email || '')
      setUserName(user.user_metadata?.full_name || '')
      setUserPhone(user.user_metadata?.phone || '')
      setUserId(user.id)
      setIsLoggedIn(true)
      
    } catch (error) {
      console.error('Login error:', error)
      alert('Error logging in. Please try again.')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password confirmation
    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    
    console.log('Register attempt:', registerData)
    
    try {
      const supabase = createClient()
      
      // Check if email already exists in auth.users
      const { data: existingAuthUser } = await supabase.auth.getUser()
      
      if (existingAuthUser.user && existingAuthUser.user.email === registerData.email) {
        alert('An account with this email already exists!')
        return
      }
      
      // Create user in Supabase Auth with customer role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            phone: registerData.phone,
            role: 'customer' // Set customer role in metadata
          },
          emailRedirectTo: 'https://bbscbbq.vercel.app/account'
        }
      })
      
      if (authError) {
        console.error('Auth registration error:', authError)
        alert('Error creating account. Please try again.')
        return
      }
      
      if (!authData.user) {
        alert('Account creation failed. Please try again.')
        return
      }
      
      console.log('Customer account created successfully:', authData.user)
      
      // Store customer data for order lookup and display
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_email', registerData.email)
        localStorage.setItem('customer_name', registerData.fullName)
        localStorage.setItem('customer_phone', registerData.phone)
        localStorage.setItem('customer_id', authData.user.id)
        
        console.log('Stored in localStorage:', {
          email: registerData.email,
          name: registerData.fullName,
          phone: registerData.phone,
          id: authData.user.id
        })
      }
      
      setUserEmail(registerData.email)
      setUserName(registerData.fullName)
      setUserPhone(registerData.phone)
      setUserId(authData.user.id)
      setIsLoggedIn(true)
      
      alert('Account created successfully!')
      
    } catch (error) {
      console.error('Registration error:', error)
      alert('Error creating account. Please try again.')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customer_email')
      localStorage.removeItem('customer_name')
      localStorage.removeItem('customer_phone')
      localStorage.removeItem('customer_id')
    }
    setUserEmail('')
    setUserName('')
    setUserPhone('')
    setUserId('')
    setIsLoggedIn(false)
    setUserStats({
      totalOrders: 0,
      totalSpent: 0,
      favoriteItems: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      memberSince: new Date().toISOString().split('T')[0]
    })
    setRecentOrders([])
    setFavoriteItems([])
  }

  const handleProfileEdit = () => {
    setProfileEditData({
      fullName: userName,
      phone: userPhone
    })
    setShowProfileEdit(true)
  }

  const handleProfileSave = async () => {
    try {
      const supabase = createClient()
      
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileEditData.fullName,
          phone: profileEditData.phone
        }
      })

      if (error) {
        console.error('Error updating profile:', error)
        alert('Error updating profile. Please try again.')
        return
      }

      // Update local state and localStorage
      setUserName(profileEditData.fullName)
      setUserPhone(profileEditData.phone)
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_name', profileEditData.fullName)
        localStorage.setItem('customer_phone', profileEditData.phone)
      }

      setShowProfileEdit(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'preparing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'preparing':
        return 'bg-blue-100 text-blue-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Password reset requested for:', forgotPasswordEmail)
    
    try {
      const supabase = createClient()
      
      // Send password reset email using Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `https://bbscbbq.vercel.app/account/reset-password`
      })
      
      if (error) {
        console.error('Password reset error:', error)
        alert('Error sending reset email. Please try again.')
        return
      }
      
      alert('Password reset link sent to your email! Check your inbox.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
      
    } catch (error) {
      console.error('Password reset error:', error)
      alert('Error sending reset email. Please try again.')
    }
  }


  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <DesignLock pageName="User Account Dashboard" />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/" 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-lays-dark-red" />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-lays-dark-red to-lays-bright-red rounded-2xl p-6 sm:p-8 mb-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {userName}! 👋</h2>
                <p className="text-red-100 text-sm sm:text-base">
                  {userStats.lastOrderDate 
                    ? `Your last order was on ${new Date(userStats.lastOrderDate).toLocaleDateString()}`
                    : 'Ready for your first BBQ order?'
                  }
                </p>
                {lastRefresh && (
                  <p className="text-red-200 text-xs mt-1">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={handleProfileEdit}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{userStats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-lays-dark-red/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-lays-dark-red" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">₱{userStats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-lays-orange-gold/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-lays-orange-gold" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">₱{userStats.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-lays-bright-red/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-lays-bright-red" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Favorite Items</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{userStats.favoriteItems}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-lays-dark-red" />
                    Recent Orders
                  </h3>
            <Link 
              href="/orders" 
                    className="text-lays-dark-red hover:text-lays-bright-red text-sm font-semibold transition-colors"
                  >
                    View All
                  </Link>
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-lays-dark-red" />
                    <span className="ml-2 text-gray-600">Loading orders...</span>
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowOrderModal(true)
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{order.order_number}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                              {order.order_status}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.order_status)}
                            <span className="text-sm text-gray-600">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">₱{order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <Link 
                      href="/" 
                      className="bbq-button-primary inline-flex items-center"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Start Ordering
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-lays-dark-red" />
                  Profile
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{userPhone}</p>
                  </div>
                <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-semibold text-gray-900">{new Date(userStats.memberSince).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Favorite Items */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-pink-500" />
                  Favorite Items
                </h3>
                {favoriteItems.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">Ordered {item.times_ordered} times</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">₱{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                    {favoriteItems.length > 3 && (
                      <Link 
                        href="/favorites" 
                        className="text-lays-dark-red hover:text-lays-bright-red text-sm font-semibold transition-colors"
                      >
                        View All Favorites
            </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Heart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No favorites yet</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link 
                    href="/" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5 text-lays-dark-red" />
                    <span className="font-semibold text-gray-900">New Order</span>
                  </Link>
                  <Link 
                    href="/orders" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Package className="w-5 h-5 text-lays-orange-gold" />
                    <span className="font-semibold text-gray-900">Order History</span>
                  </Link>
                  <Link 
                    href="/favorites" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Heart className="w-5 h-5 text-pink-500" />
                    <span className="font-semibold text-gray-900">Favorites</span>
                  </Link>
                  <Link 
                    href="/scan-qr" 
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-lays-dark-red" />
                    <span className="font-semibold text-gray-900">Scan QR Code</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Order Header */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">{selectedOrder.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.order_status)}`}>
                      {selectedOrder.order_status}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-lays-dark-red">₱{selectedOrder.total_amount.toFixed(2)}</div>
                </div>

                {/* Timing Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-lays-dark-red" />
                      Order Timeline
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ordered:</span>
                        <span className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Scheduled Pickup:</span>
                        <span className="font-medium">{new Date(selectedOrder.pickup_time).toLocaleString()}</span>
                      </div>
                      {selectedOrder.cooking_started_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cooking Started:</span>
                          <span className="font-medium">{new Date(selectedOrder.cooking_started_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.ready_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ready:</span>
                          <span className="font-medium">{new Date(selectedOrder.ready_at).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual Pickup:</span>
                        <span className="font-medium">
                          {selectedOrder.actual_pickup_time 
                            ? new Date(selectedOrder.actual_pickup_time).toLocaleString()
                            : 'Not picked up yet'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-lays-dark-red" />
                      Order Info
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${getStatusColor(selectedOrder.order_status)}`}>
                          {selectedOrder.order_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span className={`font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {selectedOrder.payment_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Branch:</span>
                        <span className="font-medium">{selectedOrder.branch_name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-lays-dark-red" />
                    Order Items
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-600">Quantity: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">₱{item.unit_price.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Total: ₱{(item.unit_price * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-lays-dark-red">₱{selectedOrder.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileEditData.fullName}
                    onChange={(e) => setProfileEditData({...profileEditData, fullName: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileEditData.phone}
                    onChange={(e) => setProfileEditData({...profileEditData, phone: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleProfileSave}
                  className="bbq-button-primary flex-1"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowProfileEdit(false)}
                  className="bbq-button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Login/Register Page" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">
                {showLoginForm ? 'Sign In' : 'Create Account'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 sm:py-8">
        {/* Toggle Buttons */}
        <div className="flex bg-gray-200 rounded-lg p-1 mb-6 sm:mb-8">
          <button
            onClick={() => setShowLoginForm(true)}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-md font-semibold transition-colors text-sm sm:text-base ${
              showLoginForm 
                ? 'bg-white text-lays-dark-red shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setShowLoginForm(false)}
            className={`flex-1 py-2 px-3 sm:px-4 rounded-md font-semibold transition-colors text-sm sm:text-base ${
              !showLoginForm 
                ? 'bg-white text-lays-dark-red shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Login Form */}
        {showLoginForm ? (
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-lays-dark-red hover:text-lays-bright-red hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
              
              <button
                type="submit"
                className="bbq-button-primary w-full mt-6 flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </div>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Create a password"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="bbq-button-primary w-full mt-6 flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="bbq-input w-full"
                    placeholder="Enter your email address"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bbq-button-primary flex-1"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="bbq-button-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-lays-dark-red hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-lays-dark-red hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
