/**
 * 🔐 CREW LOGIN - BRANCH STAFF DASHBOARD 🛡️
 * 
 * This page provides secure crew authentication:
 * - Email/password login for branch staff
 * - Role verification (crew only)
 * - Automatic branch assignment detection
 * - Mobile-optimized interface
 * - Offline-ready with graceful degradation
 * 
 * ⚠️  WARNING: This is part of the crew dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /crew/login route
 * 🎯  PURPOSE: Authenticate branch staff for crew dashboard
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PageTemplate, { PageHeading, PageCard, PageButton } from '@/components/templates/PageTemplate'

export default function CrewLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Check if we're online
      if (!isOnline) {
        setError('You are currently offline. Please check your internet connection and try again.')
        setIsLoading(false)
        return
      }

      // Attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (signInError) throw signInError

      if (data.user) {
        // Verify crew role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, branch_id, is_active')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        if (userData.role !== 'crew') {
          await supabase.auth.signOut()
          setError('Access denied. This login is for crew members only.')
          return
        }

        if (!userData.is_active) {
          await supabase.auth.signOut()
          setError('Your account has been deactivated. Please contact your administrator.')
          return
        }

        // Redirect to crew dashboard
        router.push('/crew/dashboard')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email and confirm your account before logging in.')
      } else if (error.message.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a moment before trying again.')
      } else {
        setError('Login failed. Please check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Demo crew login (for testing purposes)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'crew@surigaobbq.com',
        password: 'demo123'
      })

      if (signInError) throw signInError

      if (data.user) {
        // Verify crew role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, branch_id, is_active')
          .eq('id', data.user.id)
          .single()

        if (userError) throw userError

        if (userData.role !== 'crew') {
          await supabase.auth.signOut()
          setError('Demo account not found. Please contact your administrator.')
          return
        }

        // Redirect to crew dashboard
        router.push('/crew/dashboard')
      }
    } catch (error: any) {
      console.error('Demo login error:', error)
      setError('Demo login failed. Please use your actual crew credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTemplate pageName="Crew Login">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-lays-dark-red rounded-full flex items-center justify-center mb-6">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <PageHeading 
              title="Crew Login" 
              subtitle="Access your branch dashboard"
            />
          </div>

          {/* Offline Warning */}
          {!isOnline && (
            <PageCard className="border-l-4 border-lays-orange-gold bg-orange-50">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-lays-orange-gold" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">You're currently offline</h3>
                  <p className="text-sm text-orange-700">
                    Please check your internet connection to access the crew dashboard.
                  </p>
                </div>
              </div>
            </PageCard>
          )}

          {/* Login Form */}
          <PageCard>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bbq-input pl-10 w-full"
                    placeholder="crew@surigaobbq.com"
                    disabled={isLoading || !isOnline}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bbq-input pl-10 pr-10 w-full"
                    placeholder="Enter your password"
                    disabled={isLoading || !isOnline}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <PageButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading || !isOnline}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </PageButton>

              {/* Demo Login Button */}
              <PageButton
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleDemoLogin}
                disabled={isLoading || !isOnline}
              >
                Try Demo Login
              </PageButton>
            </form>
          </PageCard>

          {/* Help Information */}
          <PageCard className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Contact your branch manager or administrator for login assistance.
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Make sure you're using your crew email address</p>
              <p>• Check that your account is active</p>
              <p>• Ensure you have a stable internet connection</p>
            </div>
          </PageCard>

          {/* Back to Main Site */}
          <div className="text-center">
            <PageButton
              variant="secondary"
              onClick={() => router.push('/')}
              className="text-sm"
            >
              ← Back to Main Site
            </PageButton>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
