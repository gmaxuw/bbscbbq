/**
 * 🔐 ADMIN LOGIN PAGE - ADMIN DASHBOARD 🛡️
 * 
 * This page provides secure admin authentication:
 * - Login form with email/password
 * - Supabase authentication integration
 * - Role-based access control
 * - Secure session management
 * - Redirects to admin dashboard on success
 * 
 * ⚠️  WARNING: This is part of the admin dashboard system
 * 🔒  STATUS: INTEGRATED - Uses locked design system
 * 📍  LOCATION: /admin/login route
 * 🎯  PURPOSE: Secure admin access to dashboard
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PageTemplate from '@/components/templates/PageTemplate'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted!')
    console.log('Email:', email)
    console.log('Password length:', password.length)
    
    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting login with email:', email)
      
      // Attempt to sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('Supabase auth error:', signInError)
        throw signInError
      }

      if (data.user) {
        console.log('Auth successful, user:', data.user.email)
        
        // Check if user has admin role by email (more reliable)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role, full_name')
          .eq('email', data.user.email)
          .single()

        console.log('Database lookup result:', { userData, userError })

        if (userError || !userData) {
          console.error('User profile lookup failed:', userError)
          throw new Error('User profile not found. Please contact administrator.')
        }

        if (userData.role !== 'admin') {
          // Sign out non-admin users
          await supabase.auth.signOut()
          throw new Error('Access denied. Admin privileges required.')
        }

        // Success! Redirect to admin dashboard
        console.log('Admin login successful:', userData.full_name)
        console.log('Redirecting to admin dashboard...')
        
        // Use window.location for more reliable redirect
        window.location.href = '/admin'
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTemplate pageName="Admin Login" showNavigation={false} showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lays-dark-red to-lays-bright-red">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white shadow-2xl rounded-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-lays-dark-red rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-gray-600 mt-2">Sign in to manage your BBQ business</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent pl-10"
                    placeholder="admin@surigaobbq.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

                             {/* Login Button */}
               <button
                 type="submit"
                 className="bbq-button-primary w-full py-3 px-4 rounded-lg font-semibold text-white bg-lays-dark-red hover:bg-lays-bright-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 disabled={isLoading}
               >
                 {isLoading ? 'Signing In...' : 'Sign In'}
               </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <Link 
                href="/" 
                className="text-sm text-lays-dark-red hover:text-lays-bright-red transition-colors"
              >
                ← Back to Website
              </Link>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 text-center text-white text-sm opacity-80">
            <p>🔒 Secure admin access only</p>
            <p>Unauthorized access attempts will be logged</p>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}
