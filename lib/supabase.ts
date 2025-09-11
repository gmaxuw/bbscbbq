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
 * STATUS: INTEGRATED - Uses locked design system
 * LOCATION: Core infrastructure for admin functionality
 * PURPOSE: Provide Supabase access for all admin operations
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClientComponentClient as createSupabaseClientComponent } from '@supabase/auth-helpers-nextjs'

// Environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have valid environment variables
const hasValidEnvVars = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  !supabaseAnonKey.includes('placeholder-key')

// Debug: Log environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment Variables Debug:', {
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'MISSING',
    nodeEnv: process.env.NODE_ENV,
    hasValidEnvVars: hasValidEnvVars
  })
}

// Debug logging for mobile troubleshooting
if (typeof window !== 'undefined') {
  console.log('Supabase Client Debug:', {
    hasValidEnvVars,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
    supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
  })
}

// Create a legacy Supabase client (without Next.js auth cookie integration)
export const supabase = hasValidEnvVars 
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createSupabaseClient('https://prqfpxrtopguvelmflhk.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycWZweHJ0b3BndXZlbG1mbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzQ4NzIsImV4cCI6MjA1MTU1MDg3Mn0.placeholder-key-replace-with-actual', {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

// Export createClient function that RETURNS the Next.js auth-helpers client.
// This ensures auth sessions are synced to cookies that middleware can read.
export const createClient = () => createSupabaseClientComponent()

// Export cookie-based client factory explicitly for components (handles cookies automatically)
export const createClientComponentClient = createSupabaseClientComponent

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
