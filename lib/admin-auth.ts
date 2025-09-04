/**
 * 🔐 SEPARATE ADMIN AUTHENTICATION SYSTEM 🛡️
 * 
 * This file provides isolated admin authentication that doesn't interfere
 * with customer authentication. It uses a separate session management system.
 */

import { createClient } from './supabase'

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'crew'
  branch_id?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

class AdminAuthManager {
  private static instance: AdminAuthManager
  private supabase = createClient()
  private adminSession: AdminUser | null = null
  private sessionKey = 'admin_session_data'

  private constructor() {
    this.loadSessionFromStorage()
  }

  static getInstance(): AdminAuthManager {
    if (!AdminAuthManager.instance) {
      AdminAuthManager.instance = new AdminAuthManager()
    }
    return AdminAuthManager.instance
  }

  private loadSessionFromStorage() {
    // Only run in browser environment
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(this.sessionKey)
      if (stored) {
        this.adminSession = JSON.parse(stored)
        console.log('🔐 Admin session loaded from storage:', this.adminSession?.email)
      }
    } catch (error) {
      console.error('Failed to load admin session:', error)
      this.clearSession()
    }
  }

  private saveSessionToStorage(adminUser: AdminUser) {
    // Only run in browser environment
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(adminUser))
      this.adminSession = adminUser
      console.log('💾 Admin session saved to storage:', adminUser.email)
    } catch (error) {
      console.error('Failed to save admin session:', error)
    }
  }

  private clearSession() {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.sessionKey)
    }
    this.adminSession = null
    console.log('🧹 Admin session cleared')
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; user?: AdminUser }> {
    try {
      console.log('🔐 Admin sign in attempt for:', email)

      // First, verify this is an admin user
      const { data: adminUser, error: adminError } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        console.log('❌ Admin user not found:', email)
        return { success: false, error: 'Invalid admin credentials' }
      }

      // Create a separate Supabase client for admin auth
      const adminSupabase = createClient()
      
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await adminSupabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      })

      if (authError || !authData.user) {
        console.log('❌ Admin auth failed:', authError?.message)
        return { success: false, error: 'Invalid email or password' }
      }

      // Verify the auth user matches the admin user
      if (authData.user.id !== adminUser.user_id) {
        console.log('❌ User ID mismatch')
        await adminSupabase.auth.signOut()
        return { success: false, error: 'Authentication mismatch' }
      }

      // Save admin session
      const adminSessionData: AdminUser = {
        id: adminUser.user_id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        branch_id: adminUser.branch_id,
        is_active: adminUser.is_active
      }

      this.saveSessionToStorage(adminSessionData)
      console.log('✅ Admin sign in successful:', adminUser.email)

      return { success: true, user: adminSessionData }

    } catch (error) {
      console.error('Admin sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🚪 Admin sign out')
      
      // Sign out from Supabase
      await this.supabase.auth.signOut()
      
      // Clear admin session
      this.clearSession()
      
      console.log('✅ Admin sign out successful')
    } catch (error) {
      console.error('Admin sign out error:', error)
      // Clear session anyway
      this.clearSession()
    }
  }

  getCurrentUser(): AdminUser | null {
    return this.adminSession
  }

  isSignedIn(): boolean {
    return this.adminSession !== null && this.adminSession.is_active
  }

  hasRole(role: 'admin' | 'crew'): boolean {
    return this.isSignedIn() && this.adminSession?.role === role
  }

  isAdmin(): boolean {
    return this.hasRole('admin')
  }

  isCrew(): boolean {
    return this.hasRole('crew')
  }
}

// Export singleton instance
export const adminAuth = AdminAuthManager.getInstance()

// Export types
export type { AdminUser }