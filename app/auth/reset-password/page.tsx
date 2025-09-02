'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import DesignLock from '@/components/layout/DesignLock'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have the session from the email link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    
    checkSession()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      
      // Redirect to admin login after 3 seconds
      setTimeout(() => {
        router.push('/admin/login')
      }, 3000)

    } catch (error) {
      console.error('Password reset error:', error)
      setError('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <DesignLock pageName="Password Reset Success" />
        
        <div className="max-w-md w-full">
          <div className="bbq-card p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Password Reset Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You will be redirected to the admin login page shortly.
            </p>
            <button
              onClick={() => router.push('/admin/login')}
              className="bbq-button-primary w-full"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <DesignLock pageName="Admin Password Reset" />
      
      <div className="max-w-md w-full">
        <div className="bbq-card p-8">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-lays-dark-red mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Your Password
            </h1>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bbq-input w-full pr-10"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bbq-input w-full"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bbq-button-primary w-full flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/admin/login')}
              className="text-sm text-lays-dark-red hover:text-lays-bright-red transition-colors"
            >
              Back to Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
