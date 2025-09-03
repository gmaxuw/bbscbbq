import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession()

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
    // If no session, redirect to admin login
    if (!session) {
      const redirectUrl = new URL('/admin/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin or crew using the new system
    try {
      const userRole = session.user.user_metadata?.role

      if (!userRole || (userRole !== 'admin' && userRole !== 'crew')) {
        // User is not admin/crew
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('error', 'access_denied')
        return NextResponse.redirect(redirectUrl)
      }

      // Check role-based access
      if (req.nextUrl.pathname.startsWith('/admin') && userRole !== 'admin') {
        // Non-admin trying to access admin routes
        const redirectUrl = new URL('/crew', req.url)
        return NextResponse.redirect(redirectUrl)
      }

      if (req.nextUrl.pathname.startsWith('/crew') && userRole !== 'crew' && userRole !== 'admin') {
        // Non-crew trying to access crew routes
        const redirectUrl = new URL('/admin/login', req.url)
        redirectUrl.searchParams.set('error', 'access_denied')
        return NextResponse.redirect(redirectUrl)
      }

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
