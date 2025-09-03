'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Check if user is admin - try both tables
          let adminUser = null

          // First, try the new admin_users table
          const { data: newAdminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('user_id', session.user.id)
            .single()

          if (newAdminUser) {
            adminUser = newAdminUser
          } else {
            // If not found in admin_users, try the old users table
            const { data: oldAdminUser } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .eq('role', 'admin')
              .single()

            if (oldAdminUser) {
              adminUser = oldAdminUser
            }
          }

          if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'crew')) {
            setIsRedirecting(true)
            // Redirect based on role
            if (adminUser.role === 'admin') {
              router.push('/admin/orders')
            } else {
              router.push('/crew')
            }
          }
        }
      } catch (error) {
        console.error('Error checking admin session:', error)
      }
    }

    checkAdminSession()
  }, [supabase, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        setIsLoading(false)
        return
      }

      // Validate password strength
      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
        setIsLoading(false)
        return
      }

      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      })

      if (authError) {
        console.error('Auth error:', authError)
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError('Login failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Check if user has admin role in auth.users metadata
      const userRole = data.user.raw_user_meta_data?.role
      console.log('User role from metadata:', userRole)

      if (userRole !== 'admin' && userRole !== 'crew') {
        console.log('Access denied - user role:', userRole)
        setError('Access denied. You are not authorized to access admin features. Please contact support to set up your admin account.')
        // Sign out the user since they're not admin
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      // Store admin role in localStorage for quick access
      localStorage.setItem('admin_role', userRole)
      localStorage.setItem('admin_user_id', data.user.id)

      // Redirect based on role
      if (userRole === 'admin') {
        router.push('/admin/orders')
      } else if (userRole === 'crew') {
        router.push('/crew')
      } else {
        setError('Invalid admin role. Please contact support.')
        await supabase.auth.signOut()
      }

    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Admin password reset requested for:', forgotPasswordEmail)
    
    try {
      setIsResettingPassword(true)
      setError('')
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(forgotPasswordEmail)) {
        setError('Please enter a valid email address')
        setIsResettingPassword(false)
        return
      }

      // Check if the email belongs to an admin user
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('email, role, is_active')
        .eq('email', forgotPasswordEmail.toLowerCase().trim())
        .single()

      if (adminError || !adminUser) {
        setError('No admin account found with this email address')
        setIsResettingPassword(false)
        return
      }

      if (!adminUser.is_active) {
        setError('This admin account has been deactivated. Please contact support.')
        setIsResettingPassword(false)
        return
      }

      // Send password reset email using Supabase Auth with proper admin redirect
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/account/reset-password?admin=true&email=${encodeURIComponent(forgotPasswordEmail)}`
      })
      
      if (error) {
        console.error('Admin password reset error:', error)
        setError('Error sending reset email. Please try again.')
        setIsResettingPassword(false)
        return
      }
      
      alert('Password reset link sent to your email! Check your inbox and follow the instructions.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
      
    } catch (error) {
      console.error('Admin password reset error:', error)
      setError('Error sending reset email. Please try again.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Admin Login" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lays-dark-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <DesignLock pageName="Admin Login" />
      
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lays-dark-red rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to access admin features</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bbq-input w-full"
                placeholder="admin@bbqrestaurant.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bbq-input w-full pr-10"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="bbq-button-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-600 hover:text-lays-dark-red transition-colors"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>

          {/* Forgot Password Form */}
          {showForgotPassword && (
            <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Admin Password</h3>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    id="forgot-email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="bbq-input w-full"
                    placeholder="admin@bbqrestaurant.com"
                    required
                    disabled={isResettingPassword}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="bbq-button-primary flex-1 flex items-center justify-center space-x-2"
                  >
                    {isResettingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotPasswordEmail('')
                      setError('')
                    }}
                    className="bbq-button-secondary px-4"
                    disabled={isResettingPassword}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Security Notice</h4>
                <p className="text-sm text-blue-800 mt-1">
                  This is a secure admin area. All login attempts are logged and monitored.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Customer Site */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-lays-dark-red transition-colors"
            >
              ← Back to Customer Site
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}