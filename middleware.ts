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
      // TEMPORARY: Disable middleware protection to fix redirect loop
      // Let the individual pages handle authentication
      console.log('⚠️ Middleware: Temporarily disabled - letting page handle auth')
      
      // TODO: Re-enable once we figure out the correct cookie names
      // const accessToken = req.cookies.get('sb-access-token')
      // const refreshToken = req.cookies.get('sb-refresh-token')
      
    } catch (error) {
      console.error('Middleware error:', error)
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
