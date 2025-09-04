import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Define protected routes (excluding login pages)
  const adminRoutes = ['/admin']
  const crewRoutes = ['/crew']
  const protectedRoutes = [...adminRoutes, ...crewRoutes]

  // Exclude login pages from protection
  const isLoginPage = req.nextUrl.pathname === '/admin/login' || 
                     req.nextUrl.pathname === '/crew/login'

  // Check if the current path is protected (but not a login page)
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  ) && !isLoginPage

  if (isProtectedRoute) {
    try {
      // Get the current session using the middleware client
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('🚫 Middleware: No session found, redirecting to login')
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Verify the user has admin/crew role
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('role, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single()

      if (error || !adminUser) {
        console.log('🚫 Middleware: User not found in admin_users table')
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(redirectUrl)
      }

      console.log('✅ Middleware: User authenticated and authorized:', adminUser.role)
      
    } catch (error) {
      console.error('Middleware error:', error)
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('error', 'server_error')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
