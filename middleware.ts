import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Get environment variables - try multiple approaches
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.SUPABASE_URL ||
                     'https://prqfpxrtopguvelmflhk.supabase.co'
  
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                     process.env.SUPABASE_PUBLISHABLE_KEY ||
                     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                     'sb_publishable_bMBRmPH0Fdbqqk4jFnIbUw_mT34iyuz'
  
  // Debug logging
  console.log('🔍 Middleware Debug:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
    keyPreview: supabaseKey ? supabaseKey.substring(0, 30) + '...' : 'MISSING',
    envKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })
  
  // Always proceed - don't skip auth check
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Using fallback Supabase credentials in middleware')
  }
  
  try {
    // Create Supabase client with 2025 compatible configuration
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false, // Disable in middleware for performance
        persistSession: false,   // Don't persist in middleware
        detectSessionInUrl: false // Don't detect in middleware
      }
    })

    // Try to get session from request headers
    const authHeader = req.headers.get('Authorization')
    const cookieHeader = req.headers.get('Cookie')
    
    console.log('🔍 Auth Debug:', {
      hasAuthHeader: !!authHeader,
      hasCookieHeader: !!cookieHeader,
      pathname: req.nextUrl.pathname
    })

    // Get session - this might fail if no valid session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.warn('⚠️ Middleware auth error:', error.message)
    }
    
    const { pathname } = req.nextUrl
    const isAdminArea = pathname.startsWith('/admin')
    const isCrewArea = pathname.startsWith('/crew')
    const isCustomerArea = pathname.startsWith('/account') || pathname.startsWith('/favorites') || pathname.startsWith('/orders')
    const isAdminLogin = pathname.startsWith('/admin/login')
    const isCrewLogin = pathname.startsWith('/crew/login')
    const isCustomerLogin = pathname.startsWith('/account/login') || pathname.startsWith('/account/register')
    
    console.log('🔍 Route Debug:', {
      pathname,
      isAdminArea,
      isCrewArea,
      isCustomerArea,
      isAdminLogin,
      isCrewLogin,
      isCustomerLogin,
      hasSession: !!session
    })

    // Skip admin route protection - let admin pages handle their own auth
    // Admin pages have their own authentication logic that works better
    if (isAdminArea && !isAdminLogin) {
      console.log('🔍 Admin route detected, letting admin page handle auth')
      return res
    }

    // Protect crew routes (except login)
    if (isCrewArea && !isCrewLogin) {
      if (!session) {
        console.log('🔒 Redirecting to crew login')
        const url = req.nextUrl.clone()
        url.pathname = '/crew/login'
        url.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(url)
      }
    }

    // Protect customer routes (except login/register) - but skip /account itself to prevent loops
    if (isCustomerArea && !isCustomerLogin && pathname !== '/account') {
      if (!session) {
        console.log('🔒 Redirecting to account page for customer login')
        const url = req.nextUrl.clone()
        url.pathname = '/account'
        url.searchParams.set('redirectedFrom', pathname)
        return NextResponse.redirect(url)
      }
    }

    return res
    
  } catch (error) {
    console.error('❌ Middleware error:', error)
    // If there's an error, let the request through (fail open)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - admin/* (ALL admin routes - let them handle their own auth)
     * - crew/login (crew login pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|admin|crew/login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
