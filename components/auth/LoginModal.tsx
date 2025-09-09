'use client'

import { useState } from 'react'
import { X, User, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: any) => void
  onGuestContinue: () => void
}

export default function LoginModal({ isOpen, onClose, onSuccess, onGuestContinue }: LoginModalProps) {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: ''
  })

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      })

      if (authError || !authData.user) {
        setError('Invalid email or password')
        return
      }

      // Check if user has customer role
      const userRole = authData.user.user_metadata?.role
      if (userRole !== 'customer') {
        setError('This account is not a customer account')
        return
      }

      // Store customer data
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_email', authData.user.email || '')
        localStorage.setItem('customer_name', authData.user.user_metadata?.full_name || '')
        localStorage.setItem('customer_phone', authData.user.user_metadata?.phone || '')
        localStorage.setItem('customer_id', authData.user.id)
      }

      onSuccess(authData.user)
      onClose()
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            phone: registerData.phone,
            role: 'customer'
          }
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Registration failed')
        return
      }

      // Store customer data
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_email', authData.user.email || '')
        localStorage.setItem('customer_name', registerData.fullName)
        localStorage.setItem('customer_phone', registerData.phone)
        localStorage.setItem('customer_id', authData.user.id)
      }

      onSuccess(authData.user)
      onClose()
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {isRegistering ? 'Create Account' : 'Login to Continue'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isRegistering ? (
            // Registration Form
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lays-orange-gold text-white py-2 px-4 rounded-lg hover:bg-lays-dark-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-lays-orange-gold hover:text-lays-dark-red text-sm"
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lays-orange-gold focus:border-transparent"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-lays-orange-gold text-white py-2 px-4 rounded-lg hover:bg-lays-dark-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login</span>
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-lays-orange-gold hover:text-lays-dark-red text-sm"
                >
                  Don't have an account? Register
                </button>
              </div>
            </form>
          )}

          {/* Guest Continue Option */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Or continue as guest (limited features)
              </p>
              <button
                onClick={onGuestContinue}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <User className="w-4 h-4" />
                <span>Continue as Guest</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
