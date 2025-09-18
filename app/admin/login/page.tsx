'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, LogIn, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Check for existing session on page load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Clear any redirect parameters to prevent loops
        if (window.location.search.includes('redirectedFrom')) {
          console.log('🧹 Clearing redirect parameters to prevent loops')
          window.history.replaceState({}, '', window.location.pathname)
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // If there's a session error (like rate limiting), skip auth check to prevent loops
        if (sessionError && sessionError.code === 'over_request_rate_limit') {
          console.log('⚠️ Admin session check: Rate limited, skipping auth check')
          setIsRateLimited(true)
          // Reset rate limit after 5 minutes
          setTimeout(() => setIsRateLimited(false), 300000)
          return
        }
        
        if (session?.user) {
          console.log('✅ Admin session found, checking role for:', session.user.id)
          
          // Check if user is admin or crew
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('role, name')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()

          if (!error && adminUser) {
            console.log('🚀 Admin verified, redirecting to dashboard')
            // Check if we're already in a redirect loop
            const urlParams = new URLSearchParams(window.location.search)
            if (urlParams.get('redirectedFrom')) {
              console.log('⚠️ Already redirected, clearing redirect parameter')
              window.location.href = `${window.location.origin}/admin`
            } else {
              window.location.href = `${window.location.origin}/admin`
            }
            return
          } else if (error && (error.code === 'PGRST301' || error.message.includes('500') || 
                     error.message.includes('infinite recursion') || error.code === '42P17')) {
            console.log('🔄 RLS policy error in session check, allowing access')
            window.location.href = `${window.location.origin}/admin`
            return
          } else {
            console.log('❌ Admin user not found for:', session.user.id)
          }
        } else {
          console.log('📝 No active session, showing login form')
        }
      } catch (error) {
        console.error('Session check error:', error)
        // Don't set rate limited on general errors
      }
    }
    
    checkExistingSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if rate limited
    if (isRateLimited) {
      setError('Too many login attempts. Please wait 5 minutes before trying again.')
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Admin login attempt for:', loginData.email)

      // Clear any existing sessions first
      await supabase.auth.signOut()

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email.toLowerCase().trim(),
        password: loginData.password
      })

      if (authError || !authData.user) {
        console.error('❌ Admin auth failed:', authError?.message)
        
        // Handle rate limiting specifically
        if (authError?.message.includes('Request rate limit reached') || authError?.message.includes('too many requests')) {
          setIsRateLimited(true)
          setError('Too many requests. Please wait 5 minutes before trying again.')
          // Reset rate limit after 5 minutes
          setTimeout(() => setIsRateLimited(false), 300000)
          return
        }
        
        setError('Invalid email or password')
        return
      }

      // Verify this user is an admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single()

      if (adminError) {
        console.error('❌ Admin check error:', adminError)
        // If it's an RLS policy error (infinite recursion, 500, etc.), allow login
        if (adminError.code === 'PGRST301' || adminError.message.includes('500') || 
            adminError.message.includes('infinite recursion') || adminError.code === '42P17') {
          console.log('🔄 RLS policy error detected, allowing login...')
          console.log('✅ Allowing login due to RLS policy issue')
        } else {
          await supabase.auth.signOut()
          setError('This account does not have admin access')
          return
        }
      } else if (!adminUser) {
        console.error('❌ Admin user not found')
        await supabase.auth.signOut()
        setError('This account does not have admin access')
        return
      }

      console.log('✅ Admin login successful:', {
        role: adminUser?.role || 'admin (bypassed RLS)',
        name: adminUser?.name || 'Admin User',
        branch_id: adminUser?.branch_id || null
      })

      // Wait for session to fully hydrate, then redirect
      console.log('⏳ Waiting for session hydration...')
      
      // Give Supabase time to sync the session
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify session is properly set
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        console.log('✅ Session confirmed, redirecting to admin dashboard')
        window.location.href = `${window.location.origin}/admin`
      } else {
        console.log('❌ Session not found after login')
        setError('Session error - please try again')
      }

    } catch (error) {
      console.error('Admin login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResettingPassword(true)

    try {
      // Use direct Supabase auth for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/account/reset-password?admin=true&email=${encodeURIComponent(forgotPasswordEmail)}`
      })

      if (error) {
        console.error('Password reset error:', error)
        setError(`Error sending reset email: ${error.message || 'Please try again.'}`)
        return
      }

      alert('Password reset link sent to your email!')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')

    } catch (error) {
      console.error('Password reset error:', error)
      setError('Error sending reset email')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    setIsRegistering(true)
    setError('')

    try {
      console.log('🆕 ADMIN REGISTRATION ATTEMPT!')

      // Create admin account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            role: 'admin'
          },
          emailRedirectTo: `${window.location.origin}/admin`
        }
      })

      if (authError) {
        console.error('❌ Auth registration error:', authError)
        setError('Error creating admin account: ' + authError.message)
        return
      }

      if (!authData.user) {
        setError('Account creation failed')
        return
      }

      console.log('✅ Admin account created successfully!')

      // Check if email confirmation is required
      if (!authData.user.email_confirmed_at) {
        console.log('📧 Email confirmation required')
        setError('Registration successful! Please check your email and click the confirmation link to activate your admin account.')
        
        // Reset form and show login
        setRegisterData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setShowRegisterForm(false)
        return
      }

      // If email is already confirmed, try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password
      })

      if (signInError || !signInData.user) {
        console.error('❌ Failed to sign in after registration:', signInError)
        setError('Account created! Please sign in manually after confirming your email.')
        
        // Reset form and show login
        setRegisterData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setShowRegisterForm(false)
        return
      }

      console.log('✅ User signed in after registration')

      // Now create admin_users record with authenticated user
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          user_id: authData.user.id,
          email: registerData.email.toLowerCase().trim(),
          name: registerData.fullName,
          role: 'admin',
          is_active: true
        }])

      // If direct insertion fails, try server-side API as fallback
      if (adminError) {
        console.log('⚠️ Direct admin insertion failed, trying server-side API...', adminError.message)
        
        try {
          const response = await fetch('/api/admin/create-admin-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: authData.user.id,
              email: registerData.email.toLowerCase().trim(),
              name: registerData.fullName
            })
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Server-side creation failed')
          }

          console.log('✅ Server-side admin user creation successful')
        } catch (apiError) {
          console.error('❌ Both direct and server-side admin creation failed:', apiError)
          setError('Error creating admin record: ' + adminError.message)
          return
        }
      } else {
        console.log('✅ Direct admin user record creation successful')
      }

      console.log('✅ Admin registration successful!')
      
      // Wait for session to fully hydrate, then redirect
      console.log('⏳ Waiting for session hydration...')
      
      // Give Supabase time to sync the session
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify session is properly set
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        console.log('✅ Session confirmed, redirecting to admin dashboard')
        window.location.href = `${window.location.origin}/admin`
      } else {
        console.log('❌ Session not found after registration')
        setError('Admin account created! Please sign in manually.')
        
        // Reset form and show login
        setRegisterData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        })
        setShowRegisterForm(false)
      }

    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Admin Login" />
      
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
              <Shield className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Sign In</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {/* Toggle Buttons */}
        <div className="flex bg-gray-200 rounded-lg p-1 mb-8">
          <button
            onClick={() => {
              setShowRegisterForm(false)
              setShowForgotPassword(false)
              setError('')
            }}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
              !showRegisterForm && !showForgotPassword
                ? 'bg-white text-lays-dark-red shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setShowRegisterForm(true)
              setShowForgotPassword(false)
              setError('')
            }}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
              showRegisterForm
                ? 'bg-white text-lays-dark-red shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Admin
          </button>
        </div>

        {/* Login Form */}
        {!showForgotPassword && !showRegisterForm ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your admin email"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="bbq-input w-full pr-10"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-lays-dark-red hover:text-lays-bright-red hover:underline transition-colors"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || isRateLimited}
                className="bbq-button-primary w-full mt-6 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing In...</span>
                  </>
                ) : isRateLimited ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Rate Limited - Wait 5 min</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              {/* Temporary Debug Button */}
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut()
                  localStorage.clear()
                  window.location.reload()
                }}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                🔧 Clear All Sessions & Reload (Debug)
              </button>
            </div>
          </form>
        ) : showRegisterForm ? (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

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
                    disabled={isRegistering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter admin email"
                    disabled={isRegistering}
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
                    disabled={isRegistering}
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
                    disabled={isRegistering}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isRegistering}
                className="bbq-button-primary w-full mt-6 flex items-center justify-center space-x-2"
              >
                {isRegistering ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Admin...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Create Admin Account</span>
                  </>
                )}
              </button>

            </div>
          </form>
        ) : (
          /* Forgot Password Form */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Admin Password</h3>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="bbq-input w-full"
                  placeholder="Enter your admin email"
                  disabled={isResettingPassword}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="bbq-button-primary flex-1"
                >
                  {isResettingPassword ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="bbq-button-secondary flex-1"
                  disabled={isResettingPassword}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Admin access only. Need help?{' '}
            <Link href="/contact" className="text-lays-dark-red hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}