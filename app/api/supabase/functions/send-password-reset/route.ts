import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()
    
    if (!email || !redirectTo) {
      return NextResponse.json(
        { success: false, error: 'Email and redirectTo are required' },
        { status: 400 }
      )
    }

    // Get Supabase project URL and service key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://prqfpxrtopguvelmflhk.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
    
    if (!supabaseServiceKey) {
      console.error('Missing Supabase service key configuration')
      return NextResponse.json(
        { success: false, error: 'Supabase service key not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Direct Supabase call for password reset
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    if (error) {
      console.error('Supabase password reset error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Password reset email sent' },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
