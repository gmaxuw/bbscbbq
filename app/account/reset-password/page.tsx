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
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have the necessary parameters from the reset link
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')
    
    // For password reset, we need either access_token + refresh_token OR type=recovery
    // If neither is present, show error
    if ((!accessToken || !refreshToken) && type !== 'recovery') {
      setError('Invalid or expired reset link. Please request a new password reset.')
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
      
      // Check if user is admin/crew and redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user is admin or crew
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', user.id)
          .single()
        
        // Redirect based on user type after 3 seconds
        setTimeout(() => {
          if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'crew')) {
            router.push('/admin/login')
          } else {
            router.push('/account')
          }
        }, 3000)
      } else {
        // Default to account page
        setTimeout(() => {
          router.push('/account')
        }, 3000)
      }
      
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
              Your password has been successfully updated. You will be redirected to your account page shortly.
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
