'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, LogIn, UserPlus, ArrowLeft, Package, Settings, LogOut } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
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

  // User data - will be replaced with real data from database
  const userData = {
    name: userName || registerData.fullName || 'Guest User',
    email: userEmail || 'guest@example.com',
    phone: userPhone || registerData.phone || '+63-917-000-0000',
    joinDate: new Date().toISOString().split('T')[0],
    totalOrders: 0, // This will be calculated from actual orders
    favoriteItems: [] // This will be calculated from actual orders
  }

  // Debug logging to see what's happening
  console.log('Account Page Debug:', {
    userName,
    userEmail,
    userPhone,
    registerData,
    userData
  })

  // Check for existing customer session on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const customerEmail = localStorage.getItem('customer_email')
      const customerName = localStorage.getItem('customer_name')
      const customerPhone = localStorage.getItem('customer_phone')
      
      console.log('localStorage Debug:', {
        customerEmail,
        customerName,
        customerPhone
      })
      
      if (customerEmail) {
        setUserEmail(customerEmail)
        setUserName(customerName || '')
        setUserPhone(customerPhone || '')
        setIsLoggedIn(true)
        
        console.log('Setting user data:', {
          email: customerEmail,
          name: customerName,
          phone: customerPhone
        })
      }
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // For demo purposes, we'll use a simple email-based "login"
    // In a real app, this would connect to Supabase authentication
    console.log('Login attempt:', loginData)
    
    // Store customer email for order lookup
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_email', loginData.email)
    }
    setUserEmail(loginData.email)
    setIsLoggedIn(true)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    // For demo purposes, we'll use a simple email-based "registration"
    // In a real app, this would connect to Supabase authentication
    console.log('Register attempt:', registerData)
    
    // Store customer data for order lookup and display
    if (typeof window !== 'undefined') {
      localStorage.setItem('customer_email', registerData.email)
      localStorage.setItem('customer_name', registerData.fullName)
      localStorage.setItem('customer_phone', registerData.phone)
      
      console.log('Stored in localStorage:', {
        email: registerData.email,
        name: registerData.fullName,
        phone: registerData.phone
      })
    }
    setUserEmail(registerData.email)
    setUserName(registerData.fullName)
    setUserPhone(registerData.phone)
    setIsLoggedIn(true)
    
    console.log('Set state variables:', {
      email: registerData.email,
      name: registerData.fullName,
      phone: registerData.phone
    })
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('customer_email')
      localStorage.removeItem('customer_name')
      localStorage.removeItem('customer_phone')
    }
    setUserEmail('')
    setUserName('')
    setUserPhone('')
    setIsLoggedIn(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Connect to Supabase password reset
    console.log('Password reset requested for:', forgotPasswordEmail)
    alert('Password reset link sent to your email!')
    setShowForgotPassword(false)
    setForgotPasswordEmail('')
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DesignLock pageName="User Account Page" />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link 
                href="/" 
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-lays-dark-red" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Account</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
          {/* User Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-lays-orange-gold rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{userData.name}</h2>
                <p className="text-gray-600 mb-1 text-sm sm:text-base">{userEmail || userData.email}</p>
                <p className="text-gray-600 mb-1 text-sm sm:text-base">{userData.phone}</p>
                <p className="text-xs sm:text-sm text-gray-500">Member since {new Date(userData.joinDate).toLocaleDateString()}</p>
              </div>
              <button className="bbq-button-secondary w-full sm:w-auto">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-lays-dark-red mx-auto mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{userData.totalOrders}</h3>
              <p className="text-sm sm:text-base text-gray-600">Total Orders</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center">
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-lays-orange-gold mx-auto mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">VIP</h3>
              <p className="text-sm sm:text-base text-gray-600">Member Status</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-lays-bright-red mx-auto mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{userData.favoriteItems.length}</h3>
              <p className="text-sm sm:text-base text-gray-600">Favorite Items</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link 
              href="/orders" 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-lays-dark-red flex-shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Order History</h3>
                  <p className="text-sm sm:text-base text-gray-600">View your past orders and reorder favorites</p>
                </div>
              </div>
            </Link>
            
            <Link 
              href="/favorites" 
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-lays-orange-gold flex-shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Favorites</h3>
                  <p className="text-sm sm:text-base text-gray-600">Manage your favorite BBQ items</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Logout Button */}
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
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
                    value={registerData.password}
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
