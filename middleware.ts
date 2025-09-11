import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = req.nextUrl

  const isAdminArea = pathname.startsWith('/admin')
  const isCrewArea = pathname.startsWith('/crew')
  const isAdminLogin = pathname.startsWith('/admin/login')
  const isCrewLogin = pathname.startsWith('/crew/login')

  // Protect admin routes (except login)
  if (isAdminArea && !isAdminLogin) {
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Protect crew routes (except login)
  if (isCrewArea && !isCrewLogin) {
    if (!session) {
      const url = req.nextUrl.clone()
      url.pathname = '/crew/login'
      url.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(url)
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
     * - admin/login (login pages)
     * - crew/login (login pages)
     */
    '/((?!_next/static|_next/image|favicon.ico|admin/login|crew/login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
