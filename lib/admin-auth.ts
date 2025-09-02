import { createClient } from '@/lib/supabase'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  role: 'admin' | 'crew'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthResult {
  isAuthenticated: boolean
  user: AdminUser | null
  error: string | null
}

/**
 * Check if current user is authenticated as admin or crew
 */
export async function checkAdminAuth(): Promise<AuthResult> {
  try {
    const supabase = createClient()
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'No active session'
      }
    }

    // Check if user is admin/crew
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (adminError || !adminUser) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'User is not authorized as admin or crew'
      }
    }

    if (!adminUser.is_active) {
      return {
        isAuthenticated: false,
        user: null,
        error: 'Admin account is deactivated'
      }
    }

    return {
      isAuthenticated: true,
      user: adminUser,
      error: null
    }

  } catch (error) {
    console.error('Admin auth check error:', error)
    return {
      isAuthenticated: false,
      user: null,
      error: 'Authentication check failed'
    }
  }
}

/**
 * Check if current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const result = await checkAdminAuth()
  return result.isAuthenticated && result.user?.role === 'admin'
}

/**
 * Check if current user has crew role (or admin)
 */
export async function isCrew(): Promise<boolean> {
  const result = await checkAdminAuth()
  return result.isAuthenticated && (result.user?.role === 'crew' || result.user?.role === 'admin')
}

/**
 * Get current admin user info
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const result = await checkAdminAuth()
  return result.user
}

/**
 * Sign out admin user
 */
export async function signOutAdmin(): Promise<void> {
  try {
    const supabase = createClient()
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_role')
      localStorage.removeItem('admin_user_id')
    }
    
    // Sign out from Supabase
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

/**
 * Create a new admin user (admin only)
 */
export async function createAdminUser(
  email: string, 
  password: string, 
  role: 'admin' | 'crew'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Check if current user is admin
    const isCurrentUserAdmin = await isAdmin()
    if (!isCurrentUserAdmin) {
      return { success: false, error: 'Only admins can create new admin users' }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password: password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/login`
      }
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Failed to create user' }
    }

    // Get current admin user ID
    const currentAdmin = await getCurrentAdminUser()
    if (!currentAdmin) {
      return { success: false, error: 'Current admin user not found' }
    }

    // Create admin user record
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        user_id: authData.user.id,
        email: email.toLowerCase().trim(),
        role: role,
        is_active: true,
        created_by: currentAdmin.user_id
      })

    if (adminError) {
      return { success: false, error: adminError.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Create admin user error:', error)
    return { success: false, error: 'Failed to create admin user' }
  }
}

/**
 * Update admin user status (admin only)
 */
export async function updateAdminUserStatus(
  userId: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    // Check if current user is admin
    const isCurrentUserAdmin = await isAdmin()
    if (!isCurrentUserAdmin) {
      return { success: false, error: 'Only admins can update admin users' }
    }

    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }

  } catch (error) {
    console.error('Update admin user error:', error)
    return { success: false, error: 'Failed to update admin user' }
  }
}
