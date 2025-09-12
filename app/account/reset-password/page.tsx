'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCrew, setIsCrew] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have the necessary parameters from the reset link
    // Supabase uses hash fragments (#) for password reset links
    const hash = window.location.hash
    const urlParams = new URLSearchParams(hash.substring(1)) // Remove the # and parse
    
    const accessToken = urlParams.get('access_token') || searchParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token') || searchParams.get('refresh_token')
    const type = urlParams.get('type') || searchParams.get('type')
    const isAdminParam = urlParams.get('admin') === 'true' || searchParams.get('admin') === 'true'
    const isCrewParam = urlParams.get('crew') === 'true' || searchParams.get('crew') === 'true'
    setIsAdmin(isAdminParam)
    setIsCrew(isCrewParam)
    
    console.log('Password reset URL analysis:', {
      hash,
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
      type,
      isAdmin: isAdminParam,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    
    // Check for error parameters in the URL (like otp_expired)
    const errorParam = urlParams.get('error')
    const errorCode = urlParams.get('error_code')
    const errorDescription = urlParams.get('error_description')
    
    if (errorParam) {
      if (errorCode === 'otp_expired') {
        setError('This password reset link has expired. Please request a new password reset.')
      } else if (errorCode === 'access_denied') {
        setError('Access denied. Please request a new password reset.')
      } else {
        setError(`Password reset error: ${errorDescription || errorParam}. Please request a new password reset.`)
      }
      return
    }

    // For password reset, we need either access_token + refresh_token OR type=recovery
    // If neither is present, show error
    if ((!accessToken || !refreshToken) && type !== 'recovery') {
      // Check if user is already authenticated (they might have clicked the link while logged in)
      const checkAuth = async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setError('You are already logged in. If you want to change your password, please log out first and try again.')
          } else {
            setError('Invalid or expired reset link. Please request a new password reset.')
          }
        } catch (error) {
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
      }
      checkAuth()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long!')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        console.error('Password update error:', error)
        setError('Failed to update password. Please try again.')
        return
      }
      
      setSuccess(true)
      
      // Check if this is an admin password reset
      const hash = window.location.hash
      const urlParams = new URLSearchParams(hash.substring(1))
      const isAdmin = urlParams.get('admin') === 'true' || searchParams.get('admin') === 'true'
      const adminEmail = urlParams.get('email') || searchParams.get('email')
      
      console.log('Password reset context:', { isAdmin, adminEmail, hash, searchParams: Object.fromEntries(searchParams.entries()) })
      
      // Redirect based on user type after 3 seconds
      setTimeout(async () => {
        if (isAdmin) {
          router.push('/admin/login')
        } else if (isCrew) {
          router.push('/crew/login')
        } else {
          // Check if user is admin/crew and redirect accordingly
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Check if user is admin or crew
            const { data: adminUser } = await supabase
              .from('admin_users')
              .select('role')
              .eq('user_id', user.id)
              .single()
            
            if (adminUser && adminUser.role === 'admin') {
              router.push('/admin/login')
            } else if (adminUser && adminUser.role === 'crew') {
              router.push('/crew/login')
            } else {
              router.push('/account')
            }
          } else {
            // Default to account page
            router.push('/account')
          }
        }
      }, 3000)
      
    } catch (error) {
      console.error('Password reset error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <DesignLock pageName="Password Reset Success" />
        
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Updated!</h1>
            <p className="text-gray-600 mb-6">
              {isAdmin 
                ? "Your admin password has been successfully updated. You will be redirected to the admin login page shortly."
                : "Your password has been successfully updated. You will be redirected to your account page shortly."
              }
            </p>
            
            <Link 
              href="/account"
              className="bbq-button-primary inline-flex items-center space-x-2"
            >
              <span>Go to Account</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Reset Password Page" />
      
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
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-lays-dark-red" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reset Password</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-lays-orange-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Create New Password</h2>
            <p className="text-gray-600 text-sm">
              Enter your new password below. Make sure it's secure and easy to remember.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Debug Information - Remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>URL Hash: {typeof window !== 'undefined' ? window.location.hash : 'N/A'}</p>
                <p>Search Params: {JSON.stringify(Object.fromEntries(searchParams.entries()))}</p>
                <p>Full URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bbq-input w-full pr-10"
                  placeholder="Enter your new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bbq-input w-full pr-10"
                  placeholder="Confirm your new password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="bbq-button-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/account"
              className="text-sm text-lays-dark-red hover:text-lays-bright-red hover:underline transition-colors"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
