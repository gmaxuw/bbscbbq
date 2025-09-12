'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, LogIn, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react'
import DesignLock from '@/components/layout/DesignLock'
import { createClient } from '@/lib/supabase'

export default function CrewLogin() {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    branchId: ''
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Load branches for registration
  useEffect(() => {
    loadBranches()
  }, [])

  const loadBranches = async () => {
    try {
      console.log('🔄 Loading branches for crew registration...')
      
      // Test connection first
      const { data: testData, error: testError } = await supabase
        .from('branches')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError)
        setError('Database connection failed. Please check your internet connection and try again.')
        return
      }
      
      console.log('✅ Supabase connection test passed')
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ Error loading branches:', error)
        setError('Failed to load branch data. Please try again.')
        return
      }

      console.log('✅ Branches loaded successfully:', data?.length || 0)
      setBranches(data || [])
    } catch (error) {
      console.error('❌ Error loading branches:', error)
      setError('Network error. Please check your internet connection and try again.')
    }
  }

  // Check for existing session on page load
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log('✅ Crew session found, checking role for:', session.user.id)
          
          // Check if user is crew
          const { data: crewUser, error } = await supabase
            .from('admin_users')
            .select('role, name, branch_id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()

          if (!error && crewUser && crewUser.role === 'crew') {
            console.log('🚀 Crew verified, redirecting to dashboard')
            window.location.href = '/crew/dashboard'
            return
          } else {
            console.log('❌ Crew user not found for:', session.user.id)
            // Clear invalid session
            await supabase.auth.signOut()
          }
        } else {
          console.log('📝 No active session, showing login form')
        }
      } catch (error) {
        console.error('Session check error:', error)
        // Clear session on error
        await supabase.auth.signOut()
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
      console.log('🔐 Crew login attempt for:', loginData.email)
      console.log('🔐 Email after processing:', loginData.email.toLowerCase().trim())
      console.log('🔐 Password length:', loginData.password.length)

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(loginData.email)) {
        setError('Please enter a valid email address')
        return
      }

      // Clear any existing sessions first
      await supabase.auth.signOut()

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email.toLowerCase().trim(),
        password: loginData.password
      })

      if (authError || !authData.user) {
        console.error('❌ Crew auth failed:', authError?.message)
        
        if (authError?.message.includes('Invalid login credentials')) {
          // Check if this is a crew user that exists in admin_users but not in auth
          const { data: crewUser } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', loginData.email.toLowerCase().trim())
            .eq('role', 'crew')
            .single()

          if (crewUser) {
            setError('This crew account exists but needs to be activated. Please contact your administrator to create your login credentials.')
          } else {
            setError('Invalid email or password. If this is your first login, use the default password: temp123456')
          }
        } else if (authError?.message.includes('Email not confirmed')) {
          setError('Your email confirmation has expired. Please contact your administrator to resend the confirmation email.')
        } else if (authError?.message.includes('missing email or phone')) {
          setError('Email is required. Please enter a valid email address.')
        } else if (authError?.message.includes('Request rate limit reached') || authError?.message.includes('too many requests')) {
          setIsRateLimited(true)
          setError('Too many requests. Please wait 5 minutes before trying again.')
          // Reset rate limit after 5 minutes
          setTimeout(() => setIsRateLimited(false), 300000)
        } else {
          setError(`Login failed: ${authError?.message || 'Please check your credentials and try again.'}`)
        }
        return
      }

      // Verify this user is a crew member
      console.log('🔍 Looking for crew user with user_id:', authData.user.id)
      console.log('🔍 User email:', authData.user.email)
      
      // Wait a moment for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Try multiple approaches to find the crew user
      let crewUser = null
      let crewError = null
      
      // Approach 1: Query by user_id
      try {
        console.log('🔍 Trying query by user_id...')
        const result1 = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('is_active', true)
          .single()
        
        if (result1.data && result1.data.role === 'crew') {
          crewUser = result1.data
          console.log('✅ Found crew user by user_id:', crewUser.name)
        } else {
          crewError = result1.error
        }
      } catch (error) {
        console.log('❌ Query by user_id failed:', error)
      }
      
      // Approach 2: Query by email if first approach failed
      if (!crewUser) {
        try {
          console.log('🔍 Trying query by email...')
          const result2 = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', loginData.email.toLowerCase().trim())
            .eq('is_active', true)
            .single()
          
          if (result2.data && result2.data.role === 'crew') {
            crewUser = result2.data
            console.log('✅ Found crew user by email:', crewUser.name)
          } else {
            crewError = result2.error
          }
        } catch (error) {
          console.log('❌ Query by email failed:', error)
        }
      }
      
      // Approach 3: Query by auth email if both failed
      if (!crewUser && authData.user.email) {
        try {
          console.log('🔍 Trying query by auth email...')
          const result3 = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', authData.user.email.toLowerCase().trim())
            .eq('is_active', true)
            .single()
          
          if (result3.data && result3.data.role === 'crew') {
            crewUser = result3.data
            console.log('✅ Found crew user by auth email:', crewUser.name)
          } else {
            crewError = result3.error
          }
        } catch (error) {
          console.log('❌ Query by auth email failed:', error)
        }
      }

      console.log('🔍 Final crew user result:', { crewUser, crewError })

      if (!crewUser || crewUser.role !== 'crew') {
        console.error('❌ Invalid crew user or role:', crewError)
        await supabase.auth.signOut()
        setError('This account does not have crew access or is not active. Please contact your administrator.')
        return
      }

      if (!crewUser.branch_id) {
        console.error('❌ Crew not assigned to branch')
        await supabase.auth.signOut()
        setError('Your crew account is not assigned to a branch. Please contact your administrator.')
        return
      }

      console.log('✅ Crew login successful:', {
        role: crewUser.role,
        name: crewUser.name,
        branch_id: crewUser.branch_id
      })

      // Store crew info in localStorage for quick access
      localStorage.setItem('crew_role', crewUser.role)
      localStorage.setItem('crew_branch_id', crewUser.branch_id)
      localStorage.setItem('crew_user_id', authData.user.id)
      localStorage.setItem('crew_name', crewUser.name)

      // Wait for session to fully hydrate, then redirect
      console.log('⏳ Waiting for session hydration...')
      
      // Give Supabase time to sync the session
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify session is properly set
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        console.log('✅ Session confirmed, redirecting to crew dashboard')
        window.location.href = '/crew/dashboard'
      } else {
        console.log('❌ Session not found after login')
        setError('Session error - please try again')
      }

    } catch (error) {
      console.error('Crew login error:', error)
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
        redirectTo: `${window.location.origin}/account/reset-password?crew=true&email=${encodeURIComponent(forgotPasswordEmail)}`
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

    if (!registerData.branchId) {
      setError('Please select a branch!')
      return
    }

    setIsRegistering(true)
    setError('')

    try {
      console.log('🆕 CREW REGISTRATION ATTEMPT!')

      // Check if email already exists in admin_users
      console.log('🔍 Checking email availability for:', registerData.email.toLowerCase().trim())
      
      const { data: existingAdminUser, error: checkError } = await supabase
        .from('admin_users')
        .select('email, role, name')
        .eq('email', registerData.email.toLowerCase().trim())
        .maybeSingle()

      if (checkError) {
        console.error('❌ Error checking existing email:', checkError)
        if (checkError.message.includes('connection') || checkError.message.includes('network')) {
          setError('Network error. Please check your internet connection and try again.')
        } else {
          setError('Error checking email availability. Please try again.')
        }
        return
      }
      
      console.log('✅ Email availability check completed')

      if (existingAdminUser) {
        setError(`This email is already registered as ${existingAdminUser.role}. Please use a different email or contact admin.`)
        return
      }


      // Create crew account in Supabase Auth
      console.log('🔐 Creating auth user for:', registerData.email.toLowerCase().trim())
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
            role: 'crew'
          },
          emailRedirectTo: `${window.location.origin}/crew/dashboard`
        }
      })

      console.log('🔐 Auth response:', { authData, authError })

      if (authError) {
        console.error('❌ Auth registration error:', authError)
        if (authError.message.includes('already registered') || 
            authError.message.includes('already been registered') ||
            authError.message.includes('User already registered') ||
            authError.message.includes('already exists')) {
          setError('❌ This email is already registered in our system. Please use a different email or contact admin for assistance.')
        } else if (authError.message.includes('Invalid email')) {
          setError('❌ Please enter a valid email address.')
        } else if (authError.message.includes('Password should be at least')) {
          setError('❌ Password must be at least 6 characters long.')
        } else if (authError.message.includes('Signup is disabled')) {
          setError('❌ Registration is currently disabled. Please contact admin.')
        } else {
          setError('❌ Error creating crew account: ' + authError.message)
        }
        return
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup')
        setError('Account creation failed. Please try again.')
        return
      }

      console.log('✅ Auth user created successfully:', authData.user.id)

      // Wait a moment for the auth user to be fully created in the database
      console.log('⏳ Waiting for auth user to be available in database...')
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Sign in the user first to establish authentication context
      console.log('🔐 Signing in user to establish authentication context...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: registerData.email.toLowerCase().trim(),
        password: registerData.password
      })

      if (signInError || !signInData.user) {
        console.error('❌ Sign in after registration failed:', signInError)
        setError('Account created but failed to establish session. Please try logging in manually.')
        return
      }

      console.log('✅ User signed in successfully, creating admin_users record...')

      // Create admin_users record with authenticated user
      console.log('👥 Creating admin_users record for:', {
        user_id: signInData.user.id,
        email: registerData.email.toLowerCase().trim(),
        name: registerData.fullName,
        role: 'crew',
        branch_id: registerData.branchId
      })

      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          user_id: signInData.user.id,
          email: registerData.email.toLowerCase().trim(),
          name: registerData.fullName,
          role: 'crew',
          branch_id: registerData.branchId,
          is_active: false // Pending admin approval
        }])

      if (adminError) {
        console.error('❌ Admin user creation error:', adminError)
        if (adminError.code === '23505') { // Unique constraint violation
          setError('❌ This email is already registered. Please use a different email or contact admin.')
        } else if (adminError.code === '23503') { // Foreign key constraint violation
          setError('❌ Invalid branch selection. Please select a valid branch and try again.')
        } else if (adminError.code === '23502') { // Not null constraint violation
          setError('❌ Missing required information. Please fill in all fields.')
        } else {
          setError('❌ Error creating crew record: ' + adminError.message)
        }
        return
      }

      console.log('✅ Admin user record created successfully')

      console.log('✅ Crew registration successful!')
      setError('')
      alert('✅ Crew account created successfully!\n\n📧 Please check your email to verify your account.\n🚀 After verification, you will be redirected to the crew dashboard.\n⏳ Your application is pending admin approval.')
      
      // Reset form and show login
      setRegisterData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        branchId: ''
      })
      setShowRegisterForm(false)

    } catch (error) {
      console.error('Registration error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DesignLock pageName="Crew Login" />
      
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
              <Users className="w-6 h-6 text-lays-dark-red" />
              <h1 className="text-2xl font-bold text-gray-900">Crew Sign In</h1>
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
              setError('')
            }}
            className={`w-1/2 py-2 px-4 rounded-md font-semibold transition-colors ${
              !showRegisterForm
                ? 'bg-white text-lays-dark-red shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setShowRegisterForm(true)
              setError('')
            }}
            className={`w-1/2 py-2 px-4 rounded-md font-semibold transition-colors ${
              showRegisterForm
                ? 'bg-white text-lays-dark-red shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join Crew
          </button>
        </div>

        {/* Login Form */}
        {!showRegisterForm ? (
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
                  Crew Email
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  className="bbq-input w-full"
                  placeholder="Enter your crew email"
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
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>

          </div>
        </form>
        ) : (
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="bbq-input w-full"
                    placeholder="Enter your email"
                    disabled={isRegistering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Branch
                  </label>
                  <select
                    required
                    value={registerData.branchId}
                    onChange={(e) => setRegisterData({...registerData, branchId: e.target.value})}
                    className="bbq-input w-full"
                    disabled={isRegistering}
                  >
                    <option value="">Select a branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
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
                    <span>Joining Crew...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Join Our Crew</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your application will be reviewed by admin before approval
              </p>
            </div>
          </form>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Crew Password</h3>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crew Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="bbq-input w-full"
                  placeholder="Enter your crew email"
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
            {showRegisterForm ? (
              <>Crew access only. Your application will be reviewed by admin.</>
            ) : (
              <>Need help?{' '}
                <Link href="/contact" className="text-lays-dark-red hover:underline">
                  Contact Support
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
