import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // TEMPORARILY DISABLE ALL MIDDLEWARE TO STOP INFINITE LOOPS
  console.log('🚫 Middleware: DISABLED - Allowing all requests to proceed')
  return NextResponse.next()
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
