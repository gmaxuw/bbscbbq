/**
 * SUPABASE CLIENT CONFIGURATION - ADMIN DASHBOARD
 * 
 * This file provides Supabase client configuration for the admin dashboard:
 * - Database connection and authentication
 * - Real-time subscriptions for orders
 * - Storage buckets for payment screenshots
 * - Error handling and logging
 * 
 * WARNING: This is part of the admin dashboard system
 * STATUS: UPDATED FOR 2025 - No more auth-helpers dependency
 * LOCATION: Core infrastructure for admin functionality
 * PURPOSE: Provide Supabase access for all admin operations
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Environment variables for Supabase 2025 configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid environment variables (2025 compatible)
const hasValidEnvVars = supabaseUrl && supabasePublishableKey && 
  supabaseUrl.startsWith('https://') && 
  !supabasePublishableKey.includes('placeholder-key')

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Variables Debug (2025):', {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    supabasePublishableKey: supabasePublishableKey ? `${supabasePublishableKey.substring(0, 30)}...` : 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    hasValidEnvVars: hasValidEnvVars
  })
}

// Debug logging for mobile troubleshooting
if (typeof window !== 'undefined') {
  console.log('Supabase Client Debug (2025):', {
    hasValidEnvVars,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    supabasePublishableKey: supabasePublishableKey ? `${supabasePublishableKey.substring(0, 20)}...` : 'undefined'
  })
}

// Create Supabase client with 2025 compatible configuration
export const supabase = hasValidEnvVars 
  ? createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createSupabaseClient('https://prqfpxrtopguvelmflhk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycWZweHJ0b3BndXZlbG1mbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzAxMDcsImV4cCI6MjA3MjA0NjEwN30.AjdPycuLam0DW6PMutFrLXfHD9Zgztjp0cXMvDxTr64', {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

// Export createClient function - simplified for 2025 (no more auth-helpers)
export const createClient = () => supabase

// For backward compatibility - same as createClient
export const createClientComponentClient = () => supabase

// Server-side client for admin operations (use with SERVICE_ROLE_KEY)
export const createServerClient = () => {
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
  }
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Database table names for type safety
export const TABLES = {
  USERS: 'users',
  BRANCHES: 'branches',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  CREW_ATTENDANCE: 'crew_attendance',
  PROMO_CODES: 'promo_codes',
  SALES_REPORTS: 'sales_reports',
  SYSTEM_LOGS: 'system_logs'
} as const

// Storage bucket names
export const STORAGE_BUCKETS = {
  PAYMENT_SCREENSHOTS: 'payment-screenshots',
  PRODUCT_IMAGES: 'product-images'
} as const

// Order status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled'
} as const

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CREW: 'crew',
  CUSTOMER: 'customer'
} as const

// Export types for use in components
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

// Helper function to check if user is admin
export const isAdmin = (role: string) => role === USER_ROLES.ADMIN

// Helper function to check if user is crew
export const isCrew = (role: string) => role === USER_ROLES.CREW

// Helper function to check if user is customer
export const isCustomer = (role: string) => role === USER_ROLES.CUSTOMER
